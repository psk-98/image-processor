from pydantic import Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_prefix="IMAGE_PROCESSOR_",
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        frozen=True,
    )

    api_token: SecretStr | None = None
    model: str = Field(default="opencv-hog-face-v1", min_length=1, max_length=255)
    embedding_dimensions: int = Field(default=512, ge=1, le=4096)
    max_upload_bytes: int = Field(default=10 * 1024 * 1024, ge=1)
    max_image_pixels: int = Field(default=40_000_000, ge=1)
    max_faces: int = Field(default=20, ge=1, le=100)
    min_face_size: int = Field(default=32, ge=16, le=2048)
    allowed_content_types: tuple[str, ...] = (
        "image/jpeg",
        "image/png",
        "image/webp",
    )
    chunk_size: int = Field(default=1024 * 1024)


settings = Settings()
