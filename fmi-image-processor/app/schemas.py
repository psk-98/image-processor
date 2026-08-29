from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class BoundingBox(BaseModel):
    model_config = ConfigDict(extra="forbid")

    x: int = Field(ge=0)
    y: int = Field(ge=0)
    width: int = Field(gt=0)
    height: int = Field(gt=0)


class FaceEmbedding(BaseModel):
    model_config = ConfigDict(extra="forbid")

    face_index: int = Field(ge=0)
    bounding_box: BoundingBox
    detection_score: float | None = None
    embedding: list[float]
    metadata: dict[str, object] = Field(default_factory=dict)


class ImageEmbeddingResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    image_uid: str | None = None
    model: str
    dimensions: int = Field(gt=0)
    width: int = Field(gt=0)
    height: int = Field(gt=0)
    face_count: int = Field(ge=0)
    faces: list[FaceEmbedding]
    embedding: list[float] | None = None
    metadata: dict[str, object] = Field(default_factory=dict)


class HealthResponse(BaseModel):
    status: str
    model: str
    dimensions: int

