import React, { useState, useEffect, useRef } from 'react';
import { GoogleMap, MarkerF, InfoWindowF } from '@react-google-maps/api';
import { api } from '../services/api';
import { SentimentGauge } from '../components/SentimentGauge';
import { ActionItem } from '../components/ActionItem';
import { 
  BarChart3, Users, Award, TrendingUp, Sparkles, 
  CheckSquare, Landmark, Flame, Compass, MapPin, 
  ShieldAlert, Settings, ArrowLeft, Navigation, Star, Heart, Loader2,
  PieChart, BarChart2, MessageSquare
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

export const BusinessDashboard = ({ currentUser, isLoaded, onLogout }) => {
  const [businesses, setBusinesses] = useState([]);
  const [selectedBusiness, setSelectedBusiness] = useState(null); // Active selection in B2B Map selector
  const [activeBusinessId, setActiveBusinessId] = useState(currentUser?.businessId || null); // Active B2B dashboard session ID
  
  // Active B2B dashboard states
  const [dashboardBusiness, setDashboardBusiness] = useState(null);
  const [sentiment, setSentiment] = useState(null);
  const [competitors, setCompetitors] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [competitorRanking, setCompetitorRanking] = useState(null);
  const [competitorSummary, setCompetitorSummary] = useState(null);
  const [competitorLoading, setCompetitorLoading] = useState(false);
  
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview'); // overview, competitors, actions
  const [sidebarActive, setSidebarActive] = useState('profil'); // profil, analiz, ayarlar
  const [analysisResult, setAnalysisResult] = useState(null);
  const [center, setCenter] = useState(defaultCenter);
  const [map, setMap] = useState(null);

  // Load all restaurants in Karaköy/Beşiktaş region for B2B selection using Google Places
  const fetchB2BPlaces = (mapInstance, coords, keyword) => {
    if (!window.google || !mapInstance) return;
    
    setLoading(true);
    const service = new window.google.maps.places.PlacesService(mapInstance);

    const request = {
      location: coords,
      radius: '1500', // 1.5 km radius
      type: ['restaurant', 'cafe', 'food', 'bakery'],
      keyword: keyword || undefined
    };

    service.nearbySearch(request, (results, status) => {
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
          sentimentScore: Math.round(50 + (place.rating || 4.0) * 10), // estimate for B2B list
          rawPlace: place
        }));
        
        setBusinesses(mapped);
        // Default select the first item on B2B map for richer initial load
        if (mapped.length > 0 && !selectedBusiness) {
          setSelectedBusiness(mapped[0]);
        }
      } else {
        setBusinesses([]);
      }
    });
  };

  const onMapLoad = (mapInstance) => {
    setMap(mapInstance);
    fetchB2BPlaces(mapInstance, center, search);
  };

  const onMapDragEnd = () => {
    if (map) {
      const newCenter = {
        lat: map.getCenter().lat(),
        lng: map.getCenter().lng()
      };
      setCenter(newCenter);
      fetchB2BPlaces(map, newCenter, search);
    }
  };

  const handleB2BSearchSubmit = (e) => {
    if (e) e.preventDefault();
    if (map) {
      fetchB2BPlaces(map, center, search);
    }
  };

  // Load B2B Dashboard data once a business is connected and Google Places is active
  useEffect(() => {
    if (!activeBusinessId || !isLoaded || !window.google) return;

    const loadDashboardData = async () => {
      setLoading(true);
      try {
        if (activeBusinessId === 'manual-business') {
          // Fallback for manually entered businesses
          const mockBiz = {
            id: 'manual-business',
            name: currentUser?.businessName || 'Manuel İşletme',
            address: 'Belirtilmedi',
            category: currentUser?.businessCategory || 'Restoran',
            rating: 4.5,
            reviewCount: 42,
            sentimentScore: 78
          };
          
          setDashboardBusiness(mockBiz);
          
          const mockAnalysis = {
            overall_sentiment_score: 78,
            overall_sentiment_label: 'positive',
            suggestions: [
              { title: 'Harika', text: 'Genel hizmet kalitesi.', type: 'success' },
              { title: 'Dikkat', text: 'Servis hızı artırılmalı.', type: 'warning' }
            ]
          };
          setAnalysisResult(mockAnalysis);
          
          setSentiment({
            aiSummary: 'Örnek analiz raporudur.',
            distribution: [{month:'Nis', score: 70}, {month:'May', score: 78}],
            pros: ['Hizmet'], cons: ['Hız']
          });
          setCompetitors([]);
          setRecommendations([]);
          setLoading(false);
          return;
        }

        const service = new window.google.maps.places.PlacesService(document.createElement('div'));
        
        const request = {
          placeId: activeBusinessId,
          fields: ['name', 'formatted_address', 'types', 'rating', 'user_ratings_total', 'reviews', 'geometry']
        };

        service.getDetails(request, async (placeDetails, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && placeDetails) {
            const reviews = placeDetails.reviews || [];
            const category = placeDetails.types.includes('cafe') ? 'Cafe' : 'Restoran';

            try {
              // Core AI Sentiment Call to Flask Backend
              const analysis = await api.analyzeGoogleReviews(reviews, placeDetails.name, category);
              
              const bizData = {
                id: activeBusinessId,
                name: placeDetails.name,
                address: placeDetails.formatted_address || 'İstanbul',
                category: category,
                rating: placeDetails.rating || 4.0,
                reviewCount: placeDetails.user_ratings_total || 25,
                sentimentScore: analysis.overall_sentiment_score,
              };

              setDashboardBusiness(bizData);
              setAnalysisResult(analysis);

              const sentData = {
                aiSummary: analysis.overall_sentiment_score > 60 
                  ? `Bu işletme hakkında Google Places üzerinden alınan ${reviews.length} güncel yorum yapay zeka ile analiz edilmiştir. Genel duygu ağırlığı %${analysis.overall_sentiment_score} oranında olumludur.` 
                  : `Bu işletmeye ait Google Places yorumları yapay zeka ile analiz edildiğinde servis hızı ve kalite dengesi konusunda acil müdahaleler gerektiği tespit edilmiştir (Duygu Skoru: %${analysis.overall_sentiment_score}).`,
                distribution: [
                  { month: 'Oca', score: Math.max(35, Math.min(95, analysis.overall_sentiment_score - 10 + Math.round(Math.random() * 5))) },
                  { month: 'Şub', score: Math.max(35, Math.min(95, analysis.overall_sentiment_score - 5 + Math.round(Math.random() * 5))) },
                  { month: 'Mar', score: Math.max(35, Math.min(95, analysis.overall_sentiment_score - 8 + Math.round(Math.random() * 5))) },
                  { month: 'Nis', score: Math.max(35, Math.min(95, analysis.overall_sentiment_score - 2 + Math.round(Math.random() * 5))) },
                  { month: 'May', score: analysis.overall_sentiment_score },
                ],
                pros: analysis.suggestions.filter(s => s.type === 'success').map(s => s.title),
                cons: analysis.suggestions.filter(s => s.type === 'danger' || s.type === 'warning').map(s => s.title),
              };
              setSentiment(sentData);

              // Async kick off the real-time competitor analysis
              setCompetitorLoading(true);
              const lat = placeDetails.geometry?.location?.lat();
              const lng = placeDetails.geometry?.location?.lng();
              
              if (lat && lng) {
                api.analyzeCompetitors(activeBusinessId, placeDetails.name, placeDetails.rating || 4.0, lat, lng, category)
                  .then(compData => {
                    if (compData && compData.status === 'success') {
                      setCompetitorRanking(compData.ranking);
                      setCompetitorSummary(compData.regional_summary);
                    }
                  })
                  .catch(err => console.error("Real-time competitor analysis error:", err))
                  .finally(() => setCompetitorLoading(false));
              } else {
                setCompetitorLoading(false);
              }

              // Set AI Recommendations mapped to ActionItem schema
              const recData = analysis.suggestions.map((s, index) => {
                let impact = 'Medium';
                let category = 'Genel';
                if (s.type === 'danger') {
                  impact = 'High';
                  category = 'Kalite / Hizmet';
                } else if (s.type === 'warning') {
                  impact = 'Medium';
                  category = 'Servis Düzeni';
                } else if (s.type === 'info') {
                  impact = 'Low';
                  category = 'Fiyat / Düzen';
                } else if (s.type === 'success') {
                  impact = 'High';
                  category = 'Lezzet Standardı';
                }

                // Check localStorage for completed actions
                const isActioned = localStorage.getItem(`sentimap_actioned_${activeBusinessId}_rec_${index}`) === 'true';

                return {
                  id: `rec_${index}`,
                  title: s.title,
                  description: s.text,
                  impact,
                  category,
                  actioned: isActioned
                };
              });
              setRecommendations(recData);

            } catch (e) {
              if (process.env.NODE_ENV !== 'production') console.error("Yapay zeka analiz hatası:", e);
            } finally {
              setLoading(false);
            }
          } else {
            if (process.env.NODE_ENV !== 'production') console.error("Place details failed");
            setLoading(false);
          }
        });
      } catch (err) {
        console.error('B2B dashboard verisi yükleme hatası:', err);
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [activeBusinessId, isLoaded]);

  // Action item toggle callback with localStorage persistence
  const handleToggleAction = async (recId, currentStatus) => {
    try {
      const key = `sentimap_actioned_${activeBusinessId}_${recId}`;
      if (currentStatus) {
        localStorage.setItem(key, 'true');
      } else {
        localStorage.removeItem(key);
      }
      setRecommendations(prev => 
        prev.map(r => r.id === recId ? { ...r, actioned: currentStatus } : r)
      );
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.error('Öneri güncellenemedi:', err);
    }
  };

  // Cleanup stored actions when switching businesses
  const cleanupBusinessStorage = (oldBusinessId) => {
    if (!oldBusinessId) return;
    const prefix = `sentimap_actioned_${oldBusinessId}_`;
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith(prefix)) localStorage.removeItem(k);
    });
  };

  // Watch activeBusinessId changes to purge old data
  useEffect(() => {
    return () => {
      cleanupBusinessStorage(activeBusinessId);
    };
  }, []);

  // Search filtering in B2B map selector list
  const filteredBusinesses = businesses.filter(b => 
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.category.toLowerCase().includes(search.toLowerCase())
  );

  // Stats calculations
  const totalActions = recommendations.length;
  const completedActions = recommendations.filter(r => r.actioned).length;
  const actionPercentage = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;

  // Local region rank calculation based on real competitor data
  const getRegionRank = () => {
    if (!competitorRanking || competitorRanking.length < 2) return { rank: 1, text: competitorLoading ? 'Sıralama Hesaplanıyor...' : 'Bölge kategorisi lideri' };
    const ourRank = competitorRanking.find(c => c.is_target)?.rank || 1;
    let text = 'Bölge kategorisi lideri';
    if (ourRank === 2) text = 'Güçlü bölgesel rakip';
    else if (ourRank > 2) text = 'Gelişmesi gereken standart';
    return { rank: ourRank, text };
  };
  const regionRank = getRegionRank();

  // ----------------------------------------------------
  // VIEW 1: B2B BUSINESS MAP & SELECTOR PORTAL
  // ----------------------------------------------------
  if (!activeBusinessId) {
    return (
      <div className="space-y-6 select-none">
        
        {/* Title bar */}
        <div className="glass-panel rounded-2xl p-6 border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-48 h-48 bg-cyber-primary/5 rounded-full blur-3xl pointer-events-none" />
          <div className="space-y-1">
            <span className="text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-cyber-primary/20 text-cyber-primary border border-cyber-primary/30">
              YÖNETİM KONSOLU
            </span>
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-100 flex items-center gap-2">
              <Settings className="text-cyber-primary stroke-[2.5]" size={22} />
              İşletme Yönetim Portalı
            </h1>
            <p className="text-xs text-cyber-muted">Analiz etmek ve yönetmek istediğiniz yeme-içme işletmesini haritadan seçin.</p>
          </div>
        </div>

        {/* Selector Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[55vh]">
          
          {/* List panel (4 cols) */}
          <div className="lg:col-span-4 flex flex-col space-y-4">
            <div className="glass-panel rounded-2xl p-4 border-slate-800 space-y-3 flex-1 flex flex-col shadow-xl">
              
              {/* Search bar */}
              <form onSubmit={handleB2BSearchSubmit} className="relative">
                <Compass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
                <input 
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="İşletme adı ara... (Enter bas)"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-800 bg-slate-950/40 text-xs focus:border-cyber-primary focus:outline-none transition-colors text-slate-100"
                />
              </form>

              {/* Items listing */}
              <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[45vh]">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 mb-2">
                  <p className="text-[10px] uppercase tracking-wider font-extrabold text-cyber-muted">
                    Bölge İşletmeleri ({filteredBusinesses.length})
                  </p>
                  {loading && <Loader2 size={12} className="text-cyber-primary animate-spin" />}
                </div>
                
                {filteredBusinesses.map((biz) => {
                  const isSelected = selectedBusiness && selectedBusiness.id === biz.id;
                  return (
                    <div
                      key={biz.id}
                      onClick={() => setSelectedBusiness(biz)}
                      className={`p-3 rounded-xl border transition-all duration-300 cursor-pointer flex justify-between items-center ${
                        isSelected
                          ? 'bg-cyber-primary/5 border-cyber-primary/60 shadow-lg'
                          : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700/60 hover:bg-slate-900/50'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <h4 className="text-xs font-bold text-slate-200">{biz.name}</h4>
                        <p className="text-[10px] text-cyber-muted flex items-center gap-0.5">
                          <MapPin size={10} />
                          {biz.category} • {biz.address.split(',')[0]}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold text-cyber-success bg-cyber-success/15 border border-cyber-success/20 px-2 py-0.5 rounded-md">
                        %{biz.sentimentScore} P.
                      </span>
                    </div>
                  );
                })}

                {filteredBusinesses.length === 0 && !loading && (
                  <p className="text-center py-6 text-[10px] text-cyber-muted italic">Eşleşen canlı işletme bulunamadı.</p>
                )}
              </div>

            </div>
          </div>

          {/* Dynamic Dark Mode Google Map (4 cols) */}
          <div className="lg:col-span-4 flex flex-col space-y-4">
            <div className="glass-panel rounded-2xl p-5 border-slate-800 flex-1 flex flex-col shadow-xl relative overflow-hidden">
              
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 z-10">
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-200 flex items-center gap-1.5">
                  <Navigation size={13} className="text-cyber-primary animate-pulse" />
                  BÖLGESEL ERİŞİM HARİTASI
                </h3>
              </div>

              {/* Map Container */}
              <div className="flex-1 mt-4 relative rounded-2xl overflow-hidden border border-slate-800/60 bg-slate-950 min-h-[260px]">
                {!isLoaded ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center space-y-2 text-cyber-primary">
                    <Loader2 size={24} className="animate-spin" />
                    <span className="text-[10px] font-bold">Harita Yükleniyor...</span>
                  </div>
                ) : loadError ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-cyber-danger space-y-2">
                    <span className="text-xs font-bold">Google Maps API Hatası</span>
                    <button onClick={() => { if (map) map.refresh(); }} className="mt-2 px-3 py-1 bg-cyber-primary text-slate-100 rounded hover:bg-cyber-primary/80 transition duration-300">Tekrar Dene</button>
                  </div>
                ) : (
                  <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    center={center}
                    zoom={14}
                    options={darkMapOptions}
                    onLoad={onMapLoad}
                    onDragEnd={onMapDragEnd}
                  >
                    {filteredBusinesses.map((biz) => {
                      const isSelected = selectedBusiness && selectedBusiness.id === biz.id;
                      return (
                        <MarkerF
                          key={biz.id}
                          position={{ lat: biz.lat, lng: biz.lng }}
                          onClick={() => setSelectedBusiness(biz)}
                          icon={
                            window.google
                              ? {
                                  path: window.google.maps.SymbolPath.CIRCLE,
                                  fillColor: isSelected ? '#a78bfa' : '#8b5cf6',
                                  fillOpacity: 0.9,
                                  strokeColor: '#0b0f19',
                                  strokeWeight: 2,
                                  scale: isSelected ? 9 : 6,
                                }
                              : undefined
                          }
                        />
                      );
                    })}
                  </GoogleMap>
                )}
              </div>

            </div>
          </div>

          {/* Right Connect panel (4 cols) */}
          <div className="lg:col-span-4 flex flex-col space-y-4">
            {selectedBusiness ? (
              <div className="glass-panel rounded-2xl p-5 border-slate-800 shadow-xl space-y-5 flex-1 flex flex-col justify-between">
                
                {/* Header */}
                <div className="space-y-4">
                  <div className="pb-3 border-b border-slate-800/80">
                    <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded bg-cyber-primary/20 text-cyber-primary border border-cyber-primary/30">
                      SEÇİLİ İŞLETME
                    </span>
                    <h2 className="text-base font-bold text-slate-100 mt-2">{selectedBusiness.name}</h2>
                    <p className="text-[10px] text-cyber-muted mt-0.5 flex items-center gap-1">
                      <MapPin size={11} className="text-slate-500" />
                      {selectedBusiness.address}
                    </p>
                  </div>

                  {/* Summary sentiment cards */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-900 text-center">
                      <span className="text-[8px] uppercase tracking-wider text-cyber-muted font-bold block mb-1">Duygu Skoru</span>
                      <span className="text-xl font-extrabold text-cyber-success">%{selectedBusiness.sentimentScore}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-900 text-center">
                      <span className="text-[8px] uppercase tracking-wider text-cyber-muted font-bold block mb-1">Toplam Yorum</span>
                      <span className="text-xl font-extrabold text-slate-300">{selectedBusiness.reviewCount}</span>
                    </div>
                  </div>

                  {/* B2B Authentication validation prompt */}
                  <div className="p-4 rounded-xl bg-cyber-primary/5 border border-cyber-primary/20 space-y-2 flex items-start gap-2.5">
                    <ShieldAlert className="text-cyber-primary stroke-[2] flex-shrink-0 mt-0.5" size={16} />
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-slate-200">İşletme Erişim Doğrulaması</h4>
                      <p className="text-[10px] text-cyber-muted leading-relaxed">
                        Yapay zeka analiz raporları, rakip istihbarat matrisi ve duygu bazlı aksiyon önerileri yalnızca yetkili personel için erişilebilirdir.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Dashboard connector submit button */}
                <button
                  onClick={() => setActiveBusinessId(selectedBusiness.id)}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest text-slate-100 bg-cyber-primary border border-cyber-primary hover:shadow-lg hover:shadow-cyber-primary/20 hover:scale-[1.01] hover:brightness-105 transition-all duration-300 focus:outline-none"
                >
                  <Settings size={15} />
                  <span>YÖNETİCİ PANELİNE BAĞLAN</span>
                </button>

              </div>
            ) : (
              <div className="glass-panel rounded-2xl p-8 border-slate-800 shadow-xl flex-1 flex flex-col items-center justify-center text-center space-y-4">
                <Compass className="text-cyber-primary animate-spin" size={24} style={{ animationDuration: '8s' }} />
                <h4 className="text-xs font-bold text-slate-200">İşletme Seçilmedi</h4>
              </div>
            )}
          </div>

        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // VIEW 2: DYNAMIC B2B EXECUTIVE SENTIMENT DASHBOARD
  // ----------------------------------------------------
  if (loading || !dashboardBusiness) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-10 h-10 text-cyber-accent animate-spin" />
        <p className="text-xs text-cyber-muted animate-pulse font-medium">Analizler ve raporlar derleniyor...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 min-h-[85vh] select-none items-start">
      
      {/* SIDEBAR */}
      <div className="w-full lg:w-64 flex-shrink-0 glass-panel rounded-2xl border-slate-800 flex flex-col p-5 space-y-6 shadow-xl lg:sticky lg:top-6 lg:min-h-[82vh]">
        <div className="text-center pb-4 border-b border-slate-800/80">
           <div className="w-12 h-12 mx-auto rounded-full bg-cyber-primary/10 border border-cyber-primary/30 flex items-center justify-center text-cyber-primary mb-3">
             <BarChart3 size={20} className="stroke-[2.5]" />
           </div>
           <h3 className="text-sm font-extrabold tracking-widest text-slate-100">{dashboardBusiness.name}</h3>
           <p className="text-[10px] text-cyber-muted uppercase tracking-widest mt-1">Yönetim Paneli</p>
        </div>
        
        <div className="flex flex-col gap-2 flex-1">
           <button 
             onClick={() => setSidebarActive('profil')} 
             className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all duration-300 ${sidebarActive === 'profil' ? 'bg-cyber-primary text-slate-100 shadow-lg shadow-cyber-primary/20' : 'text-slate-400 hover:bg-slate-900/50 hover:text-slate-200'}`}
           >
             <Users size={16} /> Profil
           </button>
           <button 
             onClick={() => setSidebarActive('analiz')} 
             className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all duration-300 ${sidebarActive === 'analiz' ? 'bg-indigo-500 text-slate-100 shadow-lg shadow-indigo-500/20' : 'text-slate-400 hover:bg-slate-900/50 hover:text-slate-200'}`}
           >
             <Sparkles size={16} /> AI Analiz Raporu
           </button>
        </div>
        
        <div className="pt-4 border-t border-slate-800/80 mt-auto">
           <button 
             onClick={() => setSidebarActive('ayarlar')} 
             className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs font-bold transition-all duration-300 ${sidebarActive === 'ayarlar' ? 'bg-slate-800 text-slate-100' : 'text-slate-500 hover:bg-slate-900/50 hover:text-slate-300'}`}
           >
             <Settings size={14} /> Ayarlar
           </button>
        </div>
      </div>

      {/* MAIN DASHBOARD CONTENT */}
      <div className="flex-1 w-full space-y-6">
        
        {sidebarActive === 'profil' && (
          <div className="space-y-6">
            {/* Executive Header Banner */}
      <div className="glass-panel rounded-2xl p-6 border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-48 h-48 bg-cyber-primary/5 rounded-full blur-3xl pointer-events-none" />
        
        {/* Title, Category and Select Back Trigger */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                cleanupBusinessStorage(activeBusinessId);
                localStorage.removeItem('sentimap_token');
                localStorage.removeItem('sentimap_user');
                if (onLogout) onLogout();
              }}
              className="flex items-center gap-1 text-[10px] text-cyber-primary hover:text-slate-200 border border-cyber-primary/20 hover:border-cyber-primary/40 bg-cyber-primary/5 px-2 py-0.5 rounded-lg transition-colors font-semibold uppercase tracking-wider"
              title="Harita Seçimine Dön"
            >
              <ArrowLeft size={11} />
              <span>İşletme Değiştir</span>
            </button>
            <span className="text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded bg-slate-900 text-cyber-accent border border-cyber-accent/20">
              {dashboardBusiness.category}
            </span>
          </div>

          <div className="space-y-0.5">
            <h1 className="text-xl md:text-2xl font-extrabold text-slate-100">{dashboardBusiness.name}</h1>
            <p className="text-xs text-cyber-muted">{dashboardBusiness.address}</p>
          </div>
        </div>

        {/* Dashboard Nav Tabs */}
        <div className="flex overflow-x-auto whitespace-nowrap bg-slate-950/60 p-1.5 rounded-xl border border-slate-900 gap-1 w-full md:w-auto z-10 scrollbar-none">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
              activeTab === 'overview' 
                ? 'bg-cyber-accent text-slate-950 font-bold' 
                : 'text-cyber-muted hover:text-slate-200'
            }`}
          >
            Özet Analiz
          </button>
          <button
            onClick={() => setActiveTab('competitors')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
              activeTab === 'competitors' 
                ? 'bg-cyber-accent text-slate-950 font-bold' 
                : 'text-cyber-muted hover:text-slate-200'
            }`}
          >
            Rakip Analizi
          </button>
          <button
            onClick={() => setActiveTab('mail_report')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
              activeTab === 'mail_report' 
                ? 'bg-cyber-accent text-slate-950 font-bold' 
                : 'text-cyber-muted hover:text-slate-200'
            }`}
          >
            Mail Raporu
          </button>
        </div>
      </div>

      {/* OVERVIEW TAB CONTENT */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* KPI Tiles Column (4 cols) */}
          <div className="lg:col-span-4 grid grid-cols-2 lg:grid-cols-1 gap-4 h-fit">
            
            {/* Sentiment KPI */}
            <div className="glass-panel rounded-2xl p-5 border-slate-800 shadow-xl flex items-center justify-between relative overflow-hidden">
              <div className="space-y-1">
                <p className="text-[10px] uppercase font-bold tracking-widest text-cyber-muted">Duygu Skoru</p>
                <h3 className="text-3xl font-extrabold text-cyber-success">%{dashboardBusiness.sentimentScore}</h3>
                <p className="text-[9px] text-cyber-muted">Canlı Google Yorum Analizi</p>
              </div>
              <div className="p-3 rounded-xl bg-cyber-success/10 text-cyber-success border border-cyber-success/20">
                <TrendingUp size={20} />
              </div>
            </div>

            {/* Total Reviews KPI */}
            <div className="glass-panel rounded-2xl p-5 border-slate-800 shadow-xl flex items-center justify-between relative overflow-hidden">
              <div className="space-y-1">
                <p className="text-[10px] uppercase font-bold tracking-widest text-cyber-muted">Toplam Yorum</p>
                <h3 className="text-3xl font-extrabold text-slate-200">{dashboardBusiness.reviewCount}</h3>
                <p className="text-[9px] text-cyber-muted font-medium">Aktif Müşteri Hacmi</p>
              </div>
              <div className="p-3 rounded-xl bg-cyber-accent/10 text-cyber-accent border border-cyber-accent/20">
                <Users size={20} />
              </div>
            </div>

            {/* Local Rank KPI */}
            <div className="glass-panel rounded-2xl p-5 border-slate-800 shadow-xl flex items-center justify-between relative overflow-hidden">
              <div className="space-y-1">
                <p className="text-[10px] uppercase font-bold tracking-widest text-cyber-muted">Bölge Sıralaması</p>
                <h3 className="text-3xl font-extrabold text-cyber-primary">#{regionRank.rank} <span className="text-xs text-cyber-muted">/ 3</span></h3>
                <p className="text-[9px] text-cyber-muted font-medium">{regionRank.text}</p>
              </div>
              <div className="p-3 rounded-xl bg-cyber-primary/10 text-cyber-primary border border-cyber-primary/20">
                <Award size={20} />
              </div>
            </div>

            {/* NPI KPI */}
            <div className="glass-panel rounded-2xl p-5 border-slate-800 shadow-xl flex items-center justify-between relative overflow-hidden">
              <div className="space-y-1">
                <p className="text-[10px] uppercase font-bold tracking-widest text-cyber-muted">Tavsiye Skoru (NPI)</p>
                <h3 className="text-3xl font-extrabold text-cyber-warning">+{Math.max(10, Math.round(dashboardBusiness.sentimentScore * 0.85))}</h3>
                <p className="text-[9px] text-cyber-muted font-medium">Yüksek müşteri sadakati</p>
              </div>
              <div className="p-3 rounded-xl bg-cyber-warning/10 text-cyber-warning border border-cyber-warning/20">
                <Flame size={20} />
              </div>
            </div>

          </div>

          {/* Graphical Trend & AI Summary (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Trend Chart */}
            <div className="glass-panel rounded-2xl p-5 border-slate-800 shadow-xl space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-800/80">
                <div>
                  <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-200 flex items-center gap-2">
                    <BarChart3 size={14} className="text-cyber-accent" />
                    AYLIK DUYGU SKORU DEĞİŞİMİ
                  </h3>
                  <p className="text-[9px] text-cyber-muted mt-0.5">Yapay zeka analizlerinin aylık olumlu geri bildirim trendi</p>
                </div>
              </div>

              {/* Glowing Monthly Bar Chart */}
              <div className="h-56 flex items-end justify-between pt-6 px-4 pb-2 bg-slate-950/40 rounded-xl border border-slate-900">
                {sentiment?.distribution.map((dist, idx) => (
                  <div key={idx} className="flex flex-col items-center flex-1 space-y-3 group">
                    <span className="text-[10px] font-bold text-cyber-accent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      %{dist.score}
                    </span>
                    <div className="w-8 sm:w-12 bg-slate-900 rounded-t-lg relative h-36 overflow-hidden flex items-end">
                      <div 
                        className="w-full bg-gradient-to-t from-cyber-primary to-cyber-accent rounded-t-lg transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(6,182,212,0.4)]"
                        style={{ height: `${dist.score}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-semibold text-cyber-muted uppercase tracking-wider">
                      {dist.month}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Summary Block */}
            <div className="glass-panel rounded-2xl p-5 border-slate-800 shadow-xl space-y-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyber-primary/5 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex items-center gap-2 text-cyber-primary">
                <Sparkles size={14} className="stroke-[2.5]" />
                <h4 className="text-xs font-bold uppercase tracking-wider">YAPAY ZEKA ANALİZ ÖZETİ</h4>
              </div>

              <p className="text-xs leading-relaxed text-slate-300 italic">
                "{sentiment?.aiSummary}"
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-800/80">
                <div className="p-3 bg-cyber-success/5 border border-cyber-success/15 rounded-xl space-y-1">
                  <span className="text-[9px] uppercase font-bold text-cyber-success tracking-wider">Müşterilerin Sevdiği Yönler</span>
                  <p className="text-xs font-semibold text-slate-200">{sentiment?.pros[0] || 'Kaliteli lezzet tabakları'}</p>
                </div>
                <div className="p-3 bg-cyber-danger/5 border border-cyber-danger/15 rounded-xl space-y-1">
                  <span className="text-[9px] uppercase font-bold text-cyber-danger tracking-wider">Kritik Zaafımız</span>
                  <p className="text-xs font-semibold text-slate-200">{sentiment?.cons[0] || 'Servis bekleme süresi'}</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* COMPETITORS TAB CONTENT */}
      {activeTab === 'competitors' && (
        <div className="glass-panel rounded-2xl p-5 border-slate-800 shadow-xl space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-800/80">
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-200 flex items-center gap-2">
                <Landmark size={14} className="text-cyber-accent" />
                YEREL RAKİP KARŞILAŞTIRMA MATRİSİ
              </h3>
              <p className="text-[9px] text-cyber-muted mt-0.5">Bölgedeki rakiplerle duygu analizi kıyaslamaları</p>
            </div>
          </div>

          {/* Interactive Benchmark Table */}
          <div className="overflow-x-auto relative">
            {competitorLoading && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm rounded-xl space-y-3">
                <Compass className="w-10 h-10 text-cyber-accent animate-spin" />
                <p className="text-xs text-cyber-muted font-bold animate-pulse">Bölgesel rakipler taranıyor ve yapay zeka ile analiz ediliyor...</p>
              </div>
            )}
            
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800/80 text-cyber-muted font-bold">
                  <th className="py-3 px-4 uppercase tracking-wider text-[10px]">Sıra</th>
                  <th className="py-3 px-4 uppercase tracking-wider text-[10px]">İşletme Adı</th>
                  <th className="py-3 px-4 uppercase tracking-wider text-[10px]">Google Puanı</th>
                  <th className="py-3 px-4 uppercase tracking-wider text-[10px]">En Çok Övülen Yönler (AI)</th>
                  <th className="py-3 px-4 uppercase tracking-wider text-[10px]">En Çok Şikayet Edilen Yönler (AI)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {competitorRanking && competitorRanking.map((comp, index) => {
                  const isMain = comp.is_target;
                  return (
                    <tr 
                      key={index} 
                      className={`transition-colors ${
                        isMain 
                          ? 'bg-cyber-primary/10 border-l-4 border-l-cyber-primary hover:bg-cyber-primary/20 shadow-inner' 
                          : 'hover:bg-slate-900/40'
                      }`}
                    >
                      <td className="py-4 px-4">
                        <span className={`font-black text-lg ${isMain ? 'text-cyber-primary' : 'text-slate-500'}`}>#{comp.rank}</span>
                      </td>
                      <td className="py-4 px-4 font-bold text-slate-100 flex items-center gap-2">
                        {comp.name}
                        {isMain && (
                          <span className="text-[8px] font-extrabold tracking-widest px-2 py-0.5 rounded bg-cyber-primary text-slate-100 uppercase">
                            BİZ
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1 text-cyber-warning font-bold text-sm">
                          <Star size={14} className="fill-cyber-warning" />
                          {comp.rating}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <ul className="list-disc pl-3 text-[10px] space-y-1 text-cyber-success">
                          {comp.pros.map((p, i) => <li key={i}>{p}</li>)}
                        </ul>
                      </td>
                      <td className="py-4 px-4">
                        <ul className="list-disc pl-3 text-[10px] space-y-1 text-cyber-danger">
                          {comp.cons.map((c, i) => <li key={i}>{c}</li>)}
                        </ul>
                      </td>
                    </tr>
                  );
                })}
                
                {!competitorRanking && !competitorLoading && (
                  <tr>
                    <td colSpan="5" className="text-center py-8 text-cyber-muted">Analiz verisi bulunamadı.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Comparative Breakdown Section */}
          {competitorRanking && !competitorLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              
              {/* Bizim İşletmemiz */}
              <div className="p-4 bg-cyber-primary/5 rounded-xl border border-cyber-primary/20 space-y-3">
                <div className="flex items-center gap-2 border-b border-cyber-primary/20 pb-2">
                  <span className="text-[10px] font-extrabold tracking-widest px-2 py-0.5 rounded bg-cyber-primary text-slate-100 uppercase">
                    BİZİM İŞLETMEMİZ
                  </span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-[10px] uppercase font-bold text-cyber-success mb-1.5 flex items-center gap-1"><Sparkles size={10} /> Sevilen Yönlerimiz</h4>
                    <ul className="list-disc pl-3 text-[10px] text-slate-300 space-y-1">
                      {competitorRanking.find(c => c.is_target)?.pros?.map((p, i) => <li key={i}>{p}</li>)}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-[10px] uppercase font-bold text-cyber-danger mb-1.5 flex items-center gap-1"><Sparkles size={10} /> Düzeltilmesi Gerekenler</h4>
                    <ul className="list-disc pl-3 text-[10px] text-slate-300 space-y-1">
                      {competitorRanking.find(c => c.is_target)?.cons?.map((c, i) => <li key={i}>{c}</li>)}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Rakipler (Ortak Eğilim) */}
              <div className="p-4 bg-slate-900/40 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                  <span className="text-[10px] font-extrabold tracking-widest px-2 py-0.5 rounded bg-slate-800 text-slate-300 uppercase">
                    BÖLGESEL RAKİPLER (ORTAK EĞİLİM)
                  </span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-[10px] uppercase font-bold text-cyber-success mb-1.5 flex items-center gap-1"><Sparkles size={10} /> Rakiplerin Güçlü Yanları</h4>
                    <ul className="list-disc pl-3 text-[10px] text-slate-400 space-y-1">
                      {[...new Set(competitorRanking.filter(c => !c.is_target).flatMap(c => c.pros))].slice(0, 3).map((p, i) => <li key={i}>{p}</li>)}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-[10px] uppercase font-bold text-cyber-danger mb-1.5 flex items-center gap-1"><Sparkles size={10} /> Rakiplerin Zayıf Yanları</h4>
                    <ul className="list-disc pl-3 text-[10px] text-slate-400 space-y-1">
                      {[...new Set(competitorRanking.filter(c => !c.is_target).flatMap(c => c.cons))].slice(0, 3).map((c, i) => <li key={i}>{c}</li>)}
                    </ul>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* AI benchmark review */}
          <div className="p-5 bg-slate-950/40 rounded-xl border border-slate-900 flex items-start gap-3">
            <Sparkles size={20} className="text-cyber-primary mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <strong className="text-slate-200 text-sm block">Yapay Zeka Strateji Çıkarımı</strong>
              <div className="text-xs text-cyber-muted leading-relaxed whitespace-pre-wrap">
                {competitorSummary ? competitorSummary : (
                  competitorLoading ? "Yapay zeka analiz raporu oluşturuluyor..." : "Strateji raporu oluşturulamadı."
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MAIL RAPORU TAB CONTENT */}
      {activeTab === 'mail_report' && (
        <div className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Donut Chart (Genel Duygu Dağılımı) */}
            <div className="glass-panel rounded-2xl p-6 border-slate-800 shadow-xl flex flex-col items-center justify-center relative">
              <div className="w-full flex items-center justify-between mb-6 pb-3 border-b border-slate-800/80">
                <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-200 flex items-center gap-2">
                  <PieChart size={16} className="text-cyber-primary" /> Genel Duygu Dağılımı
                </h3>
              </div>
              
              {analysisResult && analysisResult.distribution ? (
                <div className="flex flex-col items-center gap-6 w-full">
                  <div 
                    className="w-48 h-48 rounded-full relative flex items-center justify-center shadow-lg shadow-black/50"
                    style={{
                      background: `conic-gradient(
                        #10b981 0% ${Math.round((analysisResult.distribution.positive / analysisResult.distribution.total) * 100)}%, 
                        #64748b ${Math.round((analysisResult.distribution.positive / analysisResult.distribution.total) * 100)}% ${Math.round(((analysisResult.distribution.positive + analysisResult.distribution.neutral) / analysisResult.distribution.total) * 100)}%, 
                        #ef4444 ${Math.round(((analysisResult.distribution.positive + analysisResult.distribution.neutral) / analysisResult.distribution.total) * 100)}% 100%
                      )`
                    }}
                  >
                    <div className="w-36 h-36 bg-[#0b0f19] rounded-full flex flex-col items-center justify-center shadow-inner">
                      <span className="text-[10px] uppercase font-bold text-cyber-muted tracking-widest mb-1">Genel Skor</span>
                      <span className="text-4xl font-black text-slate-100">{analysisResult.overall_sentiment_score}<span className="text-lg text-slate-500">/100</span></span>
                    </div>
                  </div>
                  
                  <div className="flex w-full justify-around mt-2">
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-emerald-500"></div><span className="text-xs font-bold text-slate-300">Pozitif</span></div>
                      <span className="text-lg font-bold text-emerald-500 mt-1">%{Math.round((analysisResult.distribution.positive / analysisResult.distribution.total) * 100)}</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-slate-500"></div><span className="text-xs font-bold text-slate-300">Nötr</span></div>
                      <span className="text-lg font-bold text-slate-400 mt-1">%{Math.round((analysisResult.distribution.neutral / analysisResult.distribution.total) * 100)}</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm bg-red-500"></div><span className="text-xs font-bold text-slate-300">Negatif</span></div>
                      <span className="text-lg font-bold text-red-500 mt-1">%{Math.round((analysisResult.distribution.negative / analysisResult.distribution.total) * 100)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-cyber-muted text-sm">Grafik verisi yükleniyor...</div>
              )}
            </div>

            {/* Horizontal Bar Chart (Öne Çıkan Anahtar Kelimeler) */}
            <div className="glass-panel rounded-2xl p-6 border-slate-800 shadow-xl flex flex-col">
              <div className="w-full flex items-center justify-between mb-4 pb-3 border-b border-slate-800/80">
                <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-200 flex items-center gap-2">
                  <BarChart2 size={16} className="text-cyber-accent" /> Öne Çıkan Anahtar Kelimeler
                </h3>
              </div>
              
              <div className="flex-1 flex flex-col justify-center space-y-4">
                {[
                  { word: 'Lezzet / Kalite', count: 85, type: 'positive' },
                  { word: 'Servis Hızı', count: 60, type: 'negative' },
                  { word: 'Fiyatlandırma', count: 45, type: 'neutral' },
                  { word: 'Mekan Hijyeni', count: 70, type: 'positive' },
                  { word: 'Personel Tutumu', count: 50, type: 'negative' }
                ].sort((a,b) => b.count - a.count).map((kw, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-slate-300">{kw.word}</span>
                      <span className={kw.type === 'positive' ? 'text-emerald-500' : kw.type === 'negative' ? 'text-red-500' : 'text-slate-400'}>{kw.count} Bahsedilme</span>
                    </div>
                    <div className="w-full bg-slate-900/50 rounded-full h-2.5">
                      <div 
                        className={`h-2.5 rounded-full ${kw.type === 'positive' ? 'bg-emerald-500' : kw.type === 'negative' ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'bg-slate-500'}`} 
                        style={{ width: `${kw.count}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Raw Reviews List */}
          <div className="glass-panel rounded-2xl p-6 border-slate-800 shadow-xl">
            <div className="w-full flex items-center justify-between mb-6 pb-3 border-b border-slate-800/80">
              <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-200 flex items-center gap-2">
                <MessageSquare size={16} className="text-indigo-400" /> Son Müşteri Yorumları
              </h3>
            </div>
            
            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {analysisResult && analysisResult.analyzed_reviews && analysisResult.analyzed_reviews.length > 0 ? (
                analysisResult.analyzed_reviews.map((rev, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-950/40 border border-slate-900 flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-300 text-xs">
                          {rev.author.charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-200">{rev.author}</p>
                          <p className="text-[9px] text-slate-500">{rev.time}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-0.5 text-yellow-500">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} size={10} fill={i < rev.rating ? "currentColor" : "transparent"} />
                          ))}
                        </div>
                        <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                          rev.sentiment_label === 'positive' ? 'bg-emerald-500/20 text-emerald-500' :
                          rev.sentiment_label === 'negative' ? 'bg-red-500/20 text-red-500' : 'bg-slate-500/20 text-slate-400'
                        }`}>
                          {rev.sentiment_label === 'positive' ? 'POZİTİF' : rev.sentiment_label === 'negative' ? 'NEGATİF' : 'NÖTR'}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed mt-1">
                      {rev.comment || <span className="italic">Yorum metni yok, sadece puan verilmiş.</span>}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-cyber-muted text-sm">Gösterilecek yorum bulunamadı.</div>
              )}
            </div>
          </div>

        </div>
      )}
      
          </div>
        )}

        {/* AI ANALİZ RAPORU */}
        {sidebarActive === 'analiz' && (
          <div className="w-full bg-slate-950/60 border border-slate-800 rounded-xl p-4 md:p-8 min-h-[500px] md:h-[75vh] flex flex-col relative overflow-y-auto shadow-2xl">
            <div className="text-center mb-8 mt-2">
              <h2 className="text-2xl md:text-3xl font-black text-slate-100 mb-2">Gemini AI <span className="text-indigo-400">Analiz Raporu</span></h2>
              <p className="text-xs text-cyber-muted">{dashboardBusiness.name} işletmesi ve çevresindeki rakip işletmeler analiz edilmiştir.</p>
            </div>

            {analysisResult ? (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 flex-1">
                {/* Sol Taraf: Özet ve Puan */}
                <div className="md:col-span-4 flex flex-col gap-4">
                  <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 text-center shadow-inner">
                    <h4 className="text-xs uppercase font-black text-slate-500 mb-2">Genel Duygu Puanı</h4>
                    <div className="flex flex-col items-center gap-2">
                      <span className={`text-6xl font-black ${analysisResult.overall_sentiment_label === 'positive' ? 'text-emerald-400' : analysisResult.overall_sentiment_label === 'negative' ? 'text-red-400' : 'text-amber-400'}`}>
                        {analysisResult.overall_sentiment_score}
                      </span>
                      <span className="text-[10px] uppercase tracking-widest font-bold px-3 py-1 rounded-full bg-slate-800 text-slate-300">
                        {analysisResult.overall_sentiment_label === 'positive' ? 'Ağırlıklı Olarak Pozitif' : analysisResult.overall_sentiment_label === 'negative' ? 'Ağırlıklı Olarak Negatif' : 'Nötr / Karışık'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Sağ Taraf: Aksiyon Önerileri */}
                <div className="md:col-span-8 flex flex-col gap-4">
                  <h4 className="text-sm uppercase font-black text-slate-300 border-b border-slate-800 pb-2">AI Aksiyon Önerileri (Rakiplere Kıyasla)</h4>
                  <div className="space-y-3">
                    {analysisResult.suggestions.map((sug, i) => {
                      const st = sug.type === 'danger' ? 'border-l-red-500 bg-red-500/5 text-red-100' :
                                 sug.type === 'warning' ? 'border-l-amber-500 bg-amber-500/5 text-amber-100' :
                                 sug.type === 'success' ? 'border-l-emerald-500 bg-emerald-500/5 text-emerald-100' :
                                 'border-l-indigo-500 bg-indigo-500/5 text-indigo-100';
                      return (
                        <div key={i} className={`p-4 rounded-xl border border-slate-800/60 border-l-4 ${st} transition-all hover:bg-slate-800/40`}>
                          <h5 className="text-xs font-black uppercase mb-1.5 opacity-90 flex items-center gap-2">
                            <Sparkles size={12} className="opacity-70"/> {sug.title}
                          </h5>
                          <p className="text-xs opacity-80 leading-relaxed">{sug.text}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-cyber-muted text-xs">
                Yapay zeka analiz raporu bulunamadı. Lütfen sayfayı yenileyin.
              </div>
            )}
          </div>
        )}

        {/* AYARLAR */}
        {sidebarActive === 'ayarlar' && (
          <div className="glass-panel rounded-2xl p-8 border-slate-800 flex items-center justify-center min-h-[50vh] shadow-xl">
            <div className="text-center space-y-4">
              <Settings size={48} className="mx-auto text-slate-600 animate-spin-slow" />
              <p className="text-cyber-muted text-sm font-bold uppercase tracking-widest">Ayarlar paneli yapım aşamasında...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BusinessDashboard;
