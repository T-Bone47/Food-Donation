# ==============================================================================
# FoodShare Chatbot AI Microservice — Production Dockerfile
# Python 3.12, Gunicorn WSGI, non-root, security-hardened image
# ==============================================================================

FROM python:3.12-slim

WORKDIR /app

# Prevent Python from writing .pyc files and buffer stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=5002

# Create non-root system user
RUN groupadd -g 1001 appuser && \
    useradd -u 1001 -g appuser -s /bin/bash -m appuser

# Install Python production dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy application sources with proper permissions
COPY --chown=appuser:appuser . .

USER appuser

EXPOSE 5002

# Health check
HEALTHCHECK --interval=20s --timeout=4s --start-period=5s --retries=3 \
  CMD python -c "import urllib.request, sys; sys.exit(0 if urllib.request.urlopen('http://localhost:5002/health').getcode() == 200 else 1)"

# Production WSGI server
CMD ["gunicorn", "--bind", "0.0.0.0:5002", "--workers", "2", "--threads", "4", "--timeout", "60", "app:app"]

