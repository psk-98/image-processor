from __future__ import annotations

from dataclasses import dataclass
from math import ceil, floor
from pathlib import Path
from threading import Lock
from typing import Protocol

import cv2
import numpy as np
from numpy.typing import NDArray

from app.core.settings import Settings
from app.schemas.image_processor import (
    BoundingBox,
    FaceEmbedding,
    ImageEmbeddingResponse,
)


class ImageProcessingError(ValueError):
    """Raised when uploaded image bytes cannot be processed safely."""


class FaceDetector(Protocol):
    def setInputSize(self, input_size: tuple[int, int]) -> None: ...

    def detect(
        self, image: NDArray[np.uint8]
    ) -> tuple[int, NDArray[np.float32] | None]: ...


class FaceRecognizer(Protocol):
    def alignCrop(
        self,
        image: NDArray[np.uint8],
        face: NDArray[np.float32],
    ) -> NDArray[np.uint8]: ...

    def feature(self, aligned_face: NDArray[np.uint8]) -> NDArray[np.float32]: ...


@dataclass(frozen=True, slots=True)
class Detection:
    face: NDArray[np.float32]
    x: int
    y: int
    width: int
    height: int
    score: float


class OpenCvFaceProcessor:
    """Detect faces with YuNet and create identity embeddings with SFace."""

    EMBEDDING_DIMENSIONS = 128

    def __init__(
        self,
        settings: Settings,
        detector: FaceDetector | None = None,
        recognizer: FaceRecognizer | None = None,
    ) -> None:
        self.settings = settings
        self.detector = detector or self._load_detector()
        self.recognizer = recognizer or self._load_recognizer()
        self._inference_lock = Lock()

        if settings.embedding_dimensions != self.EMBEDDING_DIMENSIONS:
            raise RuntimeError(
                "OpenCV SFace produces 128-dimensional embeddings; "
                f"configured value is {settings.embedding_dimensions}."
            )

    def process(
        self, contents: bytes, image_uid: str | None = None
    ) -> ImageEmbeddingResponse:
        image = self._decode(contents)
        height, width = image.shape[:2]

        # The models are shared by FastAPI's thread pool. Serialize access because
        # OpenCV does not guarantee concurrent inference on one DNN model instance.
        with self._inference_lock:
            detections = self._detect_faces(image)
            faces = [
                self._face_embedding(image, detection, face_index)
                for face_index, detection in enumerate(detections)
            ]

        return ImageEmbeddingResponse(
            image_uid=image_uid,
            model=self.settings.model,
            dimensions=self.settings.embedding_dimensions,
            width=width,
            height=height,
            face_count=len(faces),
            faces=faces,
            embedding=faces[0].embedding if faces else None,
            metadata={
                "face_detector": "opencv-yunet-2023mar",
                "descriptor": "opencv-sface-2021dec",
                "embedding_normalization": "l2",
                "face_limit_reached": len(detections) >= self.settings.max_faces,
            },
        )

    def _load_detector(self) -> FaceDetector:
        model_path = self.settings.detector_model_path
        self._require_model(model_path, "YuNet face detector")

        detector_factory = getattr(cv2, "FaceDetectorYN", None)
        if detector_factory is None:
            raise RuntimeError("This OpenCV build does not include FaceDetectorYN.")

        return detector_factory.create(
            str(model_path),
            "",
            (320, 320),
            self.settings.detection_score_threshold,
            self.settings.detection_nms_threshold,
            self.settings.detection_top_k,
        )

    def _load_recognizer(self) -> FaceRecognizer:
        model_path = self.settings.recognizer_model_path
        self._require_model(model_path, "SFace recognizer")

        recognizer_factory = getattr(cv2, "FaceRecognizerSF", None)
        if recognizer_factory is None:
            raise RuntimeError("This OpenCV build does not include FaceRecognizerSF.")

        return recognizer_factory.create(str(model_path), "")

    @staticmethod
    def _require_model(model_path: Path, description: str) -> None:
        if not model_path.is_file():
            raise RuntimeError(
                f"Missing {description} model at {model_path}. "
                "Run `uv run python scripts/download_models.py`."
            )

    def _decode(self, contents: bytes) -> NDArray[np.uint8]:
        if not contents:
            raise ImageProcessingError("The uploaded image is empty.")

        encoded = np.frombuffer(contents, dtype=np.uint8)
        image = cv2.imdecode(encoded, cv2.IMREAD_COLOR)

        if image is None:
            raise ImageProcessingError("OpenCV could not decode the uploaded image.")

        height, width = image.shape[:2]

        if height * width > self.settings.max_image_pixels:
            raise ImageProcessingError(
                f"The decoded image exceeds the {self.settings.max_image_pixels} pixel limit."
            )

        return image

    def _detect_faces(self, image: NDArray[np.uint8]) -> list[Detection]:
        image_height, image_width = image.shape[:2]
        longest_side = max(image_width, image_height)
        scale = min(1.0, self.settings.detector_max_dimension / longest_side)

        if scale < 1.0:
            detector_width = max(1, round(image_width * scale))
            detector_height = max(1, round(image_height * scale))
            detector_image = cv2.resize(
                image,
                (detector_width, detector_height),
                interpolation=cv2.INTER_AREA,
            )
        else:
            detector_image = image
            detector_height, detector_width = image_height, image_width

        self.detector.setInputSize((detector_width, detector_height))
        _result, raw_faces = self.detector.detect(detector_image)

        if raw_faces is None:
            return []

        detections: list[Detection] = []

        for raw_face in raw_faces:
            face = np.asarray(raw_face, dtype=np.float32).copy()

            if face.size < 15 or not np.all(np.isfinite(face)):
                continue

            # YuNet returns x, y, width, height, five x/y landmarks, then score.
            if scale < 1.0:
                face[:14] /= scale

            left = max(0, floor(float(face[0])))
            top = max(0, floor(float(face[1])))
            right = min(image_width, ceil(float(face[0] + face[2])))
            bottom = min(image_height, ceil(float(face[1] + face[3])))
            width = right - left
            height = bottom - top

            if width < self.settings.min_face_size or height < self.settings.min_face_size:
                continue

            detections.append(
                Detection(
                    face=face,
                    x=left,
                    y=top,
                    width=width,
                    height=height,
                    score=float(face[-1]),
                )
            )

        largest = sorted(
            detections,
            key=lambda face: face.width * face.height,
            reverse=True,
        )[: self.settings.max_faces]

        return sorted(largest, key=lambda face: (face.y, face.x))

    def _face_embedding(
        self,
        image: NDArray[np.uint8],
        detection: Detection,
        face_index: int,
    ) -> FaceEmbedding:
        aligned_face = self.recognizer.alignCrop(image, detection.face)

        if aligned_face is None or aligned_face.size == 0:
            raise ImageProcessingError("SFace could not align the detected face.")

        descriptor = (
            self.recognizer.feature(aligned_face).reshape(-1).astype(np.float32)
        )

        if descriptor.size != self.settings.embedding_dimensions:
            raise RuntimeError(
                "Unexpected SFace embedding size: "
                f"expected {self.settings.embedding_dimensions}, got {descriptor.size}."
            )

        if not np.all(np.isfinite(descriptor)):
            raise ImageProcessingError("SFace returned an invalid face embedding.")

        magnitude = float(np.linalg.norm(descriptor))

        if not np.isfinite(magnitude) or magnitude <= np.finfo(np.float32).eps:
            raise ImageProcessingError("SFace returned an empty face embedding.")

        descriptor /= magnitude

        return FaceEmbedding(
            face_index=face_index,
            bounding_box=BoundingBox(
                x=detection.x,
                y=detection.y,
                width=detection.width,
                height=detection.height,
            ),
            detection_score=detection.score,
            embedding=np.round(descriptor, decimals=8).tolist(),
            metadata={
                "alignment": "sface-five-landmark",
                "aligned_size": [
                    int(aligned_face.shape[1]),
                    int(aligned_face.shape[0]),
                ],
            },
        )
