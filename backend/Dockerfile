# 1. Hekaton Şartnamesi Gereği Hafif ve Güvenli python:3.9-slim Temel İmajı
FROM python:3.9-slim

# Python çıktılarının tamponlanmadan doğrudan terminale aktarılmasını sağlar
ENV PYTHONUNBUFFERED=1

# Uygulama çalışma dizinini belirliyoruz
WORKDIR /app

# 2. Layer Caching (Katman Önbellekleme) Standardı
# Gereksiz derlemeleri önlemek için önce sadece requirements.txt kopyalanıp kurulur
COPY requirements.txt .

# requirements.txt içindeki paketleri pip ile yüklüyoruz.
# Cache temizliği yaparak imaj boyutunu optimize ediyoruz.
RUN pip install --no-cache-dir -r requirements.txt

# 3. Kalan Tüm Uygulama Kodlarını Kopyalıyoruz
COPY . .

# 4. Port Tanımlamaları ve Expose Standardı
# Port çevre değişkenini ve dinlenecek portu 8080 olarak yapılandırıyoruz
ENV PORT 8080
EXPOSE 8080

# 5. Gunicorn Başlatıcı Standardı (Birebir Uyumlu)
# Gunicorn WSGI sunucusunu 1 worker, 8 threads ve 0 timeout ile hekaton spesifikasyonlarına uygun olarak başlatıyoruz
CMD exec gunicorn --bind :$PORT --workers 1 --threads 8 --timeout 0 "app:create_app()"
