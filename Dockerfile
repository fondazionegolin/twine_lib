FROM python:3.9-slim

WORKDIR /app

# Installa le dipendenze di sistema necessarie
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application
COPY . .

# Create necessary directories and set permissions
RUN mkdir -p progetti server immagini_imgur admin && \
    chmod -R 755 /app && \
    # Inizializza i file JSON se non esistono
    touch /app/server/votes.json && \
    echo '{}' > /app/server/votes.json && \
    touch /app/server/likes.json && \
    echo '{}' > /app/server/likes.json

# Expose the port the app runs on
EXPOSE 8000

# Set environment variables
ENV PYTHONUNBUFFERED=1

# Volume per persistere i dati
VOLUME ["/app/server", "/app/progetti"]

# Command to run the application
CMD ["python", "server.py"]
