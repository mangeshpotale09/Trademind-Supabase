
import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Trade, TradeStatus } from '../types';
import { calculateGrossPnL } from '../services/storageService';

interface AnalysisViewProps {
  trades: Trade[];
}

const AnalysisView: React.FC<AnalysisViewProps> = ({ trades }) => {
  const [viewDate, setViewDate] = useState(new Date());

  const closedTrades = useMemo(() => trades.filter(t => t.status === TradeStatus.CLOSED), [trades]);

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const hourlyData = useMemo(() => {
    const hours = [9, 10, 11, 12, 13, 14, 15]; // Trading hours 9 AM to 3 PM
    const map: Record<number, { hourLabel: string; pnl: number; count: number }> = {};
    
    hours.forEach(h => {
      const label = h === 12 ? '12 PM' : h > 12 ? `${h - 12} PM` : `${h} AM`;
      map[h] = { hourLabel: label, pnl: 0, count: 0 };
    });

    closedTrades.forEach(t => {
      const entryHour = new Date(t.entryDate).getHours();
      if (map[entryHour]) {
        map[entryHour].pnl += calculateGrossPnL(t);
        map[entryHour].count++;
      }
    });

    return Object.values(map);
  }, [closedTrades]);

  const dailyData = useMemo(() => {
    const dayIndices = [1, 2, 3, 4, 5]; // Mon (1) to Fri (5)
    const dayLabels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const map: Record<number, { dayLabel: string; pnl: number; count: number }> = {};
    
    dayIndices.forEach((d, idx) => {
      map[d] = { dayLabel: dayLabels[idx], pnl: 0, count: 0 };
    });

    closedTrades.forEach(t => {
      const day = new Date(t.entryDate).getDay();
      if (map[day]) {
        map[day].pnl += calculateGrossPnL(t);
        map[day].count++;
      }
    });

    return Object.values(map);
  }, [closedTrades]);

  const bestHour = useMemo(() => {
    return [...hourlyData].sort((a, b) => b.pnl - a.pnl)[0];
  }, [hourlyData]);

  const worstHour = useMemo(() => {
    return [...hourlyData].sort((a, b) => a.pnl - b.pnl)[0];
  }, [hourlyData]);

  const bestDay = useMemo(() => {
    return [...dailyData].sort((a, b) => b.pnl - a.pnl)[0];
  }, [dailyData]);

  const worstDay = useMemo(() => {
    return [...dailyData].sort((a, b) => a.pnl - b.pnl)[0];
  }, [dailyData]);

  const weeklyBreakdown = useMemo(() => {
    const weeks: Record<string, { week: string; win: number; loss: number; grossProfit: number; count: number }> = {};
    
    closedTrades.forEach(t => {
      const exitDate = new Date(t.exitDate!);
      const firstDayOfYear = new Date(exitDate.getFullYear(), 0, 1);
      const pastDaysOfYear = (exitDate.getTime() - firstDayOfYear.getTime()) / 86400000;
      const weekNum = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
      const weekKey = `${exitDate.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
      
      if (!weeks[weekKey]) {
        weeks[weekKey] = { week: weekKey, win: 0, loss: 0, grossProfit: 0, count: 0 };
      }
      
      const pnl = calculateGrossPnL(t);
      weeks[weekKey].count++;
      weeks[weekKey].grossProfit += pnl;
      if (pnl > 0) weeks[weekKey].win++;
      else if (pnl < 0) weeks[weekKey].loss++;
    });

    return Object.values(weeks).sort((a, b) => b.week.localeCompare(a.week)).slice(0, 12);
  }, [closedTrades]);

  const strategyData = useMemo(() => {
    const strategies: Record<string, { name: string; pnl: number; win: number; count: number }> = {};
    closedTrades.forEach(t => {
      t.strategies.forEach(s => {
        if (!strategies[s]) strategies[s] = { name: s, pnl: 0, win: 0, count: 0 };
        const pnl = calculateGrossPnL(t);
        strategies[s].pnl += pnl;
        strategies[s].count++;
        if (pnl > 0) strategies[s].win++;
      });
    });
    return Object.values(strategies).sort((a, b) => b.pnl - a.pnl);
  }, [closedTrades]);

  const symbolData = useMemo(() => {
    const symbols: Record<string, { name: string; pnl: number; count: number }> = {};
    closedTrades.forEach(t => {
      if (!symbols[t.symbol]) symbols[t.symbol] = { name: t.symbol, pnl: 0, count: 0 };
      symbols[t.symbol].pnl += calculateGrossPnL(t);
      symbols[t.symbol].count++;
    });
    return Object.values(symbols).sort((a, b) => b.pnl - a.pnl).slice(0, 10);
  }, [closedTrades]);

  const calendarData = useMemo(() => {
    const map: Record<string, { pnl: number; count: number }> = {};
    closedTrades.forEach(t => {
      const date = new Date(t.exitDate!).toISOString().split('T')[0];
      if (!map[date]) map[date] = { pnl: 0, count: 0 };
      map[date].pnl += calculateGrossPnL(t);
      map[date].count++;
    });
    return map;
  }, [closedTrades]);

  return (
    <div className="space-y-8 pb-20">
      {/* Best Time to Trade Section */}
      <section className="bg-[#0e1421] p-6 md:p-8 rounded-[2rem] border border-[#1e293b] shadow-2xl overflow-hidden relative">
        <div className="flex items-center gap-3 mb-6">
           <div className="bg-emerald-500/10 p-2 rounded-xl text-emerald-500">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
           </div>
           <h3 className="text-xl md:text-2xl font-black text-white tracking-tight">Best Time to Trade</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-[#111827] p-5 rounded-2xl border border-emerald-500/10 flex flex-col gap-1 transition-all hover:border-emerald-500/30">
            <span className="text-slate-500 text-[9px] font-black uppercase tracking-[0.2em]">Best Hour</span>
            <div className="text-2xl font-black text-emerald-400 tracking-tight">{bestHour?.hourLabel || '--'}</div>
            <div className="flex items-center gap-2 text-slate-500 text-[10px] font-mono">
              <span className="font-bold">₹{bestHour?.pnl.toLocaleString() || '0'}</span>
              <span className="w-1 h-1 rounded-full bg-slate-700"></span>
              <span>{bestHour?.count || 0} trades</span>
            </div>
          </div>
          <div className="bg-[#111827] p-5 rounded-2xl border border-red-500/10 flex flex-col gap-1 transition-all hover:border-red-500/30">
            <span className="text-slate-500 text-[9px] font-black uppercase tracking-[0.2em]">Worst Hour</span>
            <div className="text-2xl font-black text-red-400 tracking-tight">{worstHour?.hourLabel || '--'}</div>
            <div className="flex items-center gap-2 text-slate-500 text-[10px] font-mono">
              <span className="font-bold">₹{worstHour?.pnl.toLocaleString() || '0'}</span>
              <span className="w-1 h-1 rounded-full bg-slate-700"></span>
              <span>{worstHour?.count || 0} trades</span>
            </div>
          </div>
        </div>

        <div className="h-[300px] w-full pr-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hourlyData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={true} horizontal={true} />
              <XAxis 
                dataKey="hourLabel" 
                stroke="#64748b" 
                fontSize={10} 
                fontFamily="Inter, sans-serif"
                fontWeight={700}
                axisLine={true} 
                tickLine={true}
                dy={5}
              />
              <YAxis 
                stroke="#64748b" 
                fontSize={9} 
                axisLine={true} 
                tickLine={true}
                tickFormatter={(val) => `₹${val}`} 
              />
              <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                contentStyle={{ backgroundColor: '#070a13', borderColor: '#1e293b', borderRadius: '12px', color: '#f8fafc' }}
                itemStyle={{ fontWeight: '900', fontSize: '11px' }}
                formatter={(value: any) => [`₹${value.toLocaleString()}`, 'Session P&L']}
              />
              <Bar dataKey="pnl" radius={[6, 6, 0, 0]} barSize={32}>
                {hourlyData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#10b981' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Daily Performance Edge Section */}
      <section className="bg-[#0e1421] p-6 md:p-8 rounded-[2rem] border border-[#1e293b] shadow-2xl overflow-hidden relative">
        <div className="flex items-center gap-3 mb-6">
           <div className="bg-blue-500/10 p-2 rounded-xl text-blue-500">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
           </div>
           <h3 className="text-xl md:text-2xl font-black text-white tracking-tight">Daily Performance Edge</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-[#111827] p-5 rounded-2xl border border-emerald-500/10 flex flex-col gap-1 transition-all hover:border-emerald-500/30">
            <span className="text-slate-500 text-[9px] font-black uppercase tracking-[0.2em]">Most Profitable Day</span>
            <div className="text-2xl font-black text-emerald-400 tracking-tight">{bestDay?.dayLabel || '--'}</div>
            <div className="flex items-center gap-2 text-slate-500 text-[10px] font-mono">
              <span className="font-bold">₹{bestDay?.pnl.toLocaleString() || '0'}</span>
              <span className="w-1 h-1 rounded-full bg-slate-700"></span>
              <span>{bestDay?.count || 0} trades</span>
            </div>
          </div>
          <div className="bg-[#111827] p-5 rounded-2xl border border-red-500/10 flex flex-col gap-1 transition-all hover:border-red-500/30">
            <span className="text-slate-500 text-[9px] font-black uppercase tracking-[0.2em]">Least Profitable Day</span>
            <div className="text-2xl font-black text-red-400 tracking-tight">{worstDay?.dayLabel || '--'}</div>
            <div className="flex items-center gap-2 text-slate-500 text-[10px] font-mono">
              <span className="font-bold">₹{worstDay?.pnl.toLocaleString() || '0'}</span>
              <span className="w-1 h-1 rounded-full bg-slate-700"></span>
              <span>{worstDay?.count || 0} trades</span>
            </div>
          </div>
        </div>

        <div className="h-[300px] w-full pr-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dailyData} margin={{ top: 10, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={true} horizontal={true} />
              <XAxis 
                dataKey="dayLabel" 
                stroke="#64748b" 
                fontSize={10} 
                fontFamily="Inter, sans-serif"
                fontWeight={700}
                axisLine={true} 
                tickLine={true}
                dy={5}
              />
              <YAxis 
                stroke="#64748b" 
                fontSize={9} 
                axisLine={true} 
                tickLine={true}
                tickFormatter={(val) => `₹${val}`} 
              />
              <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                contentStyle={{ backgroundColor: '#070a13', borderColor: '#1e293b', borderRadius: '12px', color: '#f8fafc' }}
                itemStyle={{ fontWeight: '900', fontSize: '11px' }}
                formatter={(value: any, name: any, props: any) => {
                  const item = props.payload;
                  return [
                    <div key="tooltip-content" className="flex flex-col gap-1">
                      <div className="font-black text-slate-200">₹{item.pnl.toLocaleString()}</div>
                      <div className="text-[9px] text-slate-400 uppercase tracking-widest">{item.count} Executions</div>
                    </div>,
                    'Performance'
                  ];
                }}
              />
              <Bar dataKey="pnl" radius={[6, 6, 0, 0]} barSize={40}>
                {dailyData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#10b981' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="bg-[#0e1421] p-6 rounded-2xl border border-[#1e293b] shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h3 className="text-lg font-black text-white">Performance Heatmap</h3>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-tight">Daily realization tracking</p>
          </div>
          <div className="flex items-center gap-2 bg-[#0a0f1d] p-1 rounded-lg border border-[#1e293b]">
            <button onClick={handlePrevMonth} className="p-2 hover:bg-[#111827] text-slate-400 rounded-md transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
            </button>
            <span className="px-4 font-black text-white text-xs uppercase tracking-widest">
              {viewDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
            </span>
            <button onClick={handleNextMonth} className="p-2 hover:bg-[#111827] text-slate-400 rounded-md transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
            </button>
          </div>
        </div>
        <PnLCalendar viewDate={viewDate} data={calendarData} />
      </section>

      <section className="bg-[#0e1421] p-6 rounded-2xl border border-[#1e293b] shadow-xl">
        <h3 className="text-base font-black mb-6 text-white flex items-center gap-3">
           <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
           Weekly Performance Breakdown
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#0a0f1d] text-slate-500 text-[9px] font-black uppercase tracking-widest border-b border-[#1e293b]">
                <th className="px-6 py-4">Week Identifier</th>
                <th className="px-6 py-4">Total Trades</th>
                <th className="px-6 py-4">Wins / Losses</th>
                <th className="px-6 py-4">Win Rate</th>
                <th className="px-6 py-4 text-right">Gross Profit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e293b]">
              {weeklyBreakdown.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-600 font-bold uppercase tracking-tighter italic">No closed trade data available for weekly analysis.</td>
                </tr>
              ) : weeklyBreakdown.map((wb) => (
                <tr key={wb.week} className="hover:bg-[#111827] transition-colors">
                  <td className="px-6 py-4 font-black text-white text-xs tracking-tight">{wb.week}</td>
                  <td className="px-6 py-4 text-slate-300 font-mono text-xs">{wb.count}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <span className="text-emerald-400 font-bold text-[11px]">{wb.win}W</span>
                      <span className="text-slate-600 text-[11px]">/</span>
                      <span className="text-red-400 font-bold text-[11px]">{wb.loss}L</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-slate-400 text-xs">
                    {((wb.win / wb.count) * 100).toFixed(1)}%
                  </td>
                  <td className={`px-6 py-4 text-right font-mono font-black text-xs ${wb.grossProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    ₹{wb.grossProfit.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-[#0e1421] p-6 rounded-2xl border border-[#1e293b] shadow-xl">
          <h3 className="text-base font-black mb-6 text-white flex items-center gap-3">
             <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
             Top Symbols (INR)
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={symbolData} layout="vertical" margin={{ left: 10, right: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} vertical={true} />
                <XAxis type="number" stroke="#64748b" fontSize={9} axisLine={false} tickLine={false} />
                <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={9} axisLine={false} tickLine={false} width={80} />
                <Tooltip 
                   contentStyle={{ backgroundColor: '#070a13', borderColor: '#1e293b', color: '#f8fafc', borderRadius: '12px' }}
                   itemStyle={{ fontSize: '11px', fontWeight: '900' }}
                   formatter={(value) => [`₹${Number(value).toLocaleString()}`, 'Total P&L']}
                />
                <Bar dataKey="pnl" radius={[0, 4, 4, 0]} barSize={28}>
                  {symbolData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#10b981' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#0e1421] p-6 rounded-2xl border border-[#1e293b] shadow-xl">
          <h3 className="text-base font-black mb-6 text-white">Strategy Breakdown</h3>
          <div className="space-y-3">
            {strategyData.map((s, idx) => (
              <div key={s.name} className="flex items-center justify-between p-3.5 bg-[#0a0f1d] rounded-xl border border-[#1e293b] transition-colors hover:border-emerald-500/30">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-black text-[10px] border border-emerald-500/20">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="font-black text-white text-xs">{s.name}</div>
                    <div className="text-[8px] text-slate-600 font-black uppercase tracking-widest mt-0.5">
                      {s.count} Trades • {((s.win/s.count)*100).toFixed(0)}% Win Rate
                    </div>
                  </div>
                </div>
                <div className={`font-mono font-black text-sm ${s.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  ₹{s.pnl.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const PnLCalendar = ({ viewDate, data }: { viewDate: Date; data: Record<string, { pnl: number; count: number }> }) => {
  const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
  
  const monthDays = useMemo(() => {
    return Array.from({ length: 42 }, (_, i) => {
      const day = i - firstDayOfMonth + 1;
      if (day <= 0 || day > daysInMonth) return null;
      const dateStr = `${viewDate.getFullYear()}-${String(viewDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const stats = data[dateStr];
      return { day, stats, dateStr };
    });
  }, [viewDate, data, firstDayOfMonth, daysInMonth]);

  return (
    <div className="grid grid-cols-7 gap-1 md:gap-2">
      {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((d, i) => (
        <div key={i} className="text-center text-[8px] font-black text-slate-600 uppercase tracking-widest pb-3">{d}</div>
      ))}
      {monthDays.map((d, i) => (
        <div 
          key={i} 
          className={`min-h-[40px] md:min-h-[70px] p-1.5 rounded-xl border transition-all ${
            d ? 'bg-[#0a0f1d] border-[#1e293b] hover:border-[#334155]' : 'border-transparent opacity-0'
          } ${d?.stats && (d.stats.pnl > 0 ? 'bg-emerald-500/5 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.05)]' : d.stats.pnl < 0 ? 'bg-red-500/5 border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.05)]' : '')}`}
        >
          {d && (
            <div className="flex flex-col h-full">
              <div className="text-[8px] font-black text-slate-600 mb-0.5">{d.day}</div>
              {d.stats && (
                <div className="flex flex-col h-full justify-center text-center">
                  <div className={`text-[9px] md:text-xs font-black tracking-tighter ${d.stats.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {d.stats.pnl >= 0 ? '+' : ''}₹{Math.abs(d.stats.pnl).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </div>
                  <div className="text-[7px] text-slate-700 font-bold uppercase mt-0.5">{d.stats.count}T</div>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default AnalysisView;
