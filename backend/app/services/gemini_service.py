import os
import json
import google.generativeai as genai

# Attempt to configure Gemini AI
api_key = os.environ.get('GEMINI_API_KEY')
if api_key:
    genai.configure(api_key=api_key)
    # Using the recommended model for text tasks
    model = genai.GenerativeModel('gemini-1.5-flash')
else:
    model = None

def analyze_with_gemini(reviews, business_name, category, competitors):
    """
    Uses Gemini AI to analyze reviews and compare against competitors.
    Returns a JSON string containing the analysis structure.
    """
    if not model:
        return None
        
    try:
        # Construct the prompt
        reviews_text = ""
        for i, rev in enumerate(reviews):
            reviews_text += f"{i+1}. {rev.get('rating')} Yildiz - Yorum: {rev.get('comment')}\n"
            
        competitors_text = ""
        if competitors:
            for c in competitors:
                competitors_text += f"- {c.get('name')}: {c.get('rating')} Yildiz ({c.get('total_ratings')} degerlendirme)\n"
        else:
            competitors_text = "Çevrede belirgin rakip bulunamadı."
            
        prompt = f"""
Sen uzman bir restoran/işletme danışmanısın. Aşağıda '{business_name}' isimli ({category} kategorisinde) bir işletmenin Google haritalar yorumları ve çevresindeki rakip işletmelerin bilgileri bulunmaktadır.

İşletme Yorumları:
{reviews_text}

Çevredeki Rakipler (Karşılaştırma için):
{competitors_text}

Lütfen bu verileri inceleyerek şu JSON formatında bir çıktı üret. SADECE geçerli bir JSON objesi döndür, başka hiçbir metin veya markdown işareti (```json gibi) kullanma.

{{
  "overall_sentiment_score": (0 ile 100 arasında bir ortalama duygu puanı),
  "overall_sentiment_label": ("positive", "negative" veya "neutral"),
  "suggestions": [
    {{
      "type": ("success", "warning", "danger" veya "info"),
      "title": (Aksiyon başlığı, maks 5 kelime),
      "text": (Müşteri yorumlarına ve rakip durumuna göre çok spesifik, uygulanabilir ve yaratıcı 1-2 cümlelik tavsiye)
    }},
    {{ ... }},
    {{ ... }}
  ]
}}

Tavsiyeler mutlaka yorumlardaki detaylara (varsa) ve rakiplerin durumuna atıfta bulunmalı. En az 3 tavsiye üret. Eğer yorum sayısı azsa genel geçerli ama etkili B2B büyüme tavsiyeleri ver.
"""
        response = model.generate_content(prompt)
        text = response.text.strip()
        
        # Remove markdown blocks if Gemini outputs them despite instructions
        if text.startswith('```json'):
            text = text[7:]
        if text.startswith('```'):
            text = text[3:]
        if text.endswith('```'):
            text = text[:-3]
            
        result = json.loads(text.strip())
        return result
    except Exception as e:
        print(f"Gemini AI Analysis Error: {e}")
        return None
