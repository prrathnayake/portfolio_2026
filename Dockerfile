FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    APP_PORT=80

WORKDIR /app

COPY requirements.txt ./
RUN python -m pip install --upgrade pip \
  && python -m pip install -r requirements.txt

COPY backend ./backend
COPY frontend ./frontend
COPY prompts ./prompts
COPY knowledge ./knowledge

RUN useradd --no-create-home --home-dir /app --shell /usr/sbin/nologin appuser \
  && chown -R appuser:appuser /app

USER appuser

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:80/api/health', timeout=3)"

CMD ["sh", "-c", "python -m uvicorn backend.main:app --host 0.0.0.0 --port ${APP_PORT}"]
