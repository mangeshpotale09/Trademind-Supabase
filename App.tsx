
import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react';
import { Trade, User, UserRole, UserStatus } from './types';
import { 
  getStoredTrades, 
  saveTrade,
  deleteTradeFromDB,
  getCurrentUser
} from './services/storageService';
import { supabase } from './services/supabaseClient';

// Critical UI Components
import AuthView from './components/AuthView';
import TradeList from './components/TradeList';
import TradeDetail from './components/TradeDetail';
import TradeEntryForm from './components/TradeEntryForm';
import PaymentView from './components/PaymentView';
import UserVerificationStatus from './components/UserVerificationStatus';

// Lazy Components
const Dashboard = lazy(() => import('./components/Dashboard'));
const AnalysisView = lazy(() => import('./components/AnalysisView'));
const MistakesView = lazy(() => import('./components/MistakesView'));
const EmotionsView = lazy(() => import('./components/EmotionsView'));
const AIInsightsView = lazy(() => import('./components/AIInsightsView'));
const AdminView = lazy(() => import('./components/AdminView'));

const ViewLoader = () => (
  <div className="w-full py-20 flex flex-col items-center justify-center gap-4 animate-in fade-in duration-500">
    <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Synchronizing Node...</p>
  </div>
);

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'journal' | 'analysis' | 'mistakes' | 'emotions' | 'ai' | 'admin'>('dashboard');
  const [isEntryFormOpen, setIsEntryFormOpen] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);

  const syncIdentity = useCallback(async (session: any) => {
    // Return early if we already have the user to save cycles
    if (currentUser && currentUser.id === session?.user?.id) return;
    
    const user = await getCurrentUser(session);
    setCurrentUser(user);
    setIsInitializing(false);
  }, [currentUser]);

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
    return () => { if (authSubscription) authSubscription.unsubscribe(); };
  }, [syncIdentity]);

  useEffect(() => {
    if (currentUser?.id && (currentUser.status === UserStatus.APPROVED || currentUser.role === UserRole.ADMIN)) {
      setIsLoading(true);
      getStoredTrades(currentUser.id)
        .then(setTrades)
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [currentUser?.id, currentUser?.status, currentUser?.role]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('tm_cached_profile');
    setCurrentUser(null);
  };

  if (isInitializing) return null; // Let the splash screen handle this

  if (!currentUser) return <AuthView onAuthComplete={setCurrentUser} />;

  if (currentUser.role === UserRole.USER && currentUser.status === UserStatus.PENDING) {
    return <PaymentView user={currentUser} onPaymentSubmitted={async () => {
      setIsLoading(true);
      setCurrentUser(await getCurrentUser());
      setIsLoading(false);
    }} />;
  }

  if (currentUser.role === UserRole.USER && (currentUser.status === UserStatus.WAITING_APPROVAL || currentUser.status === UserStatus.REJECTED)) {
    return <UserVerificationStatus user={currentUser} onLogout={handleLogout} onRetry={async () => {
      await supabase.from('profiles').update({ status: UserStatus.PENDING }).eq('id', currentUser.id);
      localStorage.removeItem('tm_cached_profile');
      setCurrentUser(await getCurrentUser());
    }} />;
  }

  const navs = [
    { id: 'dashboard', label: 'Dash', color: 'bg-emerald-500' },
    { id: 'journal', label: 'Log', color: 'bg-cyan-500' },
    { id: 'analysis', label: 'Edge', color: 'bg-violet-500' },
    { id: 'mistakes', label: 'Leak', color: 'bg-rose-500' },
    { id: 'emotions', label: 'Mind', color: 'bg-amber-500' },
    { id: 'ai', label: 'Coach', color: 'bg-blue-500' }
  ];

  if (currentUser.role === UserRole.ADMIN) navs.push({ id: 'admin', label: 'Admin', color: 'bg-purple-600' });

  return (
    <div className="min-h-screen bg-[#070a13] text-slate-200 font-sans selection:bg-emerald-500/30">
      {isLoading && (
        <div className="fixed top-0 left-0 w-full h-0.5 bg-emerald-500/10 z-[200] overflow-hidden">
          <div className="h-full bg-emerald-500 animate-[loading_1s_infinite]"></div>
        </div>
      )}

      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#0e1421]/90 backdrop-blur-xl border border-[#1e293b] p-1.5 rounded-3xl shadow-2xl flex items-center gap-1.5 max-w-[96vw] overflow-x-auto no-scrollbar">
        {navs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-5 py-3 rounded-2xl transition-all whitespace-nowrap ${activeTab === tab.id ? `${tab.color} text-slate-900 shadow-lg font-black scale-105` : 'text-slate-500 hover:text-slate-200 hover:bg-white/5'}`}>
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
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Node: Verified</span>
               </div>
            </div>
            <h1 className="text-4xl font-black text-white tracking-tighter">TradeMind <span className="text-emerald-500">AI</span></h1>
          </div>
          
          <div className="flex items-center gap-3">
            <button onClick={handleLogout} className="px-5 py-3 rounded-xl bg-white/5 text-slate-500 hover:text-red-400 text-[9px] font-black uppercase tracking-widest">Exit</button>
            <button onClick={() => { setEditingTrade(null); setIsEntryFormOpen(true); }} className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black px-8 py-3 rounded-xl shadow-xl text-[10px] uppercase tracking-widest">Execute Trade</button>
          </div>
        </header>

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <Suspense fallback={<ViewLoader />}>
            {activeTab === 'dashboard' && <Dashboard trades={trades} />}
            {activeTab === 'journal' && <TradeList trades={trades} onSelect={setSelectedTrade} isAdmin={currentUser.role === UserRole.ADMIN} />}
            {activeTab === 'analysis' && <AnalysisView trades={trades} />}
            {activeTab === 'mistakes' && <MistakesView trades={trades} />}
            {activeTab === 'emotions' && <EmotionsView trades={trades} />}
            {activeTab === 'ai' && <AIInsightsView trades={trades} />}
            {activeTab === 'admin' && currentUser.role === UserRole.ADMIN && <AdminView />}
          </Suspense>
        </div>
      </main>

      {isEntryFormOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
          <TradeEntryForm 
            userId={currentUser.id}
            onAdd={async (t) => {
              setIsLoading(true);
              try {
                await saveTrade(t);
                setTrades(prev => editingTrade ? prev.map(i => i.id === t.id ? t : i) : [t, ...prev]);
                setIsEntryFormOpen(false);
              } catch (e: any) { alert(`Commit Failed: ${e.message}`); } finally { setIsLoading(false); }
            }}
            onCancel={() => setIsEntryFormOpen(false)}
            initialTrade={editingTrade || undefined}
          />
        </div>
      )}

      {selectedTrade && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
          <TradeDetail 
            trade={selectedTrade}
            onClose={() => setSelectedTrade(null)}
            onUpdate={async (t) => {
              setIsLoading(true);
              try {
                await saveTrade(t);
                setTrades(prev => prev.map(o => o.id === t.id ? t : o));
                setSelectedTrade(t);
              } catch (e: any) { alert(`Sync Error: ${e.message}`); } finally { setIsLoading(false); }
            }}
            onDelete={async (id) => {
              setIsLoading(true);
              try {
                await deleteTradeFromDB(id);
                setTrades(prev => prev.filter(t => t.id !== id));
                setSelectedTrade(null);
              } catch (e: any) { alert(`Purge Error: ${e.message}`); } finally { setIsLoading(false); }
            }}
            onEdit={(t) => { setEditingTrade(t); setIsEntryFormOpen(true); }}
            isAdmin={currentUser.role === UserRole.ADMIN}
            currentUserId={currentUser.id}
          />
        </div>
      )}

      <style>{`
        @keyframes loading { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
      `}</style>
    </div>
  );
};

export default App;
