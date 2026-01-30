
import React, { useState, useEffect } from 'react';
import { Trade, User, UserRole, UserStatus } from './types';
import { 
  getStoredTrades, 
  saveTrade,
  deleteTradeFromDB,
  getCurrentUser
} from './services/storageService';
import { supabase } from './services/supabaseClient';

import Dashboard from './components/Dashboard';
import TradeList from './components/TradeList';
import TradeEntryForm from './components/TradeEntryForm';
import TradeDetail from './components/TradeDetail';
import AnalysisView from './components/AnalysisView';
import MistakesView from './components/MistakesView';
import EmotionsView from './components/EmotionsView';
import AIInsightsView from './components/AIInsightsView';
import AdminView from './components/AdminView';
import AuthView from './components/AuthView';
import PaymentView from './components/PaymentView';
import UserVerificationStatus from './components/UserVerificationStatus';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isSyncingProfile, setIsSyncingProfile] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'journal' | 'analysis' | 'mistakes' | 'emotions' | 'ai' | 'admin'>('dashboard');
  const [isEntryFormOpen, setIsEntryFormOpen] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);

  useEffect(() => {
    // 1. Setup Auth Listener immediately (fastest way to get state)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Once we have a definitive answer (session or null), we stop the full-screen loader
      setIsInitializing(false);

      if (session) {
        setIsSyncingProfile(true);
        try {
          const user = await getCurrentUser(session);
          setCurrentUser(user);
        } catch (err) {
          console.error("Profile sync failure:", err);
        } finally {
          setIsSyncingProfile(false);
        }
      } else {
        setCurrentUser(null);
        setTrades([]);
      }
    });

    // 2. Backup: Check session once in case listener is slow
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && isInitializing) {
        setIsInitializing(false);
      }
    });

    // 3. Safety release: Don't let user wait more than 2 seconds for the loader
    const timeout = setTimeout(() => setIsInitializing(false), 2000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  // Load Trades when user is approved
  useEffect(() => {
    if (currentUser?.id && currentUser.status === UserStatus.APPROVED) {
      loadTrades();
    }
  }, [currentUser?.id, currentUser?.status]);

  const loadTrades = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      const tradesToLoad = await getStoredTrades(currentUser.id);
      setTrades(tradesToLoad);
    } catch (err) {
      console.error("Sync error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    if (window.confirm("Exit terminal session?")) {
      await supabase.auth.signOut();
    }
  };

  const handleAddTrade = async (trade: Trade) => {
    setIsLoading(true);
    try {
      await saveTrade(trade);
      setTrades(prev => {
        const index = prev.findIndex(t => t.id === trade.id);
        if (index !== -1) {
          const newTrades = [...prev];
          newTrades[index] = trade;
          return newTrades;
        }
        return [trade, ...prev];
      });
      setIsEntryFormOpen(false);
      setEditingTrade(null);
    } catch (err) {
      alert("Database error.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateTrade = async (updatedTrade: Trade) => {
    setIsLoading(true);
    try {
      await saveTrade(updatedTrade);
      setTrades(prev => prev.map(t => t.id === updatedTrade.id ? updatedTrade : t));
      if (selectedTrade?.id === updatedTrade.id) setSelectedTrade(updatedTrade);
    } catch (err) {
      alert("Update failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTrade = async (id: string) => {
    setIsLoading(true);
    try {
      await deleteTradeFromDB(id);
      setTrades(prev => prev.filter(t => t.id !== id));
      setSelectedTrade(null);
    } catch (err) {
      alert("Delete failed.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-[#070a13] flex flex-col items-center justify-center p-6 text-center">
        <div className="relative">
          <div className="w-12 h-12 border-2 border-emerald-500/10 rounded-full animate-ping absolute inset-0"></div>
          <div className="w-12 h-12 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <div className="mt-8 space-y-1">
          <h2 className="text-white font-black text-[9px] uppercase tracking-[0.4em]">Establishing Uplink</h2>
          <p className="text-slate-600 text-[8px] font-bold uppercase tracking-widest animate-pulse">Syncing Secure Node...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) return <AuthView onAuthComplete={setCurrentUser} />;

  // Blocking logic for Unapproved Users
  if (currentUser.role !== UserRole.ADMIN) {
    if (currentUser.status === UserStatus.PENDING) {
      return <PaymentView user={currentUser} onPaymentSubmitted={async () => {
        setIsSyncingProfile(true);
        const updatedUser = await getCurrentUser();
        setCurrentUser(updatedUser);
        setIsSyncingProfile(false);
      }} />;
    }
    
    if (currentUser.status === UserStatus.WAITING_APPROVAL || currentUser.status === UserStatus.REJECTED) {
      return <UserVerificationStatus 
        user={currentUser} 
        onLogout={() => supabase.auth.signOut()} 
        onRetry={async () => {
           const { error } = await supabase.from('profiles').update({ status: UserStatus.PENDING }).eq('id', currentUser.id);
           if (!error) {
             const user = await getCurrentUser();
             setCurrentUser(user);
           }
        }} 
      />;
    }
  }

  const navigationItems = [
    { id: 'dashboard', label: 'Dash', color: 'bg-emerald-500' },
    { id: 'journal', label: 'Log', color: 'bg-cyan-500' },
    { id: 'analysis', label: 'Edge', color: 'bg-violet-500' },
    { id: 'mistakes', label: 'Leak', color: 'bg-rose-500' },
    { id: 'emotions', label: 'Mind', color: 'bg-amber-500' },
    { id: 'ai', label: 'Coach', color: 'bg-blue-500' }
  ];

  if (currentUser.role === UserRole.ADMIN) {
    navigationItems.push({ id: 'admin', label: 'Admin', color: 'bg-purple-600' });
  }

  return (
    <div className="min-h-screen bg-[#070a13] text-slate-200 font-sans">
      {isSyncingProfile && (
        <div className="fixed top-0 left-0 w-full h-0.5 bg-emerald-500/20 z-[200] overflow-hidden">
          <div className="h-full bg-emerald-500 animate-[loading_1s_infinite]"></div>
        </div>
      )}

      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#0e1421]/90 backdrop-blur-xl border border-[#1e293b] p-1 rounded-3xl shadow-2xl flex items-center gap-1 max-w-[96vw] overflow-x-auto no-scrollbar">
        {navigationItems.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center justify-center px-5 py-3 rounded-2xl transition-all relative whitespace-nowrap ${
              activeTab === tab.id 
                ? `${tab.color} text-slate-900 shadow-lg font-black` 
                : 'text-slate-500 hover:text-slate-200'
            }`}
          >
            <span className="text-[10px] uppercase tracking-wider">{tab.label}</span>
          </button>
        ))}
      </nav>

      <main className="max-w-7xl mx-auto px-4 md:px-6 pt-10 pb-32">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="animate-in fade-in slide-in-from-left duration-500">
            <div className="flex items-center gap-3 mb-1">
               <span className="bg-emerald-500/10 text-emerald-400 text-[9px] font-black px-2 py-0.5 rounded border border-emerald-500/20 uppercase tracking-widest">{currentUser.displayId}</span>
               <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${isLoading || isSyncingProfile ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">
                    {isLoading || isSyncingProfile ? 'Syncing Node' : 'Terminal Active'}
                  </span>
               </div>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tighter">
              TradeMind <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-500">AI</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={handleLogout}
              className="px-4 py-2 rounded-xl bg-white/5 text-slate-500 hover:text-red-400 transition-all text-[9px] font-black uppercase tracking-widest"
            >
              Exit
            </button>
            <button 
              onClick={() => setIsEntryFormOpen(true)}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black px-6 py-3 rounded-xl transition-all shadow-xl shadow-emerald-500/10 text-[10px] uppercase tracking-widest"
            >
              Log Execution
            </button>
          </div>
        </header>

        {activeTab === 'dashboard' && <Dashboard trades={trades} />}
        {activeTab === 'journal' && <TradeList trades={trades} onSelect={setSelectedTrade} isAdmin={currentUser.role === UserRole.ADMIN} />}
        {activeTab === 'analysis' && <AnalysisView trades={trades} />}
        {activeTab === 'mistakes' && <MistakesView trades={trades} />}
        {activeTab === 'emotions' && <EmotionsView trades={trades} />}
        {activeTab === 'ai' && <AIInsightsView trades={trades} />}
        {activeTab === 'admin' && currentUser.role === UserRole.ADMIN && <AdminView />}
      </main>

      {isEntryFormOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <TradeEntryForm 
            userId={currentUser.id}
            onAdd={handleAddTrade}
            onCancel={() => { setIsEntryFormOpen(false); setEditingTrade(null); }}
            initialTrade={editingTrade || undefined}
          />
        </div>
      )}

      {selectedTrade && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-5xl">
            <TradeDetail 
              trade={selectedTrade}
              onClose={() => setSelectedTrade(null)}
              onUpdate={handleUpdateTrade}
              onDelete={handleDeleteTrade}
              onEdit={(t) => { setEditingTrade(t); setIsEntryFormOpen(true); }}
              isAdmin={currentUser.role === UserRole.ADMIN}
              currentUserId={currentUser.id}
            />
          </div>
        </div>
      )}

      <style>{`
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default App;
