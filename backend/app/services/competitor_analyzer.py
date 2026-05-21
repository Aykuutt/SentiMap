import os
import requests
import google.generativeai as genai
import json

api_key = os.environ.get('GEMINI_API_KEY')
if api_key:
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-1.5-flash')
else:
    model = None

def fetch_competitors(lat, lng, category, maps_api_key):
    """Fetches up to 5 nearby competitors in the same category."""
    if not maps_api_key:
        return []
    
    url = f"https://maps.googleapis.com/maps/api/place/nearbysearch/json?location={lat},{lng}&radius=1500&type=restaurant&keyword={category}&key={maps_api_key}"
    
    try:
        response = requests.get(url)
        data = response.json()
        if data.get('status') == 'OK':
            # Get top 5 results
            results = data.get('results', [])[:5]
            competitors = []
            for r in results:
                competitors.append({
                    'place_id': r.get('place_id'),
                    'name': r.get('name'),
                    'rating': r.get('rating', 0),
                    'user_ratings_total': r.get('user_ratings_total', 0)
                })
            return competitors
        return []
    except Exception as e:
        print(f"Error fetching nearby competitors: {e}")
        return []

def fetch_place_reviews(place_id, maps_api_key):
    """Fetches reviews for a specific place."""
    if not maps_api_key:
        return []
    
    url = f"https://maps.googleapis.com/maps/api/place/details/json?place_id={place_id}&fields=reviews&language=tr&key={maps_api_key}"
    try:
        response = requests.get(url)
        data = response.json()
        if data.get('status') == 'OK':
            return data.get('result', {}).get('reviews', [])
        return []
    except Exception as e:
        print(f"Error fetching reviews for {place_id}: {e}")
        return []

def extract_pros_cons_with_gemini(business_name, reviews):
    """Uses Gemini to extract pros and cons from a list of reviews. Uses local NLP fallback if no API key."""
    if not reviews:
        return {"pros": ["Yorum bulunamadı."], "cons": ["Yorum bulunamadı."]}
        
    review_texts = [r.get('text', '') for r in reviews if r.get('text')]
    
    if not model:
        # GERÇEK VERİLERLE (LOCAL NLP) FALLBACK ANALİZİ
        from app.routes import POSITIVE_WORDS, NEGATIVE_WORDS
        
        # DETAYLI CÜMLE TABANLI MOCK SÖZLÜK
        PRO_DESCRIPTIONS = {
            'lezzetli': 'Yemeklerin lezzeti ve kalitesi çok beğeniliyor',
            'temiz': 'Mekan hijyeni ve masaların temizliği övülüyor',
            'hızlı': 'Servis hızı ve pratiklik takdir ediliyor',
            'harika': 'Müşteriler genel atmosferden son derece memnun',
            'taze': 'Kullanılan malzemelerin tazeliği dikkat çekiyor',
            'güler yüzlü': 'Personelin sıcakkanlı ve güler yüzlü yaklaşımı seviliyor',
            'iyi': 'Genel hizmet kalitesi beklentileri karşılıyor',
            'mükemmel': 'Kusursuz ve eksiksiz bir deneyim yaşatıldığı belirtiliyor'
        }
        
        CON_DESCRIPTIONS = {
            'yavaş': 'Servis hızı konusunda ciddi gecikmeler yaşanıyor',
            'soğuk': 'Yemeklerin soğuk servis edildiği yönünde şikayetler var',
            'kaba': 'Personel tutumu ve kaba davranışlar sıkça eleştiriliyor',
            'pahalı': 'Fiyat/Performans dengesi zayıf bulunuyor, fiyatlar yüksek',
            'ilgisiz': 'Müşteriye karşı ilgisiz ve dikkatsiz bir tavır olduğu düşünülüyor',
            'kötü': 'Genel kalite veya lezzet standartların altında kalmış',
            'rezalet': 'Ciddi hizmet aksaklıkları ve yoğun memnuniyetsizlikler yaşanmış',
            'geç': 'Siparişlerin masaya çok geç ulaştığı ifade ediliyor'
        }
        
        pros_found = set()
        cons_found = set()
        
        for text in review_texts:
            text_lower = text.lower()
            for p_word, desc in PRO_DESCRIPTIONS.items():
                if p_word in text_lower:
                    pros_found.add(desc)
            for n_word, desc in CON_DESCRIPTIONS.items():
                if n_word in text_lower:
                    cons_found.add(desc)
                    
        pros = list(pros_found)[:2] if pros_found else ["Genel olarak tatmin edici, belirgin bir övgü yok."]
        cons = list(cons_found)[:2] if cons_found else ["Belirgin bir şikayet veya operasyonel sorun tespit edilmedi."]
        
        return {
            "pros": pros,
            "cons": cons
        }
        
    combined_text = "\n".join(review_texts)
    
    prompt = f"""
    Sen bir restoran gurmesi ve müşteri ilişkileri uzmanısın.
    Aşağıda "{business_name}" adlı işletme için yapılan müşteri yorumları verilmiştir.
    Lütfen bu yorumları okuyarak işletmenin en çok övülen 2 iyi yönünü (pros) ve en çok şikayet edilen 2 kötü yönünü (cons) çıkar.
    Sonucu SADECE aşağıdaki JSON formatında döndür, başka hiçbir açıklama ekleme:
    {{
        "pros": ["iyi yön 1", "iyi yön 2"],
        "cons": ["kötü yön 1", "kötü yön 2"]
    }}
    
    Yorumlar:
    {combined_text}
    """
    
    try:
        response = model.generate_content(prompt)
        text = response.text
        # Clean markdown if present
        if text.startswith('```json'):
            text = text[7:-3]
        elif text.startswith('```'):
            text = text[3:-3]
            
        return json.loads(text.strip())
    except Exception as e:
        print(f"Gemini Analysis Error for {business_name}: {e}")
        return {"pros": ["Analiz edilemedi."], "cons": ["Analiz edilemedi."]}

def extract_regional_summary(target_name, businesses):
    """Uses Gemini to generate a comprehensive regional summary. Uses local synthesis if no API key."""
    if not businesses:
        return "Bölgesel veri yetersiz olduğu için özet çıkarılamadı."
        
    if not model:
        # GERÇEK VERİLERLE (LOCAL NLP) BÖLGESEL ÇIKARIM
        target_biz = next((b for b in businesses if b.get('is_target')), None)
        if not target_biz:
            return "Hedef işletme analiz edilemedi."
            
        target_score = target_biz.get('rating', 0)
        
        comp_scores = [b.get('rating', 0) for b in businesses if not b.get('is_target')]
        avg_comp = sum(comp_scores) / len(comp_scores) if comp_scores else 0
        
        target_pros = ", ".join(target_biz.get('pros', []))
        
        summary = f"{target_name} ({target_score} Puan), bölge ortalamasının ({avg_comp:.1f} Puan) "
        if target_score >= avg_comp:
            summary += f"üzerinde bir performans sergilemektedir. En güçlü yönleri: {target_pros}. "
        else:
            summary += f"altında kalmaktadır. Rekabet gücünü artırmak için kalite standartlarını gözden geçirmelidir. "
            
        summary += "Bölgesel rakiplerdeki ortak şikayetleri fırsata çevirerek, hizmet hızını ve müşteri memnuniyetini odağınıza almanız pazar payınızı artıracaktır."
        return summary
        
    prompt = f"""
    Sen bir stratejik iş danışmanısın. Aşağıda "{target_name}" adlı hedef işletmemiz ve bölgesindeki rakiplerinin iyi ve kötü yönleri verilmiştir.
    Lütfen şu 3 maddeyi içeren tek bir paragrafta toparlanmış, akıcı ve profesyonel bir sonuç metni (çıkarım) yaz:
    1. Bizim işletmemizin (hedef işletme) genel durumu, en güçlü yanı ve acil düzeltmesi gereken zayıf noktası.
    2. Çevredeki rakiplerin genel olarak nelerde iyi ve nelerde kötü olduğu (bölgesel trend).
    3. Bizim işletmemizin rakiplerin önüne geçmek için odaklanması gereken temel strateji.
    
    Veriler:
    {json.dumps(businesses, ensure_ascii=False, indent=2)}
    
    Yalnızca analiz metnini döndür, ek açıklama veya JSON kullanma.
    """
    
    try:
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        print(f"Gemini Regional Summary Error: {e}")
        return "Yapay zeka özet çıkarırken bir hatayla karşılaştı."

def generate_ranking_report(target_place_id, target_name, target_rating, lat, lng, category):
    """Main orchestration function to generate the competitor ranking report."""
    maps_api_key = os.environ.get('VITE_MAPS_API_KEY') or os.environ.get('GOOGLE_MAPS_API_KEY')
    
    if not maps_api_key:
        return {"error": "Google Maps API Key eksik."}
        
    # 1. Hedef işletme (bizim işletmemiz) analiz ediliyor
    target_reviews = fetch_place_reviews(target_place_id, maps_api_key)
    target_analysis = extract_pros_cons_with_gemini(target_name, target_reviews)
    
    businesses = []
    
    # Kendi işletmemizi listeye ekle
    businesses.append({
        'id': target_place_id,
        'name': target_name + " (Senin İşletmen)",
        'rating': target_rating,
        'pros': target_analysis.get('pros', []),
        'cons': target_analysis.get('cons', []),
        'is_target': True
    })
    
    # 2. Rakipleri bul
    competitors = fetch_competitors(lat, lng, category, maps_api_key)
    
    # 3. Her rakip için analiz yap
    for comp in competitors:
        # Kendi işletmemiz rakip olarak geldiyse atla
        if comp['place_id'] == target_place_id:
            continue
            
        comp_reviews = fetch_place_reviews(comp['place_id'], maps_api_key)
        comp_analysis = extract_pros_cons_with_gemini(comp['name'], comp_reviews)
        
        businesses.append({
            'id': comp['place_id'],
            'name': comp['name'],
            'rating': comp['rating'],
            'pros': comp_analysis.get('pros', []),
            'cons': comp_analysis.get('cons', []),
            'is_target': False
        })
        
    # 4. Puan/Rating bazında sırala (en yüksek rating en üstte)
    businesses.sort(key=lambda x: x['rating'], reverse=True)
    
    # Sıra numarası (rank) ekle
    for index, b in enumerate(businesses):
        b['rank'] = index + 1
        
    # 5. Bölgesel Genel Çıkarım (Summary) oluştur
    regional_summary = extract_regional_summary(target_name, businesses)
        
    return {
        "status": "success",
        "category": category,
        "ranking": businesses,
        "regional_summary": regional_summary
    }
