import React, { useState, useEffect, useRef } from 'react';
import { GoogleMap, MarkerF } from '@react-google-maps/api';
import { api } from '../services/api';
import { 
  Shield, Sparkles, MapPin, BarChart3, User, KeyRound, 
  ArrowRight, Search, Compass, Navigation, Star, ShieldAlert, ArrowLeft, Loader2, MessageCircle
} from 'lucide-react';

const mapContainerStyle = {
  width: '100%',
  height: '100%',
  minHeight: '260px',
  borderRadius: '16px',
};

const defaultCenter = {
  lat: 41.0252,
  lng: 28.9754,
};

// Premium Glassmorphism Cyberpunk Dark Theme for Google Maps
const darkMapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  styles: [
    { elementType: "geometry", stylers: [{ color: "#0b0f19" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#0b0f19" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#64748b" }] },
    {
      featureType: "administrative",
      elementType: "geometry.stroke",
      stylers: [{ color: "#1e293b" }],
    },
    {
      featureType: "administrative.land_parcel",
      elementType: "labels.text.fill",
      stylers: [{ color: "#475569" }],
    },
    {
      featureType: "landscape.natural",
      elementType: "geometry",
      stylers: [{ color: "#0f172a" }],
    },
    {
      featureType: "poi",
      elementType: "geometry",
      stylers: [{ color: "#0b0f19" }],
    },
    {
      featureType: "poi",
      elementType: "labels.text.fill",
      stylers: [{ color: "#38bdf8" }, { opacity: 0.7 }],
    },
    {
      featureType: "poi.park",
      elementType: "geometry.fill",
      stylers: [{ color: "#090d16" }],
    },
    {
      featureType: "road",
      elementType: "geometry",
      stylers: [{ color: "#1e293b" }],
    },
    {
      featureType: "road.local",
      elementType: "labels.text.fill",
      stylers: [{ color: "#475569" }],
    },
    {
      featureType: "transit",
      elementType: "labels.text.fill",
      stylers: [{ color: "#818cf8" }],
    },
    {
      featureType: "water",
      elementType: "geometry",
      stylers: [{ color: "#1e1b4b" }],
    },
  ],
};



export const AuthView = ({ onAuthSuccess, isLoaded }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState('business'); // Default to business as requested
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // B2B Coordinate Map Selector & PIN states
  const [map, setMap] = useState(null);
  const [center, setCenter] = useState(defaultCenter);
  const [businesses, setBusinesses] = useState([]);
  const [businessSearch, setBusinessSearch] = useState('');
  const [citySearch, setCitySearch] = useState('İstanbul');
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [pin, setPin] = useState('');
  const [showPinScreen, setShowPinScreen] = useState(false);
  const [pinError, setPinError] = useState('');
  const [authFailed, setAuthFailed] = useState(false);
  const b2bPlacesServiceRef = useRef(null);
  const [businessReviews, setBusinessReviews] = useState([]);
  const [fetchingReviews, setFetchingReviews] = useState(false);
  const [showMapReviews, setShowMapReviews] = useState(false);
  
  const [manualAddress, setManualAddress] = useState('');
  const [manualBusinessName, setManualBusinessName] = useState('');

  // AI Analysis states removed from AuthView (moved to BusinessDashboard)
  const [activeTab, setActiveTab] = useState('businesses');

  // Robust maps auth failure listener to trigger simulated fallback instantly
  useEffect(() => {
    // Clear any stale auth failure flags so real API key is always tried first
    localStorage.removeItem('sentimap_maps_auth_failed');

    window.gm_authFailure = () => {
      console.warn("Google Maps API Key verification failed.");
      setAuthFailed(true);
    };
  }, []);

  // Update manual login inputs when opening PIN screen
  useEffect(() => {
    if (showPinScreen && selectedBusiness) {
      setManualAddress(selectedBusiness.address || '');
      setManualBusinessName(selectedBusiness.name || '');
    }
  }, [showPinScreen, selectedBusiness]);

  // Fetch Nearby Real-world Places from Google Places API for B2B Picker
  const fetchB2BPlaces = (mapInstance, coords, keyword) => {
    if (!window.google || !mapInstance) return;
    
    setLoading(true);
    const safeTimeout = setTimeout(() => {
      setLoading(false);
    }, 2500);

    try {
      const service = new window.google.maps.places.PlacesService(mapInstance);

      const request = {
        location: coords,
        radius: '1500', // 1.5 km radius
        type: 'restaurant',
        keyword: keyword || undefined
      };

      service.nearbySearch(request, (results, status) => {
        clearTimeout(safeTimeout);
        setLoading(false);
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
          const mapped = results.map(place => ({
            id: place.place_id,
            name: place.name,
            category: place.types.includes('cafe') ? 'Cafe' : 'Restoran',
            address: place.vicinity || 'İstanbul',
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
            rating: place.rating || 4.0,
            reviewCount: place.user_ratings_total || 25,
            rawPlace: place
          }));
          
          setBusinesses(mapped);
          if (mapped.length > 0 && !selectedBusiness) {
            setSelectedBusiness(mapped[0]); // Default select first
          }
        } else {
          // Gerçek API kısıtlaması varsa boş liste döndür
          setBusinesses([]);
        }
      });
    } catch (err) {
      console.error("Places API hatası:", err);
      setLoading(false);
      setBusinesses([]);
    }
  };

  // Triggers when B2B map loads
  const onMapLoad = (mapInstance) => {
    setMap(mapInstance);
    b2bPlacesServiceRef.current = new window.google.maps.places.PlacesService(mapInstance);
    fetchB2BPlaces(mapInstance, center, businessSearch);
  };

  // Simplified: just set the business; useEffect handles review fetch
  const handleB2BBusinessSelect = (biz) => {
    setSelectedBusiness(biz);
    setShowMapReviews(true); // Yorumları otomatik aç
  };

  const handleMapClick = (e) => {
    if (!e.placeId) return;
    if (typeof e.stop === 'function') e.stop(); // prevent Google's default info window popup
    const service = b2bPlacesServiceRef.current;
    if (!service || !window.google) return;
    
    setFetchingReviews(true);
    try {
      service.getDetails(
        { placeId: e.placeId, fields: ['place_id', 'name', 'vicinity', 'rating', 'geometry', 'types'] },
        (place, status) => {
          setFetchingReviews(false);
          if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
            setSelectedBusiness({
              id: place.place_id,
              name: place.name,
              category: place.types?.includes('cafe') ? 'Cafe' : 'Restoran',
              address: place.vicinity || 'İstanbul',
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
              rating: place.rating || 4.0,
            });
          } else {
            console.warn("getDetails failed for POI:", status);
            // setAuthFailed(true); // removed to avoid hiding the map
          }
        }
      );
    } catch (err) {
      setFetchingReviews(false);
      console.error(err);
    }
  };

  // Fetch reviews whenever selectedBusiness changes
  useEffect(() => {
    if (!selectedBusiness) {
      setBusinessReviews([]);
      setFetchingReviews(false);
      return;
    }
    setBusinessReviews([]);
    setFetchingReviews(false);

    // Real Google Places API path
    const service = b2bPlacesServiceRef.current;
    if (!service || !window.google) return;
    setFetchingReviews(true);
    try {
      service.getDetails(
        { placeId: selectedBusiness.id, fields: ['reviews', 'name', 'rating'] },
        (details, status) => {
          setFetchingReviews(false);
          if (status === window.google.maps.places.PlacesServiceStatus.OK && details) {
            let fetchedReviews = details.reviews || [];
            // Yorumları zamana göre yeniden eskiye (en yeniler) sırala
            fetchedReviews.sort((a, b) => (b.time || 0) - (a.time || 0));
            setBusinessReviews(fetchedReviews);
          } else {
            console.warn("Google Places API'den detaylar çekilemedi. API Kısıtlamasını kontrol edin.");
          }
        }
      );
    } catch (err) {
      setFetchingReviews(false);
      setBusinessReviews([{ author_name: 'Hata', text: 'API bağlantısı kurulamadı.', rating: 3 }]);
    }
  }, [selectedBusiness?.id]);

  // Clear selection and go back to business list
  const handleB2BBack = () => {
    setSelectedBusiness(null);
  };

  // Re-fetch B2B when search changes with a slight delay or triggered
  const handleB2BSearchSubmit = (e) => {
    if (e) e.preventDefault();
    if (map && window.google) {
      // Önce şehri Geocode et, sonra o merkeze göre ara
      setLoading(true);
      const safeGeoTimeout = setTimeout(() => {
        setLoading(false);
      }, 3000);
      
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address: citySearch || 'İstanbul' }, (results, status) => {
        clearTimeout(safeGeoTimeout);
        if (status === 'OK' && results[0]) {
          const newCenter = {
            lat: results[0].geometry.location.lat(),
            lng: results[0].geometry.location.lng()
          };
          setCenter(newCenter);
          map.setCenter(newCenter);
          fetchB2BPlaces(map, newCenter, businessSearch);
        } else {
          setLoading(false);
          // Geocode fail, fallback to current map center
          fetchB2BPlaces(map, center, businessSearch);
        }
      });
    }
  };

  // Handle Drag Map changes for B2B list
  const onMapDragEnd = () => {
    if (map) {
      const newCenter = {
        lat: map.getCenter().lat(),
        lng: map.getCenter().lng()
      };
      setCenter(newCenter);
      fetchB2BPlaces(map, newCenter, businessSearch);
    }
  };

  // Reset states on switching portal roles
  const handleRoleChange = (newRole) => {
    setRole(newRole);
    setError('');
    setPinError('');
    setShowPinScreen(false);
    setPin('');
  };

  // Submit standard B2C Customer Form
  const handleSubmitCustomer = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const data = await api.login({ email, password, role: 'customer' });
        if (data.success && onAuthSuccess) {
          onAuthSuccess(data.user);
        }
      } else {
        const data = await api.register({ name, email, password, role: 'customer' });
        if (data.success && onAuthSuccess) {
          onAuthSuccess(data.user);
        }
      }
    } catch (err) {
      setError(err.message || 'Bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  // Submit B2B PIN Login
  const handlePinSubmit = async (e) => {
    e.preventDefault();
    setPinError('');

    if (pin !== '1234') {
      setPinError('Hatalı Yönetici PIN Kodu! (Doğru Yetkilendirme Şarttır - İpucu: 1234)');
      return;
    }

    setLoading(true);
    try {
      const b2bEmail = selectedBusiness ? `owner@${selectedBusiness.id}.com` : `owner@manual-business.com`;
      
      // Perform B2B login and associate claimed Google Place ID
      const data = await api.login({
        email: b2bEmail,
        password: 'hackathon2026',
        role: 'business',
        businessId: selectedBusiness?.id || 'manual-business',
        businessName: manualBusinessName || selectedBusiness?.name || 'Manuel İşletme',
        businessCategory: selectedBusiness?.category || 'Restoran'
      });
      
      if (data.success && onAuthSuccess) {
        onAuthSuccess(data.user);
      }
    } catch (err) {
      setPinError(err.message || 'Yönetim sunucusuna bağlanırken hata oluştu.');
      setLoading(false);
    }
  };


  // Instant developer autofill for B2C Customer
  const handleQuickFillCustomer = () => {
    setEmail('demo.customer@sentimap.io');
    setPassword('hackathon2026');
    setName('Can Demir');
  };

  return (
    <div className="min-h-[85vh] flex flex-col py-6 px-2 sm:px-4 select-none w-full max-w-7xl mx-auto mt-4 md:mt-10">
      {/* Decorative center glow background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] max-w-[90vw] h-[350px] rounded-full bg-cyber-primary/10 blur-3xl pointer-events-none z-0" />
      
      {/* Logo & Headline */}
      <div className="text-center mb-6 relative z-10 space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyber-accent/30 bg-cyber-accent/5 backdrop-blur text-cyber-accent text-xs font-semibold tracking-wider uppercase mb-1">
          <Sparkles size={12} className="animate-pulse" />
          <span>Hackathon Projesi</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
          SENTI<span className="text-gradient-cyan-violet">MAP</span>
        </h1>
        <p className="text-xs text-cyber-muted max-w-sm mx-auto leading-relaxed">
          Müşteriler için harita tabanlı yorumlama, işletmeler için yapay zeka destekli duygu analizi platformu.
        </p>
      </div>

      {/* Main Glass Panel */}
      <div className={`w-full mx-auto glass-panel rounded-2xl border-slate-800/80 p-4 md:p-8 shadow-2xl relative z-10 transition-all duration-500 ease-out ${
        role === 'business' && !showPinScreen ? 'max-w-6xl' : 'max-w-md'
      }`}>
        
        {/* Tab Selection */}
        <div className="grid grid-cols-2 gap-2 p-1.5 rounded-xl bg-slate-950/60 border border-slate-800/80 mb-6">
          <button
            onClick={() => handleRoleChange('customer')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
              role === 'customer' 
                ? 'bg-cyber-accent text-slate-950 font-bold shadow-md shadow-cyber-accent/20' 
                : 'text-cyber-muted hover:text-slate-200'
            }`}
          >
            <MapPin size={14} />
            <span>Müşteri (B2C)</span>
          </button>
          <button
            onClick={() => handleRoleChange('business')}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
              role === 'business' 
                ? 'bg-cyber-primary text-slate-100 font-bold shadow-md shadow-cyber-primary/20' 
                : 'text-cyber-muted hover:text-slate-200'
            }`}
          >
            <BarChart3 size={14} />
            <span>İşletme (B2B)</span>
          </button>
        </div>

        {/* B2C CUSTOMER LOGIN VIEW */}
        {role === 'customer' && (
          <div className="space-y-4">
            <div className="text-center mb-2">
              <p className="text-xs text-cyber-muted">
                Harita üzerinde gerçek işletmeleri keşfet, yapay zeka analizlerini gör.
              </p>
            </div>

            {/* Quick Autofill */}
            <div className="flex justify-center mb-4">
              <button 
                type="button"
                onClick={handleQuickFillCustomer}
                className="text-[10px] text-cyber-accent border border-cyber-accent/20 hover:border-cyber-accent/40 bg-cyber-accent/5 px-3 py-1.5 rounded-md transition-all font-bold"
              >
                Hızlı Müşteri Doldur (Hackathon)
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-lg border border-cyber-danger/30 bg-cyber-danger/10 text-cyber-danger text-xs font-medium text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmitCustomer} className="space-y-4">
              {!isLogin && (
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-cyber-muted">Ad Soyad</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                    <input 
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Can Demir"
                      required
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950/40 text-xs focus:border-cyber-accent focus:outline-none transition-colors text-slate-100"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold tracking-widest text-cyber-muted">E-posta</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="ornek@sentimap.io"
                    required
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950/40 text-xs focus:border-cyber-accent focus:outline-none transition-colors text-slate-100"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold tracking-widest text-cyber-muted">Şifre</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950/40 text-xs focus:border-cyber-accent focus:outline-none transition-colors text-slate-100"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold uppercase tracking-widest text-slate-950 bg-cyber-accent border border-cyber-accent hover:shadow-cyber-accent/20 hover:scale-[1.01] hover:brightness-105 transition-all duration-300"
              >
                <span>{loading ? 'Yükleniyor...' : (isLogin ? 'Giriş Yap' : 'Kayıt Ol')}</span>
                {!loading && <ArrowRight size={14} />}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => { setIsLogin(!isLogin); setError(''); }}
                className="text-xs text-cyber-muted hover:text-cyber-accent transition-colors font-medium"
              >
                {isLogin 
                  ? 'Hesabınız yok mu? Yeni bir hesap oluşturun' 
                  : 'Zaten bir hesabınız var mı? Giriş yapın'}
              </button>
            </div>
          </div>
        )}

        {/* B2B BUSINESS PORTAL ACCESS */}
        {role === 'business' && (
          <div className="space-y-4">
            {/* 1. PIN PASSWORD LOCK SCREEN OVERLAY */}
            {showPinScreen ? (
              <div className="max-w-md mx-auto space-y-6 py-4 transition-all duration-500">
                <div className="text-center space-y-2 mb-6">
                  <div className="w-12 h-12 rounded-full bg-cyber-primary/10 border border-cyber-primary/30 flex items-center justify-center mx-auto mb-2 text-cyber-primary">
                    <Shield size={24} className="stroke-[2]" />
                  </div>
                  <h3 className="text-xl font-black text-slate-100">YÖNETİM DOĞRULAMASI</h3>
                  <p className="text-xs text-cyber-muted px-4 leading-relaxed">
                    <strong className="text-slate-200">{selectedBusiness?.name}</strong> paneline erişmek için şifrenizi girin.
                  </p>
                </div>

                {pinError && (
                  <div className="p-3 bg-cyber-danger/10 border border-cyber-danger/20 rounded-lg flex items-center gap-2 text-cyber-danger text-xs font-bold animate-shake">
                    <ShieldAlert size={14} />
                    <span>{pinError}</span>
                  </div>
                )}

                <div className="bg-slate-900/30 p-6 rounded-2xl border border-slate-800">
                  <form onSubmit={handlePinSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] uppercase font-black tracking-widest text-cyber-muted block text-center">
                      İl / İlçe Seçimi
                    </label>
                    <div className="relative max-w-[280px] mx-auto">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
                      <input 
                        type="text" 
                        value={manualAddress}
                        onChange={(e) => setManualAddress(e.target.value)}
                        placeholder="İl / İlçe giriniz"
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900/50 text-xs font-semibold text-slate-200 focus:border-cyber-primary focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] uppercase font-black tracking-widest text-cyber-muted block text-center">
                      İşletme Adı
                    </label>
                    <div className="relative max-w-[280px] mx-auto">
                      <BarChart3 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
                      <input 
                        type="text" 
                        value={manualBusinessName}
                        onChange={(e) => setManualBusinessName(e.target.value)}
                        placeholder="İşletme adınızı giriniz"
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-900/50 text-xs font-semibold text-slate-200 focus:border-cyber-primary focus:outline-none transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                    <label className="text-[9px] uppercase font-black tracking-widest text-cyber-muted block text-center">
                      Şifre (Demo: 1234)
                    </label>
                    <div className="relative max-w-[280px] mx-auto">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
                      <input 
                        type="password" 
                        maxLength={4}
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                        placeholder="••••"
                        required
                        autoFocus
                        className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-800 bg-slate-950/80 text-center text-lg font-black tracking-[0.6em] focus:border-cyber-primary focus:outline-none transition-colors text-slate-100"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => { setShowPinScreen(false); setPin(''); setPinError(''); }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-400 border border-slate-800 hover:bg-slate-900 transition-all duration-300"
                    >
                      <ArrowLeft size={13} />
                      <span>İptal</span>
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-100 bg-cyber-primary border border-cyber-primary hover:shadow-lg hover:shadow-cyber-primary/20 hover:brightness-105 transition-all duration-300"
                    >
                      <span>{loading ? 'Bağlanıyor...' : 'Bağlan'}</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </form>
                </div>
              </div>
            ) : (
              /* 2. MAP FINDER & DISCOVERY LANDING */
              <div className="space-y-4">
                <div className="pb-3 border-b border-slate-800/80">
                  <h3 className="text-sm font-bold text-slate-200">İşletmenizi Arayın veya Haritadan Bulun</h3>
                  <p className="text-[11px] text-cyber-muted">
                    Aşağıdaki haritadan veya listeden yeme-içme işletmenizi seçerek yönetim konsolunuza giriş yapın.
                  </p>
                </div>

                <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 items-stretch">
                  
                  {/* Left: Always visible business list (4 cols) */}
                  <div className="w-full lg:col-span-4 flex flex-col space-y-3">
                    <form onSubmit={handleB2BSearchSubmit} className="space-y-2 flex-shrink-0">
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                        <input
                          type="text"
                          value={citySearch}
                          onChange={(e) => setCitySearch(e.target.value)}
                          placeholder="Şehir veya İlçe (Örn: Beşiktaş)"
                          className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-800 bg-slate-950/60 text-xs focus:border-cyber-accent focus:outline-none transition-colors text-slate-100"
                        />
                      </div>
                      <div className="relative flex gap-2">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                          <input
                            type="text"
                            value={businessSearch}
                            onChange={(e) => setBusinessSearch(e.target.value)}
                            placeholder="İşletme adı ara..."
                            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-800 bg-slate-950/40 text-xs focus:border-cyber-primary focus:outline-none transition-colors text-slate-100"
                          />
                        </div>
                        <button type="submit" className="px-3 py-2 bg-cyber-primary text-slate-100 rounded-xl text-xs font-bold hover:brightness-110">Bul</button>
                      </div>
                    </form>
                    <div className="overflow-y-auto h-[350px] md:h-[65vh] pr-1 scrollbar-thin bg-slate-900/10 rounded-xl p-1 border border-slate-900/50">
                      {loading && <div className="flex justify-center py-8"><Loader2 size={16} className="text-cyber-primary animate-spin" /></div>}
                      {businesses.map((biz) => {
                        const isSel = selectedBusiness && selectedBusiness.id === biz.id;
                        return (
                          <div key={biz.id} onClick={() => handleB2BBusinessSelect(biz)}
                            className={`p-2.5 rounded-xl border transition-all duration-300 cursor-pointer flex justify-between items-center ${
                              isSel ? 'bg-cyber-primary/5 border-cyber-primary/60' : 'bg-slate-900/30 border-slate-800/60 hover:border-slate-700/60'
                            }`}>
                            <div className="space-y-0.5 max-w-[70%]">
                              <h4 className="text-xs font-bold text-slate-200 truncate">{biz.name}</h4>
                              <p className="text-[9px] text-cyber-muted truncate flex items-center gap-0.5"><MapPin size={9} />{biz.category} • {biz.address.split(',')[0]}</p>
                            </div>
                            <span className="text-[9px] font-bold text-cyber-accent bg-cyber-primary/10 border border-cyber-primary/20 px-1.5 py-0.5 rounded">{biz.rating} ★</span>
                          </div>
                        );
                      })}
                        {businesses.length === 0 && !loading && <p className="text-center py-6 text-[10px] text-cyber-muted italic">İşletme bulunamadı.</p>}
                      </div>
                  </div>

                  {/* Right: Map (top) + Reviews Overlay — 8 cols */}
                  <div className="w-full lg:col-span-8 flex flex-col space-y-3">
                    {/* MAP */}
                    <div className="relative rounded-xl bg-slate-950 border border-slate-900 overflow-hidden h-[400px] lg:h-[65vh]">
                      
                      {/* Overlay: Reviews Box */}
                      {selectedBusiness && (
                        <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                          <button 
                            onClick={() => setShowMapReviews(!showMapReviews)}
                            className="bg-slate-950/90 backdrop-blur-sm border border-slate-700/80 px-4 py-2.5 rounded-lg text-xs font-bold text-slate-100 flex items-center gap-2 shadow-xl hover:bg-slate-900 transition-colors"
                          >
                            <MessageCircle size={14} className="text-cyber-primary" />
                            {selectedBusiness.name} Yorumları
                            {fetchingReviews ? <Loader2 size={12} className="animate-spin" /> : <span className="text-cyber-muted text-[10px]">({businessReviews.length})</span>}
                          </button>

                          {showMapReviews && (
                            <div className="w-[320px] max-h-[350px] overflow-y-auto bg-slate-950/95 backdrop-blur-md border border-slate-800 rounded-xl p-3 shadow-2xl scrollbar-thin">
                              <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-800">
                                <span className="text-[10px] text-cyber-muted font-bold">Gerçek Zamanlı Google Yorumları</span>
                                <button onClick={() => setShowMapReviews(false)} className="text-[10px] text-slate-500 hover:text-slate-300">✕</button>
                              </div>
                              {fetchingReviews ? (
                                <div className="flex justify-center py-4"><Loader2 size={18} className="text-cyber-primary animate-spin" /></div>
                              ) : businessReviews.length === 0 ? (
                                <p className="text-center py-3 text-[10px] text-cyber-muted italic">Bu işletme için yorum bulunamadı.</p>
                              ) : (
                                <div className="space-y-2">
                                  {businessReviews.map((review, idx) => {
                                    const lc = review.rating >= 4 ? 'border-l-emerald-500' : review.rating >= 3 ? 'border-l-amber-400' : 'border-l-red-500';
                                    return (
                                      <div key={idx} className={`p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 border-l-2 ${lc} space-y-1.5`}>
                                        <div className="flex items-center justify-between gap-1">
                                          <p className="text-[10px] font-bold text-slate-200 truncate">{review.author_name}</p>
                                          <div className="flex gap-0.5 flex-shrink-0">
                                            {[1,2,3,4,5].map(s => <Star key={s} size={8} className={s<=(review.rating||0)?'text-amber-400 fill-amber-400':'text-slate-700'} />)}
                                          </div>
                                        </div>
                                        <p className="text-[9px] text-slate-400 leading-relaxed">{review.text}</p>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {!isLoaded ? (
                        <div className="flex flex-col items-center justify-center h-full space-y-2 text-cyber-primary">
                          <Loader2 size={24} className="animate-spin" />
                          <span className="text-[10px] font-bold">Harita Yükleniyor...</span>
                        </div>
                      ) : (
                        <GoogleMap
                          mapContainerStyle={{ width: '100%', height: '100%' }}
                          center={center}
                          zoom={14}
                          options={darkMapOptions}
                          onLoad={onMapLoad}
                          onDragEnd={onMapDragEnd}
                          onClick={handleMapClick}
                        >
                          {businesses.map((biz) => {
                            const isSel = selectedBusiness && selectedBusiness.id === biz.id;
                            return (
                              <MarkerF
                                key={biz.id}
                                position={{ lat: biz.lat, lng: biz.lng }}
                                onClick={() => handleB2BBusinessSelect(biz)}
                                icon={window.google ? {
                                  path: window.google.maps.SymbolPath.CIRCLE,
                                  fillColor: isSel ? '#a78bfa' : '#8b5cf6',
                                  fillOpacity: 0.9, strokeColor: '#0b0f19', strokeWeight: 2,
                                  scale: isSel ? 9 : 6,
                                } : undefined}
                              />
                            );
                          })}
                        </GoogleMap>
                      )}
                    </div>
                  </div>
                </div>

                {/* Claim details and Connector button */}
                {selectedBusiness ? (
                  <div className="p-4 rounded-xl bg-cyber-primary/5 border border-cyber-primary/20 flex flex-col md:flex-row justify-between items-center gap-4 mt-3">
                    <div className="space-y-1 text-center md:text-left">
                      <span className="text-[9px] uppercase font-black px-2 py-0.5 rounded bg-cyber-primary/20 text-cyber-primary border border-cyber-primary/30">
                        SEÇİLEN İŞLETME
                      </span>
                      <h4 className="text-xs font-bold text-slate-100 mt-1">{selectedBusiness.name}</h4>
                      <p className="text-[10px] text-cyber-muted">{selectedBusiness.address}</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                      <button
                        onClick={() => setShowPinScreen(true)}
                        className="flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-100 bg-cyber-primary border border-cyber-primary hover:shadow-lg hover:shadow-cyber-primary/20 hover:scale-[1.01] transition-all duration-300 w-full md:w-auto"
                      >
                        <Shield size={13} />
                        <span>GİRİŞ YAP</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 mt-3">
                    <div className="space-y-1 text-center md:text-left text-cyber-muted">
                      <p className="text-xs font-semibold">Haritadan işletme seçin veya manuel giriş yapın</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                      <button
                        onClick={() => setShowPinScreen(true)}
                        className="flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-100 bg-slate-800 border border-slate-700 hover:bg-cyber-primary hover:border-cyber-primary hover:shadow-lg transition-all duration-300 w-full md:w-auto"
                      >
                        <User size={13} />
                        <span>MANUEL GİRİŞ YAP</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default AuthView;
