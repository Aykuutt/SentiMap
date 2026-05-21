from datetime import datetime
from app.models import db

class User(db.Model):
    """
    Sentimap platformunun kullanıcı modelidir.
    Hem Müşteri (B2C - 'customer') hem de İşletme Yöneticisi (B2B - 'business') rollerini destekler.
    """
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), nullable=False, unique=True)
    email = db.Column(db.String(150), nullable=False, unique=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='customer') # 'customer' veya 'business'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # İlişkiler (Gelecekteki veritabanı sorgularını kolaylaştırmak için)
    # Bir kullanıcının yönettiği işletmeler (B2B)
    businesses = db.relationship('Business', backref='owner', lazy=True, cascade="all, delete-orphan")
    # Bir kullanıcının yazdığı yorumlar (B2C)
    reviews = db.relationship('Review', backref='user', lazy=True, cascade="all, delete-orphan")
    # Bir kullanıcının ziyaret ettiği / kaydettiği yerler
    visited_places = db.relationship('VisitedPlace', backref='user', lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        """Kullanıcı verisini JSON formatına dönüştürmek için yardımcı metod."""
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'role': self.role,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Business(db.Model):
    """
    Sentimap platformunun işletme (B2B) modelidir.
    İşletmenin konumunu (lat/lng), adını, kategorisini ve sahibini içerir.
    """
    __tablename__ = 'businesses'

    id = db.Column(db.Integer, primary_key=True)
    owner_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    name = db.Column(db.String(150), nullable=False)
    category = db.Column(db.String(50), nullable=False)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    address = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # İlişkiler
    reviews = db.relationship('Review', backref='business', lazy=True, cascade="all, delete-orphan")
    visited_places = db.relationship('VisitedPlace', backref='business', lazy=True, cascade="all, delete-orphan")
    sentiment_analyses = db.relationship('SentimentAnalysis', backref='business', lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'id': self.id,
            'owner_id': self.owner_id,
            'name': self.name,
            'category': self.category,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'address': self.address,
            'description': self.description,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Review(db.Model):
    """
    Müşterilerin (B2C) işletmelere yaptığı yorumları ve puanları temsil eder.
    """
    __tablename__ = 'reviews'

    id = db.Column(db.Integer, primary_key=True)
    business_id = db.Column(db.Integer, db.ForeignKey('businesses.id', ondelete='CASCADE'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    rating = db.Column(db.Integer, nullable=False) # 1 ile 5 arası
    comment = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # İlişkiler
    sentiment_analyses = db.relationship('SentimentAnalysis', backref='review', lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'id': self.id,
            'business_id': self.business_id,
            'user_id': self.user_id,
            'rating': self.rating,
            'comment': self.comment,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class VisitedPlace(db.Model):
    """
    Kullanıcının kaydettiği veya ziyaret ettiği işletmeleri takip eder (Çoktan Çoka/Many-to-Many ilişki çözümü).
    """
    __tablename__ = 'visited_places'
    __table_args__ = (db.UniqueConstraint('user_id', 'business_id', name='_user_business_uc'),)

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    business_id = db.Column(db.Integer, db.ForeignKey('businesses.id', ondelete='CASCADE'), nullable=False)
    saved_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'business_id': self.business_id,
            'saved_at': self.saved_at.isoformat() if self.saved_at else None
        }


class SentimentAnalysis(db.Model):
    """
    Yorumlar üzerinde yapılan yapay zeka/duygu analizi sonuçlarını saklar.
    """
    __tablename__ = 'sentiment_analyses'

    id = db.Column(db.Integer, primary_key=True)
    review_id = db.Column(db.Integer, db.ForeignKey('reviews.id', ondelete='CASCADE'), nullable=False)
    business_id = db.Column(db.Integer, db.ForeignKey('businesses.id', ondelete='CASCADE'), nullable=False)
    score = db.Column(db.Integer, nullable=False) # 0-100 duygu skoru
    sentiment_label = db.Column(db.String(15), nullable=False) # 'positive', 'negative', 'neutral'
    action_suggestion = db.Column(db.Text, nullable=True) # Aksiyon önerisi
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'review_id': self.review_id,
            'business_id': self.business_id,
            'score': self.score,
            'sentiment_label': self.sentiment_label,
            'action_suggestion': self.action_suggestion,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
