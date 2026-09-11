FROM python:3.13-slim-trixie
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

ENV UV_PYTHON_DOWNLOADS=never

WORKDIR /code

COPY ./uv.lock /code/uv.lock
COPY ./pyproject.toml /code/pyproject.toml
RUN uv sync --locked

COPY ./scripts /code/scripts
RUN uv run --no-sync python scripts/download_models.py --directory /code/models

COPY . /code/

CMD ["uv", "run", "--no-sync", "fastapi", "run", "app/main.py", "--port", "8000"]
