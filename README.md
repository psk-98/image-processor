# FMI Image Processor

FastAPI service that detects faces with OpenCV YuNet and returns one
L2-normalized, pgvector-ready SFace identity embedding for every detected face.
It does not classify names, age, gender, emotion, or any other attribute.

## Models

- Face detection: `face_detection_yunet_2023mar.onnx`
- Face recognition: `face_recognition_sface_2021dec.onnx`
- Embedding dimensions: `128`
- Distance metric: cosine

The model files come from the official OpenCV Zoo. They are downloaded from
pinned URLs and verified using SHA-256 checksums. The Docker image downloads
them during the build, so production does not need to download models at
startup.

## Local development

```bash
uv sync
uv run python scripts/download_models.py
cp example.env .env
uv run fastapi dev app/main.py
```

Visit <http://localhost:8000/docs> for the interactive API documentation.

## API

Both routes accept a JPEG, PNG, or WebP file using multipart form data:

- `POST /api/v1/images/process` processes a stored gallery image and accepts an
  optional `image_uid` form field.
- `POST /api/v1/images/embed` creates embeddings for a search image and returns
  `422` when no face is detected.

If `IMAGE_PROCESSOR_API_TOKEN` is set, send it as a bearer token:

```text
Authorization: Bearer your-token
```

## Laravel migration requirement

SFace produces native 128-dimensional vectors. Before saving new embeddings,
change the PostgreSQL column from `vector(512)` to `vector(128)`, rebuild its
HNSW index, remove old HOG embeddings, and reprocess every gallery image. HOG
and SFace embeddings must never be compared with each other.

Use cosine distance (`vector_cosine_ops`) for the pgvector index and similarity
calculation. OpenCV's reference SFace operating point treats cosine similarity
`>= 0.363` as the same identity, which is equivalent to pgvector cosine distance
`<= 0.637`. Treat that as a starting point and calibrate it with your own images.
