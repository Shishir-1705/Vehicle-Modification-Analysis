# V5 Production AI Container — MongoDB + ANPR Edition
FROM python:3.10-slim

# 1. System deps: OpenCV, EasyOCR, git for pip installs
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libgomp1 \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 2. Logging directory
RUN mkdir -p /app/logs /app/static/uploads /app/static/cache && chmod -R 777 /app/logs /app/static

# 3. Python deps (cached layer unless requirements.txt changes)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 4. Application code
COPY backend/   ./backend
COPY ml_pipeline/ ./ml_pipeline
COPY models/    ./models/
COPY static/    ./static/

# 5. Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# 6. Expose port dynamically (Railway sets PORT)
ENV PORT=8000
EXPOSE $PORT

# 7. Production ASGI server (4 workers)
CMD gunicorn backend.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:$PORT --timeout 120 --graceful-timeout 30 --log-level info
