FROM python:3.11-slim

WORKDIR /app

# İşletim sistemi seviyesindeki gereksinimler (gerekirse)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Bağımlılıkları kopyala ve yükle
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Proje dosyalarını kopyala
COPY . .

# Cloud Run otomatik olarak PORT ortam değişkenini atar (varsayılan 8080)
ENV PORT=8080
EXPOSE $PORT

# Gunicorn ile production sunucusunu başlat
CMD exec gunicorn --bind 0.0.0.0:$PORT --workers 2 --threads 8 --timeout 0 run:app
