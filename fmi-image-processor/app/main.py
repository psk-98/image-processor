from __future__ import annotations

from typing import Annotated, Protocol

from fastapi import Depends, FastAPI, File, Form, HTTPException, UploadFile, status
from fastapi.concurrency import run_in_threadpool

from app.config import Settings
from app.processor import ImageProcessingError, OpenCvFaceProcessor
from app.schemas import HealthResponse, ImageEmbeddingResponse
from app.security import require_api_token

CHUNK_SIZE = 1024 * 1024


class ImageProcessor(Protocol):
    def process(self, contents: bytes, image_uid: str | None = None) -> ImageEmbeddingResponse: ...


def create_app(
    settings: Settings | None = None,
    processor: ImageProcessor | None = None,
) -> FastAPI:
    application_settings = settings or Settings()
    application = FastAPI(
        title="FMI Image Processor",
        version="0.1.0",
        description="Detects every frontal face and returns one pgvector-ready embedding per face.",
    )
    application.state.settings = application_settings
    application.state.processor = processor or OpenCvFaceProcessor(application_settings)

    @application.get("/health", response_model=HealthResponse, tags=["system"])
    def health() -> HealthResponse:
        return HealthResponse(
            status="ok",
            model=application_settings.model,
            dimensions=application_settings.embedding_dimensions,
        )

    @application.post(
        "/v1/images/process",
        response_model=ImageEmbeddingResponse,
        dependencies=[Depends(require_api_token)],
        tags=["images"],
    )
    async def process_image(
        image: Annotated[UploadFile, File(description="JPEG, PNG, or WebP image")],
        image_uid: Annotated[str | None, Form()] = None,
    ) -> ImageEmbeddingResponse:
        contents = await _read_upload(image, application_settings)

        try:
            return await run_in_threadpool(
                application.state.processor.process,
                contents,
                image_uid,
            )
        except ImageProcessingError as exception:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail=str(exception),
            ) from exception

    @application.post(
        "/v1/images/embed",
        response_model=ImageEmbeddingResponse,
        dependencies=[Depends(require_api_token)],
        tags=["images"],
    )
    async def embed_faces(
        image: Annotated[UploadFile, File(description="JPEG, PNG, or WebP search image")],
    ) -> ImageEmbeddingResponse:
        contents = await _read_upload(image, application_settings)

        try:
            result = await run_in_threadpool(
                application.state.processor.process,
                contents,
                None,
            )
        except ImageProcessingError as exception:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail=str(exception),
            ) from exception

        if not result.faces:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="No frontal face was detected in the search image.",
            )

        return result

    return application


async def _read_upload(upload: UploadFile, settings: Settings) -> bytes:
    if upload.content_type not in settings.allowed_content_types:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Only JPEG, PNG, and WebP images are supported.",
        )

    chunks: list[bytes] = []
    total_bytes = 0

    while chunk := await upload.read(CHUNK_SIZE):
        total_bytes += len(chunk)

        if total_bytes > settings.max_upload_bytes:
            raise HTTPException(
                status_code=status.HTTP_413_CONTENT_TOO_LARGE,
                detail=f"Image exceeds the {settings.max_upload_bytes} byte upload limit.",
            )

        chunks.append(chunk)

    return b"".join(chunks)


app = create_app()
