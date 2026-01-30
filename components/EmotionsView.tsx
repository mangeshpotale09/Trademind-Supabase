
import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { Trade, TradeStatus, TradeSide } from '../types';
import { calculatePnL, calculateGrossPnL } from '../services/storageService';

interface EmotionsViewProps {
  trades: Trade[];
}

const EmotionsView: React.FC<EmotionsViewProps> = ({ trades }) => {
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const closedTrades = useMemo(() => trades.filter(t => t.status === TradeStatus.CLOSED), [trades]);

  const emotionStats = useMemo(() => {
    const map: Record<string, { name: string; pnl: number; count: number; wins: number }> = {};
    
    closedTrades.forEach(t => {
      const pnl = calculateGrossPnL(t);
      const ems = t.emotions.length > 0 ? t.emotions : ['Neutral'];
      
      ems.forEach(e => {
        if (!map[e]) map[e] = { name: e, pnl: 0, count: 0, wins: 0 };
        map[e].pnl += pnl;
        map[e].count++;
        if (pnl > 0) map[e].wins++;
      });
    });

    return Object.values(map).sort((a, b) => b.pnl - a.pnl);
  }, [closedTrades]);

  const filteredTrades = useMemo(() => {
    if (selectedFilters.length === 0) return [];
    return closedTrades.filter(t => {
      const ems = t.emotions.length > 0 ? t.emotions : ['Neutral'];
      return selectedFilters.some(filter => ems.includes(filter));
    }).sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime());
  }, [closedTrades, selectedFilters]);

  const toggleFilter = (emotion: string) => {
    setSelectedFilters(prev => 
      prev.includes(emotion) ? prev.filter(e => e !== emotion) : [...prev, emotion]
    );
  };

  const pieData = useMemo(() => {
    return emotionStats.map(d => ({ name: d.name, value: d.count }));
  }, [emotionStats]);

  const bestEmotion = useMemo(() => emotionStats[0], [emotionStats]);
  const worstEmotion = useMemo(() => emotionStats[emotionStats.length - 1], [emotionStats]);

  const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#f97316'];

  return (
    <div className="space-y-8 pb-20">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#0e1421] p-6 rounded-2xl border border-[#1e293b] shadow-xl flex items-center gap-6">
          <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-500 text-3xl shadow-inner">😊</div>
          <div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Most Profitable Mindset</span>
            <div className="text-2xl font-black text-slate-200">{bestEmotion?.name || 'N/A'}</div>
            <p className="text-emerald-500 text-sm font-black font-mono">₹{bestEmotion?.pnl.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-[#0e1421] p-6 rounded-2xl border border-[#1e293b] shadow-xl flex items-center gap-6">
          <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center text-red-500 text-3xl shadow-inner">😡</div>
          <div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Least Profitable Mindset</span>
            <div className="text-2xl font-black text-slate-200">{worstEmotion?.name || 'N/A'}</div>
            <p className="text-red-500 text-sm font-black font-mono">₹{worstEmotion?.pnl.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="bg-[#0e1421] p-6 rounded-2xl border border-[#1e293b] shadow-xl">
          <h3 className="text-lg font-black mb-6 text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
            Net P&L by Emotional State
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={emotionStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#070a13', borderColor: '#1e293b', color: '#f8fafc', borderRadius: '12px' }}
                  itemStyle={{ fontWeight: '900' }}
                  formatter={(value: any) => [`₹${value.toLocaleString()}`, 'P&L']}
                />
                <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                  {emotionStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#10b981' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="bg-[#0e1421] p-6 rounded-2xl border border-[#1e293b] shadow-xl flex flex-col items-center">
          <h3 className="text-lg font-black mb-6 text-white w-full text-left">Mindset Frequency</h3>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                   contentStyle={{ backgroundColor: '#070a13', borderColor: '#1e293b', color: '#f8fafc', borderRadius: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-3 mt-4">
            {pieData.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{entry.name}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Interactive Emotion Filter Section */}
      <section className="bg-[#0e1421] p-8 rounded-3xl border border-[#1e293b] shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h3 className="text-xl font-black text-white flex items-center gap-3">
              <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg>
              Drill-down by Emotion
            </h3>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-tight mt-1">Select mindset tags to isolate corresponding executions</p>
          </div>
          {selectedFilters.length > 0 && (
            <button 
              onClick={() => setSelectedFilters([])}
              className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors flex items-center gap-2"
            >
              Clear Selection ({selectedFilters.length})
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {emotionStats.map((stat, idx) => (
            <button
              key={stat.name}
              onClick={() => toggleFilter(stat.name)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                selectedFilters.includes(stat.name)
                  ? 'bg-blue-500 border-blue-400 text-slate-900 shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                  : 'bg-[#0a0f1d] border-[#1e293b] text-slate-500 hover:border-slate-400'
              }`}
            >
              {stat.name}
            </button>
          ))}
        </div>

        {selectedFilters.length > 0 ? (
          <div className="overflow-x-auto bg-[#0a0f1d] rounded-2xl border border-[#1e293b]">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#0e1421] border-b border-[#1e293b] text-slate-500 text-[9px] font-black uppercase tracking-widest">
                  <th className="px-6 py-4">Symbol</th>
                  <th className="px-6 py-4">Execution Date</th>
                  <th className="px-6 py-4">P&L</th>
                  <th className="px-6 py-4">Notes Snippet</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e293b]">
                {filteredTrades.map(trade => {
                  const pnl = calculatePnL(trade);
                  return (
                    <tr key={trade.id} className="hover:bg-[#111827] transition-colors group">
                      <td className="px-6 py-4">
                        <div className="font-black text-white group-hover:text-blue-400 transition-colors">{trade.symbol}</div>
                        <div className="text-[10px] font-bold text-slate-600 uppercase tracking-tighter">{trade.side}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-slate-400 font-medium">{new Date(trade.entryDate).toLocaleDateString()}</div>
                        <div className="text-[10px] text-slate-600 font-black uppercase tracking-tighter">{new Date(trade.entryDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      </td>
                      <td className={`px-6 py-4 font-mono font-black text-sm ${pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {pnl >= 0 ? '+' : ''}₹{pnl.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-[10px] text-slate-500 italic line-clamp-1 max-w-xs">
                          {trade.notes || "No notes attached..."}
                        </p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-[#1e293b] rounded-2xl bg-[#0a0f1d]/30 text-slate-600">
            <svg className="w-12 h-12 mb-4 opacity-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
            <p className="font-black uppercase text-[10px] tracking-widest">Select an emotion above to explore specific trades</p>
          </div>
        )}
      </section>

      {/* Summary Table Per Emotion */}
      <section className="bg-[#0e1421] p-6 rounded-2xl border border-[#1e293b] shadow-xl">
        <h3 className="text-lg font-black mb-6 text-white uppercase tracking-tighter">Mindset Performance Matrix</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-[#1e293b]">
                <th className="pb-4 px-2">Mindset Tag</th>
                <th className="pb-4 px-2">Sample Size</th>
                <th className="pb-4 px-2">Win Prob.</th>
                <th className="pb-4 px-2 text-right">Cumulative P&L</th>
                <th className="pb-4 px-2 text-right">Unit Efficiency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b]">
              {emotionStats.map(d => (
                <tr key={d.name} className="hover:bg-[#111827] transition-colors group">
                  <td className="py-4 px-2 font-black text-slate-300 group-hover:text-blue-400 transition-colors uppercase text-xs tracking-tight">{d.name}</td>
                  <td className="py-4 px-2 text-slate-500 font-bold">{d.count} Executions</td>
                  <td className="py-4 px-2">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1 bg-[#1e293b] rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500" style={{ width: `${(d.wins / d.count) * 100}%` }}></div>
                      </div>
                      <span className="text-[10px] font-black text-slate-400">{((d.wins / d.count) * 100).toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className={`py-4 px-2 text-right font-mono font-black ${d.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    ₹{d.pnl.toLocaleString()}
                  </td>
                  <td className={`py-4 px-2 text-right font-mono text-[10px] font-bold ${d.pnl / d.count >= 0 ? 'text-emerald-500/60' : 'text-red-500/60'}`}>
                    ₹{(d.pnl / d.count).toLocaleString(undefined, { maximumFractionDigits: 0 })}/trade
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default EmotionsView;
