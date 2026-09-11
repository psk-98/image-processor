from __future__ import annotations

import unittest

import cv2
import numpy as np
from numpy.typing import NDArray

from app.core.settings import Settings
from app.utils.open_cv_processor import ImageProcessingError, OpenCvFaceProcessor


class StubDetector:
    def __init__(self, faces: NDArray[np.float32] | None) -> None:
        self.faces = faces
        self.input_size: tuple[int, int] | None = None

    def setInputSize(self, input_size: tuple[int, int]) -> None:
        self.input_size = input_size

    def detect(
        self, _image: NDArray[np.uint8]
    ) -> tuple[int, NDArray[np.float32] | None]:
        return 1, self.faces


class StubRecognizer:
    def __init__(self, descriptor: NDArray[np.float32] | None = None) -> None:
        self.aligned_faces = 0
        self.descriptor = (
            descriptor
            if descriptor is not None
            else np.arange(1, 129, dtype=np.float32).reshape(1, -1)
        )

    def alignCrop(
        self,
        _image: NDArray[np.uint8],
        _face: NDArray[np.float32],
    ) -> NDArray[np.uint8]:
        self.aligned_faces += 1
        return np.zeros((112, 112, 3), dtype=np.uint8)

    def feature(self, _aligned_face: NDArray[np.uint8]) -> NDArray[np.float32]:
        return self.descriptor


def face_row(
    x: float = 20,
    y: float = 10,
    width: float = 50,
    height: float = 50,
    score: float = 0.95,
) -> NDArray[np.float32]:
    # bbox + right eye + left eye + nose + mouth corners + confidence
    return np.asarray(
        [
            x,
            y,
            width,
            height,
            x + 15,
            y + 20,
            x + 35,
            y + 20,
            x + 25,
            y + 30,
            x + 17,
            y + 40,
            x + 33,
            y + 40,
            score,
        ],
        dtype=np.float32,
    )


class OpenCvFaceProcessorTests(unittest.TestCase):
    def settings(self, **overrides: object) -> Settings:
        return Settings(_env_file=None, **overrides)

    def encoded_image(self, width: int = 160, height: int = 100) -> bytes:
        image = np.zeros((height, width, 3), dtype=np.uint8)
        encoded, buffer = cv2.imencode(".png", image)
        self.assertTrue(encoded)
        return buffer.tobytes()

    def test_process_returns_normalized_128_dimension_identity_embedding(self) -> None:
        detector = StubDetector(np.asarray([face_row()], dtype=np.float32))
        recognizer = StubRecognizer()
        processor = OpenCvFaceProcessor(
            self.settings(), detector=detector, recognizer=recognizer
        )

        result = processor.process(self.encoded_image(), "image-uid")

        self.assertEqual(result.image_uid, "image-uid")
        self.assertEqual(result.model, "opencv-sface-2021dec-v1")
        self.assertEqual(result.dimensions, 128)
        self.assertEqual(result.face_count, 1)
        self.assertEqual(len(result.faces[0].embedding), 128)
        self.assertAlmostEqual(np.linalg.norm(result.faces[0].embedding), 1.0, places=6)
        self.assertEqual(result.embedding, result.faces[0].embedding)
        self.assertEqual(result.metadata["descriptor"], "opencv-sface-2021dec")
        self.assertEqual(recognizer.aligned_faces, 1)

    def test_process_returns_no_embedding_when_no_face_is_detected(self) -> None:
        detector = StubDetector(None)
        processor = OpenCvFaceProcessor(
            self.settings(), detector=detector, recognizer=StubRecognizer()
        )

        result = processor.process(self.encoded_image())

        self.assertEqual(result.face_count, 0)
        self.assertEqual(result.faces, [])
        self.assertIsNone(result.embedding)

    def test_detector_coordinates_are_scaled_back_to_the_original_image(self) -> None:
        detector = StubDetector(
            np.asarray([face_row(x=20, y=10, width=40, height=40)], dtype=np.float32)
        )
        processor = OpenCvFaceProcessor(
            self.settings(detector_max_dimension=320, min_face_size=16),
            detector=detector,
            recognizer=StubRecognizer(),
        )
        image = np.zeros((400, 800, 3), dtype=np.uint8)

        detections = processor._detect_faces(image)

        self.assertEqual(detector.input_size, (320, 160))
        self.assertEqual(len(detections), 1)
        self.assertEqual(
            (
                detections[0].x,
                detections[0].y,
                detections[0].width,
                detections[0].height,
            ),
            (50, 25, 100, 100),
        )

    def test_empty_upload_is_rejected(self) -> None:
        processor = OpenCvFaceProcessor(
            self.settings(), detector=StubDetector(None), recognizer=StubRecognizer()
        )

        with self.assertRaisesRegex(ImageProcessingError, "empty"):
            processor.process(b"")

    def test_non_finite_embedding_is_rejected(self) -> None:
        descriptor = np.ones((1, 128), dtype=np.float32)
        descriptor[0, 5] = np.nan
        processor = OpenCvFaceProcessor(
            self.settings(),
            detector=StubDetector(np.asarray([face_row()], dtype=np.float32)),
            recognizer=StubRecognizer(descriptor),
        )

        with self.assertRaisesRegex(ImageProcessingError, "invalid"):
            processor.process(self.encoded_image())

    def test_zero_embedding_is_rejected(self) -> None:
        processor = OpenCvFaceProcessor(
            self.settings(),
            detector=StubDetector(np.asarray([face_row()], dtype=np.float32)),
            recognizer=StubRecognizer(np.zeros((1, 128), dtype=np.float32)),
        )

        with self.assertRaisesRegex(ImageProcessingError, "empty face embedding"):
            processor.process(self.encoded_image())


if __name__ == "__main__":
    unittest.main()
