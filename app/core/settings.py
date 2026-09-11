from pathlib import Path

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
    model: str = Field(default="opencv-sface-2021dec-v1", min_length=1, max_length=255)
    embedding_dimensions: int = Field(default=128, ge=128, le=128)
    model_dir: Path = Path("models")
    detector_model_filename: str = "face_detection_yunet_2023mar.onnx"
    recognizer_model_filename: str = "face_recognition_sface_2021dec.onnx"
    detection_score_threshold: float = Field(default=0.6, gt=0, le=1)
    detection_nms_threshold: float = Field(default=0.3, gt=0, le=1)
    detection_top_k: int = Field(default=5000, ge=1)
    detector_max_dimension: int = Field(default=1920, ge=320, le=8192)
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
    api_v1_str: str = "/api/v1"

    @property
    def detector_model_path(self) -> Path:
        return self.model_dir / self.detector_model_filename

    @property
    def recognizer_model_path(self) -> Path:
        return self.model_dir / self.recognizer_model_filename


settings = Settings()
