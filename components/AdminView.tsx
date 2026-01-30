
import React, { useMemo, useState, useEffect } from 'react';
import { getRegisteredUsers, getStoredTrades, updateUserStatus, getTransactions, getAdminOverviewStats } from '../services/storageService';
import { User, UserStatus, Trade, Transaction } from '../types';

type AdminTab = 'overview' | 'users' | 'tape' | 'ledger';

const AdminView: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<AdminTab>('overview');
  const [users, setUsers] = useState<User[]>([]);
  const [allTrades, setAllTrades] = useState<Trade[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [overviewStats, setOverviewStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProof, setSelectedProof] = useState<User | null>(null);

  useEffect(() => {
    loadTabContent(activeSubTab);
  }, [activeSubTab]);

  const loadTabContent = async (tab: AdminTab) => {
    setIsLoading(true);
    try {
      if (tab === 'overview') {
        const stats = await getAdminOverviewStats();
        setOverviewStats(stats);
      } else if (tab === 'users') {
        const fetchedUsers = await getRegisteredUsers();
        setUsers(fetchedUsers);
      } else if (tab === 'tape') {
        const fetchedTrades = await getStoredTrades();
        setAllTrades(fetchedTrades);
      } else if (tab === 'ledger') {
        const fetchedTxs = await getTransactions();
        setTransactions(fetchedTxs);
      }
    } catch (error) {
      console.error("Admin tab load error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.displayId.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [users, searchQuery]);

  const handleStatusChange = async (userId: string, status: UserStatus) => {
    setIsLoading(true);
    try {
      await updateUserStatus(userId, status);
      await loadTabContent(activeSubTab);
      setSelectedProof(null);
    } catch (err) {
      alert("Status update failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Command', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
    { id: 'users', label: 'Registry', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
    { id: 'tape', label: 'Global Tape', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { id: 'ledger', label: 'Settlement', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' }
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-24">
      <div className="flex flex-col md:flex-row justify-between items-end gap-6">
        <div className="flex bg-[#0e1421] p-1.5 rounded-[1.8rem] border border-purple-500/20 shadow-2xl shadow-purple-500/5 max-w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as AdminTab)}
              className={`flex items-center gap-3 px-6 py-3 rounded-2xl transition-all whitespace-nowrap ${
                activeSubTab === tab.id 
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' 
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={tab.icon}></path></svg>
              <span className="text-[10px] font-black uppercase tracking-[0.15em]">{tab.label}</span>
            </button>
          ))}
        </div>
        
        <button 
          onClick={() => loadTabContent(activeSubTab)}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-white transition-all text-[9px] font-black uppercase tracking-widest"
        >
          <svg className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
          Re-Sync Tab
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-10 h-10 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest animate-pulse">Syncing Database Segment...</p>
        </div>
      ) : (
        <>
          {activeSubTab === 'overview' && overviewStats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <AdminStatCard label="Authorized Nodes" value={overviewStats.totalUsers} icon="🛰️" color="text-blue-400" />
              <AdminStatCard label="System Tape Volume" value={overviewStats.totalTrades} icon="📼" color="text-amber-400" />
              <AdminStatCard label="Transactions Recorded" value={overviewStats.totalTransactions} icon="💰" color="text-emerald-400" />
              <AdminStatCard label="Approval Queue" value={overviewStats.pendingApprovals} icon="⚖️" color="text-orange-400" />
              
              {overviewStats.pendingApprovals > 0 && (
                <div className="col-span-full bg-orange-500/10 border border-orange-500/20 p-8 rounded-3xl flex items-center justify-between animate-pulse">
                  <div className="flex items-center gap-6">
                    <span className="text-4xl">⚠️</span>
                    <div>
                      <h4 className="text-white font-black text-lg">Identity Verifications Pending</h4>
                      <p className="text-orange-400 text-[10px] font-black uppercase tracking-widest">{overviewStats.pendingApprovals} Subject(s) waiting for manual proof audit.</p>
                    </div>
                  </div>
                  <button onClick={() => setActiveSubTab('users')} className="bg-orange-500 hover:bg-orange-400 text-slate-900 px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg">Open Registry</button>
                </div>
              )}
            </div>
          )}

          {activeSubTab === 'users' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                  <input 
                    type="text" 
                    placeholder="Search Registry..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#0e1421] border border-[#1e293b] rounded-2xl pl-12 pr-6 py-4 focus:ring-2 focus:ring-purple-500 outline-none text-white text-sm"
                  />
                </div>
              </div>

              <div className="bg-[#0e1421] border border-[#1e293b] rounded-[2.5rem] overflow-hidden shadow-2xl">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-[#0a0f1d] text-slate-500 text-[9px] font-black uppercase tracking-[0.2em] border-b border-[#1e293b]">
                      <th className="px-8 py-6">ID</th>
                      <th className="px-8 py-6">Identity</th>
                      <th className="px-8 py-6">Plan Requested</th>
                      <th className="px-8 py-6">Status</th>
                      <th className="px-8 py-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e293b]">
                    {filteredUsers.length === 0 ? (
                      <tr><td colSpan={5} className="px-8 py-12 text-center text-slate-600 font-black uppercase text-[10px] tracking-widest">No matching subjects found</td></tr>
                    ) : filteredUsers.map(user => (
                      <tr key={user.id} className="hover:bg-[#111827] transition-all group">
                        <td className="px-8 py-6 font-mono text-[10px] text-purple-400">{user.displayId}</td>
                        <td className="px-8 py-6">
                          <div className="font-bold text-white text-sm">{user.name}</div>
                          <div className="text-[10px] text-slate-500">{user.email}</div>
                        </td>
                        <td className="px-8 py-6">
                          <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{user.selectedPlan || 'NONE'}</span>
                        </td>
                        <td className="px-8 py-6">
                          <div className={`flex items-center gap-2 text-[9px] font-black uppercase tracking-widest ${
                            user.status === UserStatus.APPROVED ? 'text-emerald-500' : 
                            user.status === UserStatus.WAITING_APPROVAL ? 'text-orange-500' : 'text-slate-500'
                          }`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${
                              user.status === UserStatus.APPROVED ? 'bg-emerald-500' : 
                              user.status === UserStatus.WAITING_APPROVAL ? 'bg-orange-500 animate-pulse' : 'bg-slate-700'
                            }`}></div>
                            {user.status}
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                          {user.status === UserStatus.WAITING_APPROVAL ? (
                            <button 
                              onClick={() => setSelectedProof(user)}
                              className="bg-orange-500 text-slate-900 px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-transform"
                            >
                              Review Proof
                            </button>
                          ) : (
                            <div className="flex justify-end gap-2">
                              {user.status !== UserStatus.APPROVED && (
                                <button onClick={() => handleStatusChange(user.id, UserStatus.APPROVED)} className="px-4 py-2 bg-emerald-500 text-slate-900 rounded-xl text-[8px] font-black uppercase tracking-widest">Approve</button>
                              )}
                              {user.status === UserStatus.APPROVED && (
                                <button onClick={() => handleStatusChange(user.id, UserStatus.PENDING)} className="px-4 py-2 bg-red-500/10 text-red-500 rounded-xl text-[8px] font-black uppercase tracking-widest">Revoke</button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeSubTab === 'tape' && (
            <div className="space-y-6">
              <div className="bg-[#0e1421] border border-[#1e293b] rounded-[2.5rem] overflow-hidden shadow-2xl">
                 <div className="p-8 border-b border-[#1e293b] bg-[#0a0f1d]/50">
                   <h3 className="text-white font-black text-sm uppercase tracking-widest">Recent Global Executions</h3>
                 </div>
                 <table className="w-full text-left">
                  <thead>
                    <tr className="bg-[#0a0f1d] text-slate-500 text-[9px] font-black uppercase tracking-widest border-b border-[#1e293b]">
                      <th className="px-8 py-4">Symbol</th>
                      <th className="px-8 py-4">Trader ID</th>
                      <th className="px-8 py-4">Side</th>
                      <th className="px-8 py-4">Entry</th>
                      <th className="px-8 py-4">Exit</th>
                      <th className="px-8 py-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e293b]">
                    {allTrades.length === 0 ? (
                      <tr><td colSpan={6} className="px-8 py-12 text-center text-slate-600 font-black uppercase text-[10px] tracking-widest">System tape is currently empty</td></tr>
                    ) : allTrades.map(trade => (
                      <tr key={trade.id} className="hover:bg-[#111827] transition-all">
                        <td className="px-8 py-4 font-black text-white text-sm">{trade.symbol}</td>
                        <td className="px-8 py-4 font-mono text-[9px] text-purple-400">{trade.userId.substring(0, 8)}</td>
                        <td className="px-8 py-4 text-[10px] font-black uppercase tracking-widest">{trade.side}</td>
                        <td className="px-8 py-4 text-[10px] font-mono text-slate-400">₹{trade.entryPrice.toLocaleString()}</td>
                        <td className="px-8 py-4 text-[10px] font-mono text-slate-400">{trade.exitPrice ? `₹${trade.exitPrice.toLocaleString()}` : '--'}</td>
                        <td className="px-8 py-4 text-right">
                           <span className={`text-[8px] font-black px-2 py-0.5 rounded ${trade.status === 'CLOSED' ? 'bg-slate-800 text-slate-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                             {trade.status}
                           </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                 </table>
              </div>
            </div>
          )}

          {activeSubTab === 'ledger' && (
            <div className="space-y-6">
              <div className="bg-[#0e1421] border border-[#1e293b] rounded-[2.5rem] overflow-hidden shadow-2xl">
                 <div className="p-8 border-b border-[#1e293b] bg-[#0a0f1d]/50">
                   <h3 className="text-white font-black text-sm uppercase tracking-widest">Financial Ledger</h3>
                 </div>
                 <table className="w-full text-left">
                  <thead>
                    <tr className="bg-[#0a0f1d] text-slate-500 text-[9px] font-black uppercase tracking-widest border-b border-[#1e293b]">
                      <th className="px-8 py-4">Timestamp</th>
                      <th className="px-8 py-4">User</th>
                      <th className="px-8 py-4">Plan</th>
                      <th className="px-8 py-4">Amount</th>
                      <th className="px-8 py-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e293b]">
                    {transactions.length === 0 ? (
                      <tr><td colSpan={5} className="px-8 py-12 text-center text-slate-600 font-black uppercase text-[10px] tracking-widest">No settlement history found</td></tr>
                    ) : transactions.map(tx => (
                      <tr key={tx.id} className="hover:bg-[#111827] transition-all">
                        <td className="px-8 py-4 text-[10px] text-slate-500">{new Date(tx.timestamp).toLocaleString()}</td>
                        <td className="px-8 py-4 font-bold text-white text-xs">{tx.userName}</td>
                        <td className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{tx.plan}</td>
                        <td className="px-8 py-4 text-[11px] font-black text-emerald-400">₹{tx.amount.toLocaleString()}</td>
                        <td className="px-8 py-4 text-right">
                           <span className={`text-[9px] font-black px-2 py-0.5 rounded ${tx.status === 'SUCCESS' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                             {tx.status}
                           </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                 </table>
              </div>
            </div>
          )}
        </>
      )}

      {selectedProof && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
          <div className="w-full max-w-2xl bg-[#0e1421] rounded-[3rem] border border-[#1e293b] overflow-hidden shadow-2xl animate-in zoom-in duration-300">
            <div className="p-8 border-b border-[#1e293b] flex justify-between items-center bg-[#0a0f1d]/50">
              <div>
                <h3 className="text-xl font-black text-white">Proof Audit</h3>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{selectedProof.name} ({selectedProof.selectedPlan})</p>
              </div>
              <button onClick={() => setSelectedProof(null)} className="text-slate-500 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            
            <div className="p-8 space-y-8">
               <div className="aspect-video bg-[#070a13] rounded-2xl border border-[#1e293b] overflow-hidden">
                 {selectedProof.paymentScreenshot ? (
                   <img src={selectedProof.paymentScreenshot} alt="Payment Proof" className="w-full h-full object-contain" />
                 ) : (
                   <div className="h-full flex items-center justify-center text-slate-700 font-black uppercase text-[10px]">No attachment found</div>
                 )}
               </div>

               <div className="flex gap-4">
                 <button 
                  onClick={() => handleStatusChange(selectedProof.id, UserStatus.APPROVED)}
                  className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black py-4 rounded-2xl text-xs uppercase tracking-widest transition-all shadow-xl shadow-emerald-500/10"
                 >
                   Confirm & Authorize
                 </button>
                 <button 
                  onClick={() => handleStatusChange(selectedProof.id, UserStatus.REJECTED)}
                  className="flex-1 bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white font-black py-4 rounded-2xl text-xs uppercase tracking-widest transition-all"
                 >
                   Decline Access
                 </button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const AdminStatCard = ({ label, value, icon, color }: any) => (
  <div className="bg-[#0e1421] p-8 rounded-[2.5rem] border border-[#1e293b] shadow-xl flex flex-col justify-center min-h-[160px] relative overflow-hidden group hover:border-purple-500/30 transition-all">
    <div className="absolute -right-2 -bottom-2 text-6xl opacity-[0.03] group-hover:opacity-[0.07] transition-all transform group-hover:scale-110">{icon}</div>
    <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-3">{label}</span>
    <div className={`text-3xl font-black font-mono tracking-tighter ${color}`}>{value}</div>
  </div>
);

export default AdminView;
