FROM python:3.12-slim

WORKDIR /app

# Install system dependencies (needed for PyMuPDF/ReportLab)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Set default port
ENV PORT=8000
EXPOSE 8000

# Start Uvicorn using shell form so $PORT is evaluated
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
