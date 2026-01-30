
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Trade, TradeStatus } from '../types';
import { calculateGrossPnL } from '../services/storageService';

interface MistakesViewProps {
  trades: Trade[];
}

const MistakesView: React.FC<MistakesViewProps> = ({ trades }) => {
  const closedTrades = useMemo(() => trades.filter(t => t.status === TradeStatus.CLOSED), [trades]);

  const mistakesData = useMemo(() => {
    const map: Record<string, { name: string; pnl: number; count: number; wins: number }> = {};
    
    closedTrades.forEach(t => {
      const pnl = calculateGrossPnL(t);
      if (t.mistakes.length === 0) {
        if (!map['No Mistake']) map['No Mistake'] = { name: 'No Mistake (Disciplined)', pnl: 0, count: 0, wins: 0 };
        map['No Mistake'].pnl += pnl;
        map['No Mistake'].count++;
        if (pnl > 0) map['No Mistake'].wins++;
      } else {
        t.mistakes.forEach(m => {
          if (!map[m]) map[m] = { name: m, pnl: 0, count: 0, wins: 0 };
          map[m].pnl += pnl;
          map[m].count++;
          if (pnl > 0) map[m].wins++;
        });
      }
    });

    return Object.values(map).sort((a, b) => a.pnl - b.pnl); // Sort by biggest loss first
  }, [closedTrades]);

  const totalMistakesLoss = useMemo(() => {
    return mistakesData.filter(d => d.name !== 'No Mistake (Disciplined)' && d.pnl < 0)
      .reduce((acc, curr) => acc + curr.pnl, 0);
  }, [mistakesData]);

  const mostFrequentMistake = useMemo(() => {
    return [...mistakesData]
      .filter(d => d.name !== 'No Mistake (Disciplined)')
      .sort((a, b) => b.count - a.count)[0];
  }, [mistakesData]);

  return (
    <div className="space-y-8 pb-20">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Cost of Mistakes</span>
          <div className="text-3xl font-black mt-2 text-red-400">₹{Math.abs(totalMistakesLoss).toLocaleString()}</div>
          <p className="text-slate-500 text-xs mt-2">Total gross P&L lost on trades tagged with mistakes.</p>
        </div>
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Most Frequent Leak</span>
          <div className="text-2xl font-black mt-2 text-slate-200">{mostFrequentMistake?.name || 'None'}</div>
          <p className="text-slate-500 text-xs mt-2">Occurred {mostFrequentMistake?.count || 0} times.</p>
        </div>
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Clean Trade Win Rate</span>
          <div className="text-3xl font-black mt-2 text-green-400">
            {mistakesData.find(d => d.name.includes('Disciplined')) ? 
              ((mistakesData.find(d => d.name.includes('Disciplined'))!.wins / mistakesData.find(d => d.name.includes('Disciplined'))!.count) * 100).toFixed(1) : 0}%
          </div>
          <p className="text-slate-500 text-xs mt-2">Win rate when following your plan perfectly.</p>
        </div>
      </div>

      <section className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
        <h3 className="text-lg font-bold mb-6 text-slate-200">P&L Impact by Mistake Type</h3>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mistakesData} layout="vertical" margin={{ left: 40, right: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={true} vertical={false} />
              <XAxis type="number" stroke="#64748b" fontSize={10} tickFormatter={(v) => `₹${v}`} />
              <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={10} width={140} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc' }}
                formatter={(value: any) => [`₹${value.toLocaleString()}`, 'P&L Impact']}
              />
              <Bar dataKey="pnl">
                {mistakesData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#10b981' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
        <h3 className="text-lg font-bold mb-6 text-slate-200">Mistake Breakdown Table</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-slate-500 uppercase tracking-wider border-b border-slate-700">
                <th className="pb-3 px-2">Mistake Type</th>
                <th className="pb-3 px-2">Frequency</th>
                <th className="pb-3 px-2">Win Rate</th>
                <th className="pb-3 px-2 text-right">Total P&L</th>
                <th className="pb-3 px-2 text-right">Avg. Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {mistakesData.map(d => (
                <tr key={d.name} className="hover:bg-slate-700/30 transition-colors">
                  <td className="py-4 px-2 font-semibold text-slate-300">{d.name}</td>
                  <td className="py-4 px-2">{d.count} Trades</td>
                  <td className="py-4 px-2">{((d.wins / d.count) * 100).toFixed(1)}%</td>
                  <td className={`py-4 px-2 text-right font-mono font-bold ${d.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    ₹{d.pnl.toLocaleString()}
                  </td>
                  <td className={`py-4 px-2 text-right font-mono text-xs ${d.pnl / d.count >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    ₹{(d.pnl / d.count).toLocaleString()}
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

export default MistakesView;
