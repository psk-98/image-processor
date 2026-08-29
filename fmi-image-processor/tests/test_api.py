from __future__ import annotations

from fastapi.testclient import TestClient

from app.config import Settings
from app.main import create_app
from app.schemas import BoundingBox, FaceEmbedding, ImageEmbeddingResponse


class StubProcessor:
    def process(self, contents: bytes, image_uid: str | None = None) -> ImageEmbeddingResponse:
        assert contents == b"image-contents"
        first = [1.0, 0.0, 0.0]
        second = [0.0, 1.0, 0.0]

        return ImageEmbeddingResponse(
            image_uid=image_uid,
            model="test-model",
            dimensions=3,
            width=100,
            height=80,
            face_count=2,
            faces=[
                FaceEmbedding(
                    face_index=0,
                    bounding_box=BoundingBox(x=2, y=3, width=20, height=20),
                    detection_score=5.5,
                    embedding=first,
                ),
                FaceEmbedding(
                    face_index=1,
                    bounding_box=BoundingBox(x=30, y=3, width=20, height=20),
                    detection_score=5.0,
                    embedding=second,
                ),
            ],
            embedding=first,
        )


def test_process_endpoint_returns_every_face_embedding() -> None:
    settings = Settings(api_token="secret", embedding_dimensions=3)
    client = TestClient(create_app(settings, StubProcessor()))

    response = client.post(
        "/v1/images/process",
        headers={"Authorization": "Bearer secret"},
        files={"image": ("group.jpg", b"image-contents", "image/jpeg")},
        data={"image_uid": "gallery-image-1"},
    )

    assert response.status_code == 200
    assert response.json()["image_uid"] == "gallery-image-1"
    assert response.json()["face_count"] == 2
    assert len(response.json()["faces"]) == 2
    assert response.json()["faces"][1]["embedding"] == [0.0, 1.0, 0.0]


def test_protected_endpoint_rejects_an_invalid_token() -> None:
    settings = Settings(api_token="secret", embedding_dimensions=3)
    client = TestClient(create_app(settings, StubProcessor()))

    response = client.post(
        "/v1/images/embed",
        headers={"Authorization": "Bearer wrong"},
        files={"image": ("face.jpg", b"image-contents", "image/jpeg")},
    )

    assert response.status_code == 401


def test_endpoint_rejects_unsupported_media_types() -> None:
    client = TestClient(create_app(Settings(), StubProcessor()))

    response = client.post(
        "/v1/images/embed",
        files={"image": ("face.gif", b"image-contents", "image/gif")},
    )

    assert response.status_code == 415

