import React, { useState, useEffect } from 'react';
import { useJsApiLoader } from '@react-google-maps/api';
import { api } from './services/api';
import { AuthView } from './views/AuthView';
import { CustomerMapView } from './views/CustomerMapView';
import { BusinessDashboard } from './views/BusinessDashboard';
import { Sparkles, MapPin, BarChart3, LogOut, ArrowLeftRight, Compass } from 'lucide-react';

export const App = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [activePortal, setActivePortal] = useState(''); // 'customer' or 'business'
  const [loading, setLoading] = useState(true);

  const apiKey = import.meta.env.VITE_MAPS_API_KEY || '';
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
    libraries: ['places'],
    language: 'tr'
  });

  // Sync session on mount
  useEffect(() => {
    const user = api.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      setActivePortal(user.role);
    }
    setLoading(false);
  }, []);

  // Handle Auth success
  const handleAuthSuccess = (user) => {
    setCurrentUser(user);
    setActivePortal(user.role);
  };

  // Handle Logout
  const handleLogout = async () => {
    await api.logout();
    setCurrentUser(null);
    setActivePortal('');
  };

  // Demo bypass: Toggle between portals seamlessly (Hackathon feature!)
  const handleDemoPortalToggle = () => {
    const nextPortal = activePortal === 'customer' ? 'business' : 'customer';
    setActivePortal(nextPortal);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cyber-bg flex items-center justify-center">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 border-t-2 border-r-2 border-cyber-accent rounded-full animate-spin" />
          <Compass className="absolute text-cyber-accent animate-pulse" size={24} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cyber-bg text-cyber-text relative flex flex-col font-sans overflow-x-hidden">
      
      {/* Dynamic Top Grid Glows */}
      <div className="absolute top-0 left-0 md:left-1/4 w-full md:w-[500px] h-[150px] bg-cyber-primary/5 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="absolute top-0 right-0 md:right-1/4 w-full md:w-[500px] h-[150px] bg-cyber-accent/5 rounded-full blur-3xl pointer-events-none z-0" />

      {/* Premium Header */}
      <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-900 shadow-md">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyber-primary to-cyber-accent flex items-center justify-center text-slate-950 font-black shadow-[0_0_12px_rgba(6,182,212,0.4)]">
              S
            </div>
            <span className="font-extrabold text-sm md:text-base tracking-widest text-slate-100">
              SENTI<span className="text-gradient-cyan-violet">MAP</span>
            </span>
          </div>

          {/* User Status and Demo Toggle Deck */}
          {currentUser && (
            <div className="flex items-center gap-3 md:gap-5">
              {/* Demo Portal Switcher (Extremely powerful for hackathon jury evaluation!) */}
              <button
                onClick={handleDemoPortalToggle}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-cyber-accent/30 bg-cyber-accent/5 hover:bg-cyber-accent/15 text-cyber-accent text-[10px] md:text-xs font-bold transition-all duration-300 shadow-lg shadow-cyber-accent/5"
                title="Görünüm Değiştir (Jüri Hızlı Test Düğmesi)"
              >
                <ArrowLeftRight size={13} />
                <span className="hidden sm:inline">Portalı Değiştir:</span>
                <span className="capitalize">{activePortal === 'customer' ? 'İşletme (B2B)' : 'Müşteri (B2C)'}</span>
              </button>

              {/* User details */}
              <div className="hidden md:flex flex-col text-right">
                <span className="text-xs font-bold text-slate-200">{currentUser.name}</span>
                <span className="text-[9px] text-cyber-muted font-semibold uppercase tracking-wider">
                  {currentUser.role === 'business' ? 'İşletme Yetkilisi' : 'Tüketici / Müşteri'}
                </span>
              </div>

              {/* Logout button */}
              <button
                onClick={handleLogout}
                className="p-2 rounded-xl border border-slate-800/80 bg-slate-950 hover:bg-cyber-danger/10 hover:border-cyber-danger/30 text-slate-400 hover:text-cyber-danger transition-all duration-300 focus:outline-none"
                title="Güvenli Çıkış"
              >
                <LogOut size={14} />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full relative z-10 flex flex-col">
        {!currentUser ? (
          <AuthView onAuthSuccess={handleAuthSuccess} isLoaded={isLoaded} />
        ) : activePortal === 'business' ? (
          <BusinessDashboard currentUser={currentUser} isLoaded={isLoaded} onLogout={handleLogout} />
        ) : (
          <CustomerMapView isLoaded={isLoaded} />
        )}
      </main>

      {/* Premium Footer */}
      <footer className="w-full py-4 border-t border-slate-900/60 bg-slate-950/20 text-center relative z-10">
        <p className="text-[10px] text-cyber-muted uppercase tracking-widest font-semibold flex items-center justify-center gap-1.5">
          <Sparkles size={11} className="text-cyber-accent animate-pulse" />
          Sentimap Hackathon © 2026 • React + Flask Monolitik Arayüzü
        </p>
      </footer>

    </div>
  );
};

export default App;
