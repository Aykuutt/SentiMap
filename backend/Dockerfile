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

# Flask uygulamasının çalışacağı port
EXPOSE 5000

# Gunicorn ile production sunucusunu başlat
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "4", "run:app"]
