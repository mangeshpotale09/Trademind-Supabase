
import React, { useState, useEffect } from 'react';
import { Trade, TradeStatus, TradeSide, User } from '../types';
import { calculatePnL, getRegisteredUsers } from '../services/storageService';

interface TradeListProps {
  trades: Trade[];
  onSelect: (trade: Trade) => void;
  isAdmin?: boolean;
}

const TradeList: React.FC<TradeListProps> = ({ trades, onSelect, isAdmin = false }) => {
  const [users, setUsers] = useState<User[]>([]);
  const sortedTrades = [...trades].sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());

  useEffect(() => {
    if (isAdmin) {
      getRegisteredUsers().then(setUsers);
    }
  }, [isAdmin]);

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? user.name : 'Unknown Subject';
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString([], { day: '2-digit', month: 'short' });
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-[#0a0f1d] rounded-3xl border border-[#1e293b] shadow-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-[#0e1421] text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-[#1e293b]">
              <th className="px-6 py-6">Symbol</th>
              <th className="px-6 py-6">Side</th>
              <th className="px-6 py-6">Status</th>
              <th className="px-6 py-6">Strategy</th>
              <th className="px-6 py-6">Mistakes</th>
              <th className="px-6 py-6">Entry Price</th>
              <th className="px-6 py-6">Entry Time</th>
              <th className="px-6 py-6">Exit Price</th>
              <th className="px-6 py-6">Exit Time</th>
              <th className="px-6 py-6">Net P&L</th>
              <th className="px-6 py-6 text-right">Coach</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e293b]">
            {sortedTrades.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-8 py-20 text-center text-slate-600 font-black uppercase tracking-widest italic opacity-40">
                  <div className="flex flex-col items-center gap-4">
                     <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                     <span>Journal is empty. No trades detected on current tape.</span>
                  </div>
                </td>
              </tr>
            ) : sortedTrades.map((trade) => {
              const pnl = calculatePnL(trade);
              return (
                <tr 
                  key={trade.id} 
                  onClick={() => onSelect(trade)}
                  className="hover:bg-[#111827] cursor-pointer transition-colors group"
                >
                  <td className="px-6 py-5">
                    <div className="font-black text-slate-200 group-hover:text-emerald-400 transition-colors text-base">{trade.symbol}</div>
                    {isAdmin && <div className="text-[9px] text-purple-400 font-black uppercase">{getUserName(trade.userId)}</div>}
                  </td>
                  <td className="px-6 py-5">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded border ${trade.side === TradeSide.LONG ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                      {trade.side}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${trade.status === TradeStatus.OPEN ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-[#1e293b] text-slate-500 border-white/5'}`}>
                      {trade.status}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-wrap gap-1 max-w-[150px]">
                      {trade.strategies.length > 0 ? trade.strategies.map(s => (
                        <span key={s} className="text-[8px] font-black text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/10 uppercase truncate max-w-full">
                          {s}
                        </span>
                      )) : <span className="text-slate-700 text-[10px]">--</span>}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-wrap gap-1 max-w-[150px]">
                      {trade.mistakes.length > 0 ? trade.mistakes.map(m => (
                        <span key={m} className="text-[8px] font-black text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded border border-red-400/10 uppercase truncate max-w-full">
                          {m}
                        </span>
                      )) : <span className="text-emerald-500/40 text-[8px] font-black uppercase">Disciplined</span>}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="text-sm font-mono font-black text-slate-300">₹{trade.entryPrice.toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="text-[10px] text-slate-400 font-bold font-mono tracking-tighter">
                      {formatDate(trade.entryDate)}
                    </div>
                    <div className="text-[9px] text-slate-600 font-bold font-mono tracking-tighter">
                      {formatTime(trade.entryDate)}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className={`text-sm font-mono font-black ${trade.exitPrice ? 'text-slate-400' : 'text-slate-700'}`}>
                      {trade.exitPrice ? `₹${trade.exitPrice.toLocaleString()}` : '--'}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    {trade.exitDate ? (
                      <>
                        <div className="text-[10px] text-slate-400 font-bold font-mono tracking-tighter">
                          {formatDate(trade.exitDate)}
                        </div>
                        <div className="text-[9px] text-slate-600 font-bold font-mono tracking-tighter">
                          {formatTime(trade.exitDate)}
                        </div>
                      </>
                    ) : (
                      <span className="text-slate-800 text-[10px] font-mono">--</span>
                    )}
                  </td>
                  <td className={`px-6 py-5 font-mono font-black text-base ${pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {trade.status === TradeStatus.CLOSED ? `${pnl >= 0 ? '+' : '-'}₹${Math.abs(pnl).toLocaleString()}` : '--'}
                  </td>
                  <td className="px-6 py-5 text-right">
                    {trade.aiReview ? (
                      <div className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                        <span className="text-[11px] font-black text-emerald-400">{trade.aiReview.score}</span>
                      </div>
                    ) : (
                      <span className="text-slate-800 text-[9px] font-black uppercase">--</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TradeList;
