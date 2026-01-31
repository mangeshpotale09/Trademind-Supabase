
import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import StudioView from './components/StudioView';
import AdminView from './components/AdminView';
import AuthView from './components/AuthView';
import PaymentView from './components/PaymentView';
import UserVerificationStatus from './components/UserVerificationStatus';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'journal' | 'analysis' | 'mistakes' | 'emotions' | 'ai' | 'studio' | 'admin'>('dashboard');
  const [isEntryFormOpen, setIsEntryFormOpen] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [showPaymentFlow, setShowPaymentFlow] = useState(false);

  const syncIdentity = useCallback(async (session: any) => {
    const user = await getCurrentUser(session);
    setCurrentUser(user);
    setIsInitializing(false);
  }, []);

  useEffect(() => {
    let authSubscription: any;

    const init = async () => {
      const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session) {
          syncIdentity(session);
        } else {
          setCurrentUser(null);
          setTrades([]);
          setIsInitializing(false);
        }
      });
      authSubscription = data.subscription;

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        syncIdentity(session);
      } else {
        setIsInitializing(false);
      }
    };

    init();

    return () => {
      if (authSubscription) authSubscription.unsubscribe();
    };
  }, [syncIdentity]);

  // Derived Access State
  const isAccessExpired = useMemo(() => {
    if (!currentUser || currentUser.role === UserRole.ADMIN) return false;
    if (!currentUser.expiryDate) return false;
    return new Date() > new Date(currentUser.expiryDate);
  }, [currentUser]);

  const isUserApproved = useMemo(() => {
    if (!currentUser) return false;
    if (currentUser.role === UserRole.ADMIN) return true;
    return currentUser.status === UserStatus.APPROVED && !isAccessExpired;
  }, [currentUser, isAccessExpired]);

  // Load Trades for authorized users
  useEffect(() => {
    const load = async () => {
      if (currentUser?.id && isUserApproved) {
        setIsLoading(true);
        try {
          const data = await getStoredTrades(currentUser.id);
          setTrades(data);
        } catch (err) {
          console.error("Data fetch error", err);
        } finally {
          setIsLoading(false);
        }
      }
    };
    load();
  }, [currentUser?.id, isUserApproved]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('tm_cached_profile');
    setCurrentUser(null);
    setShowPaymentFlow(false);
  };

  const handleExecuteTradeClick = () => {
    if (currentUser?.role === UserRole.ADMIN) {
      setIsEntryFormOpen(true);
      return;
    }

    if (!isUserApproved) {
      setShowPaymentFlow(true);
    } else {
      setIsEntryFormOpen(true);
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-[#070a13] flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Syncing Terminal...</p>
      </div>
    );
  }

  // Gated State: No Login
  if (!currentUser) {
    return <AuthView onAuthComplete={setCurrentUser} />;
  }

  // Gated State: WAITING_APPROVAL or REJECTED
  if (currentUser.role === UserRole.USER && (currentUser.status === UserStatus.WAITING_APPROVAL || currentUser.status === UserStatus.REJECTED)) {
    return (
      <UserVerificationStatus 
        user={currentUser} 
        onLogout={handleLogout} 
        onRetry={async () => {
          await supabase.from('profiles').update({ status: UserStatus.PENDING }).eq('id', currentUser.id);
          localStorage.removeItem('tm_cached_profile');
          const updated = await getCurrentUser();
          setCurrentUser(updated);
        }} 
      />
    );
  }

  // Gated State: Payment Flow (triggered by Execute Trade, Banner, or Expiry)
  if (showPaymentFlow || isAccessExpired) {
    return (
      <div className="animate-in fade-in duration-500 bg-[#070a13] min-h-screen">
        <nav className="p-6 border-b border-[#1e293b] flex justify-between items-center bg-[#0e1421] sticky top-0 z-[100]">
          <div>
            <h2 className="text-xl font-black text-white">{isAccessExpired ? 'Access Expired' : 'Payment Subscription'}</h2>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">
              {isAccessExpired ? 'Your plan has expired. Renew to continue logging.' : 'Verification Required for Node Access'}
            </p>
          </div>
          <button onClick={() => setShowPaymentFlow(false)} className="bg-white/5 p-3 rounded-full text-slate-500 hover:text-white transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </nav>
        <PaymentView 
          user={currentUser} 
          onPaymentSubmitted={async () => {
            setIsLoading(true);
            const updated = await getCurrentUser(); 
            setCurrentUser(updated);
            setShowPaymentFlow(false);
            setIsLoading(false);
          }} 
        />
      </div>
    );
  }

  const navigationItems = [
    { id: 'dashboard', label: 'Dash', color: 'bg-emerald-500' },
    { id: 'journal', label: 'Log', color: 'bg-cyan-500' },
    { id: 'analysis', label: 'Edge', color: 'bg-violet-500' },
    { id: 'mistakes', label: 'Leak', color: 'bg-rose-500' },
    { id: 'emotions', label: 'Mind', color: 'bg-amber-500' },
    { id: 'ai', label: 'Coach', color: 'bg-blue-500' },
    { id: 'studio', label: 'Studio', color: 'bg-fuchsia-500' }
  ];

  if (currentUser.role === UserRole.ADMIN) {
    navigationItems.push({ id: 'admin', label: 'Admin', color: 'bg-purple-600' });
  }

  return (
    <div className="min-h-screen bg-[#070a13] text-slate-200 font-sans selection:bg-emerald-500/30">
      {isLoading && (
        <div className="fixed top-0 left-0 w-full h-0.5 bg-emerald-500/20 z-[200] overflow-hidden">
          <div className="h-full bg-emerald-500 animate-[loading_1.5s_infinite]"></div>
        </div>
      )}

      {/* Navigation */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#0e1421]/90 backdrop-blur-xl border border-[#1e293b] p-1.5 rounded-3xl shadow-2xl flex items-center gap-1.5 max-w-[96vw] overflow-x-auto no-scrollbar">
        {navigationItems.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center justify-center px-5 py-3 rounded-2xl transition-all relative whitespace-nowrap ${
              activeTab === tab.id 
                ? `${tab.color} text-slate-900 shadow-lg font-black scale-105` 
                : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <span className="text-[10px] uppercase tracking-wider">{tab.label}</span>
          </button>
        ))}
      </nav>

      <main className="max-w-7xl mx-auto px-4 md:px-8 pt-10 pb-32">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div className="animate-in fade-in slide-in-from-left duration-700">
            <div className="flex items-center gap-3 mb-2">
               <span className="bg-emerald-500/10 text-emerald-400 text-[9px] font-black px-2 py-0.5 rounded border border-emerald-500/20 uppercase tracking-[0.2em]">{currentUser.displayId}</span>
               <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${isLoading ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Node Active</span>
               </div>
            </div>
            <h1 className="text-4xl font-black text-white tracking-tighter">
              TradeMind <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-500">AI</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-3">
            <button onClick={handleLogout} className="px-5 py-3 rounded-xl bg-white/5 text-slate-500 hover:text-red-400 transition-all text-[9px] font-black uppercase tracking-widest border border-white/5">Exit</button>
            <button onClick={handleExecuteTradeClick} className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black px-8 py-3 rounded-xl transition-all shadow-xl shadow-emerald-500/10 text-[10px] uppercase tracking-widest">Execute Trade</button>
          </div>
        </header>

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
          {!isUserApproved && currentUser.role !== UserRole.ADMIN && (
            <div className="mb-10 p-8 bg-amber-500/10 border border-amber-500/20 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-amber-500/10">🔑</div>
                <div>
                  <h4 className="text-white font-black text-sm uppercase tracking-widest">
                    {isAccessExpired ? 'Plan Expired' : 'Authorized Access Required'}
                  </h4>
                  <p className="text-slate-400 text-xs mt-1">
                    {isAccessExpired ? 'Your access has expired. Please renew your subscription to continue.' : 'Verification of payment is mandatory before accessing live trade logging and AI audit features.'}
                  </p>
                </div>
              </div>
              <button onClick={() => setShowPaymentFlow(true)} className="w-full md:w-auto bg-amber-500 text-slate-900 px-10 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-amber-500/10 hover:scale-105 transition-all">
                {isAccessExpired ? 'Renew Access' : 'Enable Full Access'}
              </button>
            </div>
          )}

          {activeTab === 'dashboard' && <Dashboard trades={trades} />}
          {activeTab === 'journal' && <TradeList trades={trades} onSelect={setSelectedTrade} isAdmin={currentUser.role === UserRole.ADMIN} />}
          {activeTab === 'analysis' && <AnalysisView trades={trades} />}
          {activeTab === 'mistakes' && <MistakesView trades={trades} />}
          {activeTab === 'emotions' && <EmotionsView trades={trades} />}
          {activeTab === 'ai' && <AIInsightsView trades={trades} />}
          {activeTab === 'studio' && <StudioView />}
          {activeTab === 'admin' && currentUser.role === UserRole.ADMIN && <AdminView />}
        </div>
      </main>

      {/* Entry Form Modal */}
      {isEntryFormOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
          <TradeEntryForm 
            userId={currentUser.id}
            onAdd={async (t) => {
              setIsLoading(true);
              try {
                await saveTrade(t);
                setTrades(prev => [t, ...prev]);
                setIsEntryFormOpen(false);
              } catch (e: any) { 
                console.error("Save Error:", e);
                alert(`Save failed: ${e.message || "Unknown error"}`); 
              }
              finally { setIsLoading(false); }
            }}
            onCancel={() => setIsEntryFormOpen(false)}
            initialTrade={editingTrade || undefined}
          />
        </div>
      )}

      {/* Trade Detail Modal */}
      {selectedTrade && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-5xl">
            <TradeDetail 
              trade={selectedTrade}
              onClose={() => setSelectedTrade(null)}
              onUpdate={async (t) => {
                setIsLoading(true);
                try {
                  await saveTrade(t);
                  setTrades(prev => prev.map(old => old.id === t.id ? t : old));
                  setSelectedTrade(t);
                } catch (e: any) { 
                  console.error("Update Error:", e);
                  alert(`Update failed: ${e.message || "Unknown error"}`); 
                }
                finally { setIsLoading(false); }
              }}
              onDelete={async (id) => {
                setIsLoading(true);
                try {
                  await deleteTradeFromDB(id);
                  setTrades(prev => prev.filter(t => t.id !== id));
                  setSelectedTrade(null);
                } catch (e: any) { 
                  console.error("Delete Error:", e);
                  alert(`Delete failed: ${e.message || "Unknown error"}`); 
                }
                finally { setIsLoading(false); }
              }}
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
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};

export default App;
