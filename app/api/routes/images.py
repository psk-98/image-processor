from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.concurrency import run_in_threadpool

from app.api.deps import processor, require_api_token
from app.core.settings import Settings, settings
from app.main import app
from app.schemas.image_processor import ImageEmbeddingResponse
from app.utils.open_cv_processor import ImageProcessingError

router = APIRouter(prefix="images", tags=["images"])


@router.post(
    "/process",
    response_model=ImageEmbeddingResponse,
    dependencies=[Depends(require_api_token)],
)
async def process_image(
    image: Annotated[UploadFile, File(description="JPEG, PNG, or WebP image")],
    image_uid: Annotated[str | None, Form()] = None,
) -> ImageEmbeddingResponse:
    contents = await _read_upload(image, settings)

    try:
        return await run_in_threadpool(processor.process, contents, image_uid)
    except ImageProcessingError as exception:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=str(exception),
        ) from exception


async def _read_upload(upload: UploadFile, settings: Settings) -> bytes:
    if upload.content_type not in settings.allowed_content_types:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Only JPEG, PNG, and WebP images are supported.",
        )

    chunks: list[bytes] = []
    total_bytes = 0

    while chunk := await upload.read(settings.chunk_size):
        total_bytes += len(chunk)

        if total_bytes > settings.max_upload_bytes:
            raise HTTPException(
                status_code=status.HTTP_413_CONTENT_TOO_LARGE,
                detail=f"Image exceeds the {settings.max_upload_bytes} byte upload limit.",
            )

        chunks.append(chunk)

    return b"".join(chunks)
