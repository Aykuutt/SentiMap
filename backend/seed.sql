-- Antigravity Seed Data
-- Provides comprehensive records matching frontend coordinate projections and business dashboard mock states

-- 1. SEED USERS (B2B Owners & B2C Customers)
-- Passwords are representative placeholders ('hackathon2026' hashed mock value)
INSERT INTO users (id, username, email, password_hash, role) VALUES
-- Business Managers (B2B)
(1, 'hakan_yilmaz', 'owner@gourmetburgers.com', '$2b$12$eImiTxAk4t3856/8080808080808080808080808080808080', 'business'),
(2, 'baris_aksu', 'owner@thedailygrind.com', '$2b$12$eImiTxAk4t3856/8080808080808080808080808080808080', 'business'),
(3, 'selim_balta', 'owner@karakoybalikcisi.com', '$2b$12$eImiTxAk4t3856/8080808080808080808080808080808080', 'business'),
(4, 'cansu_kaya', 'owner@cyberpizza.com', '$2b$12$eImiTxAk4t3856/8080808080808080808080808080808080', 'business'),
(5, 'derin_ates', 'owner@neonbistro.com', '$2b$12$eImiTxAk4t3856/8080808080808080808080808080808080', 'business'),
-- Customers (B2C)
(6, 'can_demir', 'demo.customer@antigravity.io', '$2b$12$eImiTxAk4t3856/8080808080808080808080808080808080', 'customer'),
(7, 'aylin_turan', 'aylin.turan@mail.com', '$2b$12$eImiTxAk4t3856/8080808080808080808080808080808080', 'customer'),
(8, 'mert_kaya', 'mert.kaya@mail.com', '$2b$12$eImiTxAk4t3856/8080808080808080808080808080808080', 'customer'),
(9, 'ceren_sahin', 'ceren.sahin@mail.com', '$2b$12$eImiTxAk4t3856/8080808080808080808080808080808080', 'customer');

-- Adjust serial sequence for serial keys if using PostgreSQL
ALTER SEQUENCE users_id_seq RESTART WITH 10;

-- 2. SEED BUSINESSES
-- Coordinates map precisely to Antigravity's SVG/Radar projections in the Beşiktaş/Karaköy regions
INSERT INTO businesses (id, owner_id, name, category, latitude, longitude, address, description) VALUES
(1, 1, 'Gourmet Burgers', 'Burger', 41.0232, 28.9784, 'Karaköy, Kemankeş Cd. No:45, İstanbul', 'Sulu gurme burger köftesi ve el yapımı özel soslarıyla bölgenin öncü burger markası.'),
(2, 2, 'The Daily Grind', 'Cafe', 40.9856, 29.0289, 'Moda, Şair Nefi Sk. No:12, Kadıköy, İstanbul', 'Nitelikli üçüncü dalga filtre kahveleri, taze kruvasanları ve dijital göçebeler için sessiz çalışma ortamı.'),
(3, 3, 'Karaköy Balıkçısı', 'Restoran', 41.0252, 28.9754, 'Karaköy, Rıhtım Cd. No:14, İstanbul', 'Eşsiz deniz manzarası eşliğinde günlük taze deniz ürünleri ve meşhur taze balık tabakları.'),
(4, 4, 'Cyber Pizza', 'Pizzacı', 41.0428, 29.0069, 'Beşiktaş, Barbaros Blv. No:78, İstanbul', 'Merkezi konumu ve bütçe dostu fiyatlarıyla öğrencilerin uğrak noktası olan hızlı pizza lokantası.'),
(5, 5, 'Neon Bistro', 'Bistro', 41.0345, 28.9792, 'Beyoğlu, İstiklal Cd. No:112, İstanbul', 'Cyberpunk neon dekorasyonu, harika kokteylleri ve canlı akustik müzik performansları ile popüler gece mekanı.');

ALTER SEQUENCE businesses_id_seq RESTART WITH 6;

-- 3. SEED REVIEWS
-- Simulated reviews carrying specific positive and negative sentiment markers for parsing
INSERT INTO reviews (id, business_id, user_id, rating, comment) VALUES
-- Gourmet Burgers (Positive overall, narrow space complaint)
(1, 1, 6, 5, 'Burger inanılmaz lezzetliydi! Köfte eti tam kıvamında pişmiş ve çok suluydu. Özel yapım ev soslarına tek kelimeyle bayıldım. Servis de gayet hızlıydı.'),
(2, 1, 7, 4, 'Lezzeti çok başarılı fakat hafta sonu akşam saatlerinde gittiğimiz için kapıda sıra bekledik. Oturma alanı oldukça dar. Fiyatlar bir tık pahalı ama değer.'),
(3, 1, 8, 5, 'Nihayet düzgün gurme burger yapan bir yer! Tavuk burger seçeneği de efsane. Malzemeler çok taze ve kaliteli.'),

-- The Daily Grind (Positive work cafe, slow wifi complaint)
(4, 2, 9, 4, 'Filtre kahvesi oldukça taze ve aromatikti. Çalışmak için çok sessiz ve huzurlu bir ortamı var. Ancak kablosuz internet (Wi-Fi) hızı biraz yavaş, priz sayısı artırılmalı.'),

-- Cyber Pizza (Negative rating, wet dough and poor service)
(5, 4, 6, 2, 'Pizzanın hamuru maalesef içi ıslak ve çiğ kalmıştı. Ayrıca kurye çok geç getirdi, pizza buz gibi soğumuştu. Bu lezzetsizliğe bir daha gelmem.'),
(6, 4, 7, 1, 'Servis kalitesi rezalet, siparişi getiren personel inanılmaz derecede kaba ve ilgisizdi. Müşteriye karşı tavırları çok kötü, kesinlikle tavsiye etmiyorum.'),
(7, 4, 8, 2, 'Bütçe dostu diye sipariş verdim fakat malzemeler o kadar kalitesiz ki, yerken hiç keyif almadım. Porsiyon doyurucu ama lezzet sıfır.');

ALTER SEQUENCE reviews_id_seq RESTART WITH 8;

-- 4. SEED VISITED PLACES
-- Simulated visited checklist sync
INSERT INTO visited_places (id, user_id, business_id) VALUES
(1, 6, 1), -- Can Demir saved Gourmet Burgers
(2, 6, 3), -- Can Demir saved Karaköy Balıkçısı
(3, 7, 5); -- Aylin saved Neon Bistro

ALTER SEQUENCE visited_places_id_seq RESTART WITH 4;

-- 5. SEED SENTIMENT ANALYSES
-- Simulated AI processing logs corresponding to seeded reviews
INSERT INTO sentiment_analyses (id, review_id, business_id, score, sentiment_label, action_suggestion) VALUES
-- Gourmet Burgers Analysis
(1, 1, 1, 96, 'positive', 'Olumlu geri bildirimleri korumak için köfte pişirme standardını sürdürün. Sos formülünü sosyal medya içeriklerinde reklam yapabilirsiniz.'),
(2, 2, 1, 48, 'neutral', 'Dar oturma alanından şikayetçi müşteriler için masa düzenini ferahlatın veya hafta sonu yoğun saatlerde rezervasyon/sıra takip sistemi kurgulayın.'),
(3, 3, 1, 98, 'positive', 'Gurme tavuk burger çeşitlerini öne çıkararak menü tanıtımlarını güçlendirin.'),

-- The Daily Grind Analysis
(4, 4, 2, 70, 'positive', 'Nitelikli kahve kalitesini koruyun. Uzaktan çalışan dijital göçebe müşterilerin memnuniyeti için Wi-Fi altyapı hızını artırın ve prizli masa sayısını çoğaltın.'),

-- Cyber Pizza Analysis
(5, 5, 4, 18, 'negative', 'Hamurun ıslak/çiğ kalma şikayeti için mutfak fırın sıcaklık kalibrasyonunu yapın. Kurye rotalarını hızlandırmak amacıyla lojistik kontrolü gerçekleştirin.'),
(6, 6, 4, 5, 'negative', 'Hizmet kalitesi ve personel davranışları son derece kritik seviyede olumsuz. İlgili personele acil müşteri ilişkileri eğitimi verilmesi gerekmektedir.'),
(7, 7, 4, 28, 'negative', 'Düşük malzeme kalitesi algısını aşmak adına tedarikçi kontrolü yapın ya da uygun fiyatı korumak adına doyurucu kombine öğrenci menüleri tasarlayın.');

ALTER SEQUENCE sentiment_analyses_id_seq RESTART WITH 8;
