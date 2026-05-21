import os
from dotenv import load_dotenv
from app import create_app

# .env dosyasını yüklüyoruz
load_dotenv()

# Application Factory ile Flask uygulamasını oluşturuyoruz
app = create_app()

if __name__ == '__main__':
    # Local ortamda debug modunda 8080 portunda çalıştırıyoruz
    port = int(os.environ.get('PORT', 8080))
    app.run(host='0.0.0.0', port=port, debug=True)
