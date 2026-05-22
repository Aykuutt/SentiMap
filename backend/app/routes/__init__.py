from flask import Blueprint, jsonify, request
import random
from datetime import datetime, timedelta
from app.models.user import Review, Business
from app.services.gemini_service import analyze_with_gemini
from app.services.competitor_analyzer import generate_ranking_report


# API Blueprint tanımı. Tüm API rotaları bu Blueprint altına eklenecektir.
api_bp = Blueprint('api', __name__, url_prefix='/api')

# Sağlık kontrolü ve test rotası
@api_bp.route('/health', methods=['GET'])
def health_check():
    """Platformun çalışıp çalışmadığını test eden sağlık kontrolü API'si."""
    return jsonify({
        'status': 'success',
        'message': 'Sentimap API is healthy and active!',
        'service': 'Flask Backend skeleton'
    }), 200

# Türkçe ve İngilizce duygu analiz sözlüğü (Lexicon)
POSITIVE_WORDS = {
    'harika', 'lezzetli', 'mükemmel', 'güzel', 'hızlı', 'taze', 'temiz', 'kaliteli', 
    'beğendim', 'sevdik', 'iyi', 'tavsiye', 'bayıldım', 'efsane', 'başarılı', 'dostu',
    'nazik', 'güler yüzlü', 'harikaydı', 'leziz', 'muazzam', 'şahane', 'huzurlu', 'sessiz',
    'great', 'delicious', 'perfect', 'good', 'fast', 'fresh', 'clean', 'friendly', 'love',
    'excellent', 'amazing', 'nice', 'best', 'awesome'
}

NEGATIVE_WORDS = {
    'kötü', 'yavaş', 'rezalet', 'çiğ', 'geç', 'ıslak', 'soğuk', 'kaba', 'ilgisiz', 
    'pahalı', 'az', 'küçük', 'beğenmedim', 'lezzetsiz', 'kirli', 'berbat', 'dar', 'bekledik',
    'çiğ', 'soğumuş', 'kötüydü', 'kurye', 'pahalıydı', 'rezalet', 'tavsiye etmiyorum',
    'bad', 'slow', 'terrible', 'raw', 'late', 'wet', 'cold', 'rude', 'expensive',
    'dirty', 'worst', 'horrible', 'disappointed', 'poor'
}

def analyze_text(text):
    """
    Basit ve son derece kararlı çalışan Türkçe/İngilizce Kelime Bazlı Duygu Analizcisi (Lexicon-based Sentiment Analyzer).
    0-100 arası bir skor ve 'positive', 'neutral', 'negative' etiketleri döner.
    """
    if not text:
        return 50, 'neutral'
    
    text_lower = text.lower()
    pos_count = 0
    neg_count = 0
    
    for word in POSITIVE_WORDS:
        if word in text_lower:
            pos_count += 1
            
    for word in NEGATIVE_WORDS:
        if word in text_lower:
            neg_count += 1
            
    total = pos_count + neg_count
    if total == 0:
        return 50, 'neutral' # Nötr
        
    # Skorlama mantığı: Pozitif oranı yüzdelik skora dönüştürülür
    pos_ratio = pos_count / total
    score = int(pos_ratio * 100)
    
    if score > 60:
        label = 'positive'
    elif score < 40:
        label = 'negative'
    else:
        label = 'neutral'
        
    return score, label

def generate_ai_suggestions(sentiment_label, score, category="General"):
    """
    Duygu skoru ve etiketine göre yapay zeka aksiyon önerileri oluşturur.
    """
    suggestions = []
    
    if sentiment_label == 'negative':
        suggestions.append({
            'type': 'danger',
            'title': 'Acil Kalite Kontrolü',
            'text': 'Mutfak fırın kalibrasyonunu ve pişirme derecelerini kontrol edin. Hammadde tedarikçinizi denetlemeyi düşünebilirsiniz.'
        })
        suggestions.append({
            'type': 'warning',
            'title': 'Hizmet ve Personel Eğitimi',
            'text': 'Müşteriler servis hızından veya personel tavırlarından şikayetçi. Hizmet standartları eğitimini acilen tekrarlayın.'
        })
        suggestions.append({
            'type': 'info',
            'title': 'Fiyat/Porsiyon Dengelemesi',
            'text': 'Öğrenciler veya bütçe hassasiyeti yüksek müşteriler için doyurucu kampanya menüleri tasarlayın.'
        })
    elif sentiment_label == 'neutral':
        suggestions.append({
            'type': 'warning',
            'title': 'Kapasite Yönetimi ve Düzen',
            'text': 'Yoğun saatlerde bekleme süresini azaltmak için bir rezervasyon ve sıra takip sistemi kurun.'
        })
        suggestions.append({
            'type': 'info',
            'title': 'Wi-Fi ve Dijital Konfor',
            'text': 'Çalışan veya kahve içmeye gelen müşteriler için priz sayısını artırın ve Wi-Fi hızını iyileştirin.'
        })
    else:
        suggestions.append({
            'type': 'success',
            'title': 'Lezzet Standardını Koru',
            'text': 'Sos tariflerinizi ve et pişirme standartlarınızı bozmadan devam edin. Bu lezzeti korumak en büyük reklamınızdır.'
        })
        suggestions.append({
            'type': 'success',
            'title': 'Sosyal Medya Fırsatı',
            'text': 'Müşterilerden gelen harika yorumları ekran görüntüsü alıp sosyal medyanızda paylaşarak reklamınızı yapın.'
        })
        
    return suggestions

def extract_keywords(reviews_text_list):
    """
    Tüm yorumlardan sık geçen anlamlı kelimeleri çıkarır ve
    sentiment sözlüğüne göre etiketler.
    """
    STOP_WORDS = {
        've', 'bir', 'bu', 'da', 'de', 'ile', 'için', 'ama', 'ya', 'en', 'biz', 'ben',
        'o', 'bu', 'şu', 'ne', 'olan', 'benim', 'kadar', 'gibi', 'ise', 'daha',
        'the', 'a', 'an', 'is', 'was', 'are', 'were', 'i', 'we', 'it', 'to', 'of',
        'and', 'in', 'on', 'at', 'for', 'with', 'that', 'this', 'but', 'not', 'so',
        'very', 'just', 'they', 'my', 'me', 'you', 'as', 'our', 'had', 'have',
        'here', 'there', 'be', 'been', 'from', 'by'
    }
    
    word_counts = {}
    word_types = {}
    
    for text in reviews_text_list:
        if not text:
            continue
        words = text.lower().replace(',', ' ').replace('.', ' ').replace('!', ' ').split()
        for word in words:
            word = word.strip()
            if len(word) < 4 or word in STOP_WORDS:
                continue
            word_counts[word] = word_counts.get(word, 0) + 1
            # Kelime tipini belirle
            if word in POSITIVE_WORDS:
                word_types[word] = 'positive'
            elif word in NEGATIVE_WORDS:
                word_types[word] = 'negative'
            else:
                word_types[word] = 'neutral'
    
    # Frekansa göre sırala ve top 8 al
    sorted_words = sorted(word_counts.items(), key=lambda x: x[1], reverse=True)[:8]
    
    keywords = []
    for word, count in sorted_words:
        keywords.append({
            'word': word.capitalize(),
            'count': count,
            'type': word_types.get(word, 'neutral')
        })
    
    return keywords

@api_bp.route('/analyze', methods=['POST'])
def analyze_reviews():
    """
    Google Places'tan çekilen gerçek yorumları anlık olarak analiz eden REST API.
    """
    data = request.json or {}
    reviews = data.get('reviews', [])
    business_name = data.get('name', 'İşletme')
    category = data.get('category', 'Restoran')
    competitors_data = data.get('competitors', [])
    
    if not reviews:
        return jsonify({
            'status': 'error',
            'message': 'Analiz edilecek yorum bulunamadı.'
        }), 400
        
    analyzed_reviews = []
    total_score = 0
    positive_count = 0
    negative_count = 0
    neutral_count = 0
    
    try:
        for rev in reviews:
            comment_text = rev.get('text', '') or ''
            author = rev.get('author_name', 'Misafir') or 'Misafir'
            rating = rev.get('rating')
            if rating is None:
                rating = 3
                
            time_str = rev.get('relative_time_description', 'Yakın zamanda') or 'Yakın zamanda'
            
            # Kelime bazlı sentiment analizi yapıyoruz
            score, label = analyze_text(comment_text)
            
            # Eğer kullanıcının verdiği rating çok netse analizi kalibre et
            try:
                if rating >= 4 and score < 50:
                    score = int((score + rating * 20) / 2)
                    label = 'positive' if score > 55 else 'neutral'
                elif rating <= 2 and score > 50:
                    score = int((score + rating * 20) / 2)
                    label = 'negative' if score < 45 else 'neutral'
            except Exception:
                pass # ignore calibration errors
                
            total_score += score
            
            if label == 'positive':
                positive_count += 1
            elif label == 'negative':
                negative_count += 1
            else:
                neutral_count += 1
                
            analyzed_reviews.append({
                'author': author,
                'comment': comment_text,
                'rating': rating,
                'time': time_str,
                'sentiment_score': score,
                'sentiment_label': label
            })
            
        avg_score = int(total_score / len(reviews)) if reviews else 50
        
        if avg_score > 60:
            overall_label = 'positive'
        elif avg_score < 40:
            overall_label = 'negative'
        else:
            overall_label = 'neutral'
            
        # Yorumlardan anahtar kelimeleri çıkar
        all_review_texts = [rev.get('text', '') for rev in reviews if rev.get('text')]
        keywords = extract_keywords(all_review_texts)
            
        # Rakip analizi verilerini dinamik simüle et veya frontend'den geleni kullan
        if competitors_data:
            competitors = [{'name': c.get('name'), 'score': int(c.get('rating', 3) * 20)} for c in competitors_data]
        else:
            competitors = [
                {'name': f'{category} Dünyası', 'score': max(30, min(100, avg_score + random.randint(-15, 10)))},
                {'name': f'Karaköy {category} Evi', 'score': max(30, min(100, avg_score + random.randint(-10, 15)))}
            ]
            
        # Gemini AI ile gelişmiş analiz dene
        ai_result = analyze_with_gemini(analyzed_reviews, business_name, category, competitors_data)
        
        if ai_result:
            # Gemini başarılı olduysa sonuçları oradan al
            suggestions = ai_result.get('suggestions', generate_ai_suggestions(overall_label, avg_score, category))
            overall_label = ai_result.get('overall_sentiment_label', overall_label)
            # Opsiyonel: avg_score = ai_result.get('overall_sentiment_score', avg_score)
        else:
            # Aksiyon önerilerini eski usul dinamik oluştur
            suggestions = generate_ai_suggestions(overall_label, avg_score, category)
            
    except Exception as e:
        print("Backend Analysis Error:", str(e))
        return jsonify({'status': 'error', 'message': str(e)}), 500
    
    return jsonify({
        'status': 'success',
        'business_name': business_name,
        'category': category,
        'overall_sentiment_score': avg_score,
        'overall_sentiment_label': overall_label,
        'distribution': {
            'positive': positive_count,
            'negative': negative_count,
            'neutral': neutral_count,
            'total': len(reviews)
        },
        'keywords': keywords,
        'analyzed_reviews': analyzed_reviews,
        'suggestions': suggestions,
        'competitors': competitors
    }), 200

@api_bp.route('/businesses/<int:business_id>/analysis', methods=['GET'])
def get_business_analysis(business_id):
    """
    Belirli bir işletmenin son 30 günlük yorumlarını çekip duygu analizi dönen API.
    Şu an için mock veri dönmektedir.
    """
    # 1. Son 30 günü hesapla
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    
    # 2. İlgili işletmeyi ve son 30 gündeki yorumlarını SQLAlchemy ile çek
    business = Business.query.get(business_id)
    if not business:
        return jsonify({
            'status': 'error',
            'message': 'İşletme bulunamadı.'
        }), 404
        
    recent_reviews = Review.query.filter(
        Review.business_id == business_id,
        Review.created_at >= thirty_days_ago
    ).all()
    
    # Gerçek DB'den çekilen yorum sayısını al (mock analiz için kullanıyoruz)
    total_reviews_count = len(recent_reviews)
    
    # Mock analitik sonuç
    # İleride burada NLP/Makine öğrenmesi entegrasyonu ile gerçek veriler dönülebilir
    mock_response = {
        "business_id": business_id,
        "period": "Last 30 Days",
        "total_reviews": total_reviews_count,
        "sentiment_score": 78,
        "sentiment_label": "Positive",
        "insights": [
            "Müşteriler genel olarak kahve kalitesinden memnun.",
            "Son 2 haftada bekleme süreleriyle ilgili 3 negatif yorum alındı."
        ],
        "action_suggestions": [
            "Kasa sayısını artırarak bekleme süresini azaltın."
        ]
    }
    
    return jsonify(mock_response), 200

@api_bp.route('/analyze-competitors', methods=['POST'])
def analyze_competitors_route():
    """
    Rakipleri bulur, yorumlarını çeker, Gemini ile analiz eder ve sıralama yapar.
    """
    data = request.json or {}
    target_place_id = data.get('placeId')
    target_name = data.get('name', 'İşletme')
    target_rating = data.get('rating', 0.0)
    lat = data.get('lat')
    lng = data.get('lng')
    category = data.get('category', 'restaurant')
    
    if not target_place_id or not lat or not lng:
        return jsonify({
            'status': 'error',
            'message': 'Gerekli parametreler (placeId, lat, lng) eksik.'
        }), 400
        
    try:
        report = generate_ranking_report(
            target_place_id, target_name, target_rating, lat, lng, category
        )
        return jsonify(report), 200
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500
