import os
from flask import Flask, render_template
from flask_cors import CORS
from app.models import db
from app.routes import api_bp

def create_app():
    """
    Sentimap Monolitik Application Factory.
    Flask uygulamasını ayağa kaldırır, yapılandırır ve modülleri bağlar.
    """
    # Flask uygulamasını static ve templates klasörlerini tanımlayarak oluşturuyoruz.
    # Dinamik olarak 'dist' klasörünün varlığına göre üretim ve geliştirme modlarını destekliyoruz.
    base_dir = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
    dist_dir = os.path.join(base_dir, 'dist')
    
    if os.path.exists(dist_dir):
        app = Flask(
            __name__,
            static_folder=os.path.join(dist_dir, 'assets'),
            static_url_path='/assets',
            template_folder=dist_dir
        )
    else:
        app = Flask(
            __name__,
            static_folder='static',
            template_folder='templates'
        )

    # 1. Veritabanı Yapılandırması (Zorunlu Hekaton Kuralı)
    # SQLAlchemy database bağlantı URI'si asla hardcoded olmamalıdır!
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get(
        'DATABASE_URL', 
        'sqlite:///hekaton_local.db'
    )
    # SQLAlchemy'nin arka plandaki sinyal takibini kapatarak performans kazanımı sağlıyoruz.
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # Veritabanı nesnemizi Flask uygulamasına bağlıyoruz.
    db.init_app(app)

    # 2. CORS Yapılandırması (Zorunlu Hekaton Kuralı)
    # ALLOWED_ORIGINS çevre değişkeni kullanılarak sadece '/api/*' rotalarına izin verilmektedir.
    allowed_origins = os.environ.get("ALLOWED_ORIGINS", "*")
    CORS(app, resources={r"/api/*": {"origins": allowed_origins}})

    # 3. Blueprint Register (Zorunlu Hekaton Kuralı)
    # api_bp blueprint'i bu kısımda sisteme kaydedilmektedir.
    app.register_blueprint(api_bp)

    # 4. Monolitik Single Page Application (SPA) Rotaları ve Fallback
    # API dışındaki tüm HTTP istekleri React Router'ın client tarafında handle etmesi için templates/index.html'e yönlendirilir.
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def catch_all(path):
        # Eğer istek bir statik dosya değilse veya api rotası değilse React SPA index.html'i döndürülür.
        if path.startswith('api/'):
            # API istekleri yanlışlıkla buraya düşerse 404 döndürülür
            return {"error": "Not Found"}, 404
        return render_template('index.html')

    # SQLite üzerinde hızlı local testler ve jürinin kolay çalıştırması için
    # Veritabanı tabloları uygulama ayağa kalkarken otomatik olarak oluşturulur.
    with app.app_context():
        try:
            db.create_all()
        except Exception as e:
            # Postgresql bağlantı hataları gibi durumlarda uygulamanın çökmesini önlemek için log atıyoruz
            app.logger.warning(f"Database tabloları otomatik oluşturulamadı (Normal olabilir, DB sunucusu kapalıysa): {e}")

    return app
