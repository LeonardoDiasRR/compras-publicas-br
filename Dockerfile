FROM python:3.12-slim

ENV PATH="/app/.venv/bin:$PATH" \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_NO_CACHE=1

WORKDIR /app

RUN pip install --no-cache-dir uv==0.8.17 \
    && useradd --create-home --uid 10001 app

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev --no-install-project

COPY --chown=app:app src ./src
COPY --chown=app:app coverage ./coverage

USER app

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD ["python", "-c", "import os; from pathlib import Path; os.kill(1, 0); assert Path('coverage/endpoints.yaml').is_file(); import src.features.mcp.servidor"]

CMD ["python", "-m", "src.features.mcp.servidor", "--transport", "stdio"]
