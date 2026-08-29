from __future__ import annotations

import cv2
import numpy as np

from app.config import Settings
from app.processor import ImageProcessingError, OpenCvFaceProcessor


class TwoFaceDetector:
    def detectMultiScale3(self, image: np.ndarray, **kwargs: object) -> tuple:
        del image, kwargs
        rectangles = np.array([[8, 8, 40, 40], [72, 8, 40, 40]], dtype=np.int32)
        return rectangles, np.array([1, 1]), np.array([8.5, 7.5])


def encoded_test_image() -> bytes:
    image = np.zeros((64, 128, 3), dtype=np.uint8)
    image[:, :64] = np.tile(np.arange(64, dtype=np.uint8), (64, 1))[:, :, None]
    image[:, 64:] = np.tile(np.arange(64, dtype=np.uint8)[:, None], (1, 64))[:, :, None]
    success, encoded = cv2.imencode(".png", image)
    assert success

    return encoded.tobytes()


def test_returns_one_normalized_embedding_for_every_detected_face() -> None:
    processor = OpenCvFaceProcessor(Settings(), detector=TwoFaceDetector())

    result = processor.process(encoded_test_image(), "image-123")

    assert result.image_uid == "image-123"
    assert result.face_count == 2
    assert len(result.faces) == 2
    assert all(len(face.embedding) == 512 for face in result.faces)
    assert result.faces[0].embedding != result.faces[1].embedding
    np.testing.assert_allclose(np.linalg.norm(result.faces[0].embedding), 1.0, atol=1e-6)
    assert result.embedding == result.faces[0].embedding


def test_rejects_bytes_that_are_not_an_image() -> None:
    processor = OpenCvFaceProcessor(Settings(), detector=TwoFaceDetector())

    try:
        processor.process(b"not-an-image")
    except ImageProcessingError as exception:
        assert "could not decode" in str(exception)
    else:
        raise AssertionError("Invalid image bytes should be rejected.")
