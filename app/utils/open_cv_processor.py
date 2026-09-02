from typing import Protocol

import cv2
import numpy as np
from numpy.typing import NDArray
from pydantic.dataclasses import dataclass

from app.core.settings import Settings
from app.schemas.image_processor import FaceEmbedding, ImageEmbeddingResponse


class ImageProcessingError(ValueError):
    """Raised when uploaded image bytes cannot be processed safely."""


class FaceDetector(Protocol):
    def detectMultiScale3(
        self, image: NDArray[np.uint8], **kwargs: object
    ) -> tuple: ...


@dataclass(frozen=True, slots=True)
class Detection:
    x: int
    y: int
    width: int
    height: int
    score: float | None


class OpenCvFaceProcessor:
    _HOG_SIZE = (64, 64)

    def __init__(
        self, settings: Settings, detector: FaceDetector | None = None
    ) -> None:
        self.settings = settings
        self.detector = detector or self._load_detector()
        self.hog = cv2.HOGDescriptor(
            self._HOG_SIZE,
            (16, 16),
            (8, 8),
            (8, 8),
            9,
        )

    def process(
        self, contents: bytes, image_uid: str | None = None
    ) -> ImageEmbeddingResponse:
        image = self._decode(contents)
        height, width = image.shape[:2]
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
                "face_detector": "opencv-haar-frontalface-default",
                "descriptor": "opencv-hog-feature-hash",
                "face_limit_reached": len(detections) >= self.settings.max_faces,
            },
        )

    def _load_detector(self) -> FaceDetector:
        cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        detector = cv2.CascadeClassifier(cascade_path)

        if detector.empty():
            raise RuntimeError(f"Unable to load OpenCV face cascade: {cascade_path}")

        return detector

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
        grayscale = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        grayscale = cv2.equalizeHist(grayscale)
        rectangles, _reject_levels, level_weights = self.detector.detectMultiScale3(
            grayscale,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(self.settings.min_face_size, self.settings.min_face_size),
            outputRejectLevels=True,
        )

        weights = np.asarray(level_weights).reshape(-1)
        detections = [
            Detection(
                x=int(rectangle[0]),
                y=int(rectangle[1]),
                width=int(rectangle[2]),
                height=int(rectangle[3]),
                score=float(weights[index]) if index < len(weights) else None,
            )
            for index, rectangle in enumerate(rectangles)
        ]
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
        crop = self._crop_with_padding(image, detection)
        grayscale = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
        normalized = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8)).apply(
            grayscale
        )
        normalized = cv2.resize(
            normalized, self._HOG_SIZE, interpolation=cv2.INTER_AREA
        )
        descriptor = self.hog.compute(normalized).reshape(-1).astype(np.float32)
        embedding = self._feature_hash(descriptor)

        return FaceEmbedding(
            face_index=face_index,
            bounding_box=BoundingBox(
                x=detection.x,
                y=detection.y,
                width=detection.width,
                height=detection.height,
            ),
            detection_score=detection.score,
            embedding=embedding.tolist(),
            metadata={
                "crop_padding_ratio": 0.15,
                "descriptor_pixels": [self._HOG_SIZE[0], self._HOG_SIZE[1]],
            },
        )

    def _face_embedding(
        self,
        image: NDArray[np.uint8],
        detection: Detection,
        face_index: int,
    ) -> FaceEmbedding:
        crop = self._crop_with_padding(image, detection)
        grayscale = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
        normalized = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8)).apply(
            grayscale
        )
        normalized = cv2.resize(
            normalized, self._HOG_SIZE, interpolation=cv2.INTER_AREA
        )
        descriptor = self.hog.compute(normalized).reshape(-1).astype(np.float32)
        embedding = self._feature_hash(descriptor)

        return FaceEmbedding(
            face_index=face_index,
            bounding_box=BoundingBox(
                x=detection.x,
                y=detection.y,
                width=detection.width,
                height=detection.height,
            ),
            detection_score=detection.score,
            embedding=embedding.tolist(),
            metadata={
                "crop_padding_ratio": 0.15,
                "descriptor_pixels": [self._HOG_SIZE[0], self._HOG_SIZE[1]],
            },
        )

    def _crop_with_padding(
        self,
        image: NDArray[np.uint8],
        detection: Detection,
    ) -> NDArray[np.uint8]:
        image_height, image_width = image.shape[:2]
        padding_x = round(detection.width * 0.15)
        padding_y = round(detection.height * 0.15)
        start_x = max(0, detection.x - padding_x)
        start_y = max(0, detection.y - padding_y)
        end_x = min(image_width, detection.x + detection.width + padding_x)
        end_y = min(image_height, detection.y + detection.height + padding_y)

        return image[start_y:end_y, start_x:end_x]

    def _feature_hash(self, descriptor: NDArray[np.float32]) -> NDArray[np.float32]:
        dimensions = self.settings.embedding_dimensions
        feature_positions = np.arange(descriptor.size, dtype=np.uint64)
        bucket_indices = (
            feature_positions * np.uint64(2_654_435_761) + np.uint64(1_013_904_223)
        ) % np.uint64(dimensions)
        signs = np.where(
            ((feature_positions * np.uint64(2_246_822_519)) >> np.uint64(16))
            & np.uint64(1),
            1.0,
            -1.0,
        ).astype(np.float32)
        embedding = np.zeros(dimensions, dtype=np.float32)
        np.add.at(embedding, bucket_indices.astype(np.intp), descriptor * signs)
        magnitude = float(np.linalg.norm(embedding))

        if magnitude <= np.finfo(np.float32).eps:
            embedding[0] = 1.0
        else:
            embedding /= magnitude

        return np.round(embedding, decimals=8)
