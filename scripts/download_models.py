from __future__ import annotations

import argparse
import hashlib
import os
import shutil
import tempfile
import urllib.request
from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True, slots=True)
class Model:
    filename: str
    url: str
    sha256: str


MODELS = (
    Model(
        filename="face_detection_yunet_2023mar.onnx",
        url=(
            "https://github.com/opencv/opencv_zoo/raw/main/models/"
            "face_detection_yunet/face_detection_yunet_2023mar.onnx"
        ),
        sha256="8f2383e4dd3cfbb4553ea8718107fc0423210dc964f9f4280604804ed2552fa4",
    ),
    Model(
        filename="face_recognition_sface_2021dec.onnx",
        url=(
            "https://github.com/opencv/opencv_zoo/raw/main/models/"
            "face_recognition_sface/face_recognition_sface_2021dec.onnx"
        ),
        sha256="0ba9fbfa01b5270c96627c4ef784da859931e02f04419c829e83484087c34e79",
    ),
)


def checksum(path: Path) -> str:
    digest = hashlib.sha256()

    with path.open("rb") as model_file:
        for chunk in iter(lambda: model_file.read(1024 * 1024), b""):
            digest.update(chunk)

    return digest.hexdigest()


def download(model: Model, directory: Path) -> None:
    destination = directory / model.filename

    if destination.is_file() and checksum(destination) == model.sha256:
        print(f"Using verified model: {destination}")
        return

    directory.mkdir(parents=True, exist_ok=True)
    request = urllib.request.Request(
        model.url,
        headers={"User-Agent": "fmi-image-processor-model-installer/1.0"},
    )

    with urllib.request.urlopen(request, timeout=120) as response:
        with tempfile.NamedTemporaryFile(dir=directory, delete=False) as temporary:
            shutil.copyfileobj(response, temporary)
            temporary_path = Path(temporary.name)

    try:
        actual_checksum = checksum(temporary_path)

        if actual_checksum != model.sha256:
            raise RuntimeError(
                f"Checksum mismatch for {model.filename}: got {actual_checksum}."
            )

        os.replace(temporary_path, destination)
        print(f"Downloaded and verified: {destination}")
    finally:
        temporary_path.unlink(missing_ok=True)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Download the pinned OpenCV YuNet and SFace ONNX models."
    )
    parser.add_argument(
        "--directory",
        type=Path,
        default=Path(os.getenv("IMAGE_PROCESSOR_MODEL_DIR", "models")),
    )
    arguments = parser.parse_args()

    for model in MODELS:
        download(model, arguments.directory)


if __name__ == "__main__":
    main()
