from fastapi import FastAPI

from app.core.settings import settings
from app.schemas.health import HealthResponse


class ImageProcessor(Protocol):
    def process(
        self, contents: bytes, image_uid: str | None = None
    ) -> ImageEmbeddingResponse: ...


app = FastAPI(
    title="FMI Image Processor",
    version="0.1.0",
    description="Detects every frontal face and returns one pgvector-ready embedding per face.",
)


@app.get("/health", response_model=HealthResponse, tags=["system"])
def health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        model=settings.model,
        dimensions=settings.embedding_dimensions,
    )
