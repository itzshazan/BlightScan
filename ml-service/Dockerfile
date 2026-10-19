# 3.12+: numpy 2.5 in requirements.txt has no wheels for older Pythons
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 PORT=7860
WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY scripts ./scripts
# Bake the pinned model into the image so cold starts don't download it.
RUN python scripts/download_model.py

COPY app ./app

# Hugging Face Spaces runs containers as uid 1000.
RUN useradd -m -u 1000 user && chown -R user /app
USER user

EXPOSE 7860
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
