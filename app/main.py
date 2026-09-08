from fastapi import FastAPI

from app.api.main import api_router
from app.core.settings import settings
from app.schemas.health import HealthResponse

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


app.include_router(api_router, prefix=settings.api_v1_str)
