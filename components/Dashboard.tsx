
import React, { useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Trade, TradeStatus, TradeType } from '../types';
import { calculatePnL, calculateGrossPnL } from '../services/storageService';

interface DashboardProps {
  trades: Trade[];
  onExport?: () => void;
}

type TimeFilter = 'WEEK' | 'MONTH' | '3MONTHS' | '6MONTHS' | '1YEAR' | 'ALL';

const Dashboard: React.FC<DashboardProps> = ({ trades, onExport }) => {
  const [filter, setFilter] = useState<TimeFilter>('ALL');

  const filteredTrades = useMemo(() => {
    const closedTrades = trades.filter(t => t.status === TradeStatus.CLOSED);
    if (filter === 'ALL') return closedTrades;

    const now = new Date();
    const filterMap: Record<TimeFilter, number> = {
      'WEEK': 7,
      'MONTH': 30,
      '3MONTHS': 90,
      '6MONTHS': 180,
      '1YEAR': 365,
      'ALL': 0
    };

    const days = filterMap[filter];
    const cutoff = new Date();
    cutoff.setDate(now.getDate() - days);

    return closedTrades.filter(t => new Date(t.exitDate!) >= cutoff);
  }, [trades, filter]);

  const stats = useMemo(() => {
    const closedTrades = filteredTrades;
    const totalGrossPnL = closedTrades.reduce((acc, t) => acc + calculateGrossPnL(t), 0);
    const totalFees = closedTrades.reduce((acc, t) => acc + t.fees, 0);
    const totalNetPnL = totalGrossPnL - totalFees;

    const winningTrades = closedTrades.filter(t => calculateGrossPnL(t) > 0);
    const losingTrades = closedTrades.filter(t => calculateGrossPnL(t) < 0);

    const winCount = winningTrades.length;
    const lossCount = losingTrades.length;
    const winRate = closedTrades.length > 0 ? (winCount / closedTrades.length) * 100 : 0;

    // Option Specific Stats
    const optionTrades = closedTrades.filter(t => t.type === TradeType.OPTION);
    const winningOptionTrades = optionTrades.filter(t => calculateGrossPnL(t) > 0);
    const optionWinRate = optionTrades.length > 0 ? (winningOptionTrades.length / optionTrades.length) * 100 : 0;
    const optionNetPnL = optionTrades.reduce((acc, t) => acc + calculatePnL(t), 0);
    const optionPnLRatio = totalNetPnL !== 0 ? (optionNetPnL / Math.abs(totalNetPnL)) * 100 : 0;

    const totalWinAmount = winningTrades.reduce((acc, t) => acc + calculateGrossPnL(t), 0);
    const totalLossAmount = Math.abs(losingTrades.reduce((acc, t) => acc + calculateGrossPnL(t), 0));

    const avgWin = winCount > 0 ? totalWinAmount / winCount : 0;
    const avgLoss = lossCount > 0 ? totalLossAmount / lossCount : 0;

    const rrr = avgLoss !== 0 ? (avgWin / avgLoss) : (winCount > 0 ? 99 : 0);
    const profitFactor = totalLossAmount !== 0 ? (totalWinAmount / totalLossAmount) : (totalWinAmount > 0 ? 99 : 0);

    const sortedByNet = [...closedTrades].sort((a, b) => calculatePnL(b) - calculatePnL(a));
    const bestTradePnL = sortedByNet.length > 0 ? calculatePnL(sortedByNet[0]) : 0;
    const worstTradePnL = sortedByNet.length > 0 ? calculatePnL(sortedByNet[sortedByNet.length - 1]) : 0;

    let runningTotal = 0;
    const chartData = [...closedTrades]
      .sort((a, b) => new Date(a.exitDate!).getTime() - new Date(b.exitDate!).getTime())
      .map(t => {
        runningTotal += calculatePnL(t);
        return {
          date: new Date(t.exitDate!).toLocaleDateString(),
          pnl: runningTotal
        };
      });

    return { 
      totalGrossPnL, 
      totalNetPnL,
      totalFees,
      winRate, 
      winCount,
      lossCount,
      avgWin, 
      avgLoss,
      rrr,
      profitFactor,
      bestTradePnL,
      worstTradePnL,
      chartData, 
      closedCount: closedTrades.length,
      optionWinRate,
      optionPnLRatio,
      optionCount: optionTrades.length
    };
  }, [filteredTrades]);

  const assetDistribution = useMemo(() => {
    const counts = trades.reduce((acc, t) => {
      acc[t.type] = (acc[t.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [trades]);

  const COLORS = ['#10b981', '#ef4444', '#3b82f6'];

  const filterButtons: { label: string; value: TimeFilter }[] = [
    { label: 'Weekly', value: 'WEEK' },
    { label: 'Monthly', value: 'MONTH' },
    { label: '3M', value: '3MONTHS' },
    { label: '6M', value: '6MONTHS' },
    { label: '1Y', value: '1YEAR' },
    { label: 'All', value: 'ALL' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center gap-8 py-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
          <span className="text-sm font-semibold text-slate-300">Wins ({stats.winCount})</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span className="text-sm font-semibold text-slate-300">Losses ({stats.lossCount})</span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2 bg-[#0a0f1d] p-1.5 rounded-xl border border-[#1e293b] w-full md:w-fit">
          {filterButtons.map(btn => (
            <button
              key={btn.value}
              onClick={() => setFilter(btn.value)}
              className={`flex-1 md:flex-none px-3 md:px-4 py-1.5 rounded-lg text-[10px] md:text-sm font-semibold transition-all ${
                filter === btn.value 
                  ? 'bg-emerald-500 text-slate-900 shadow-lg shadow-emerald-500/20' 
                  : 'text-slate-500 hover:text-slate-300 hover:bg-[#111827]'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {onExport && (
          <button 
            onClick={onExport}
            className="flex items-center gap-2 px-6 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400 font-black text-[10px] uppercase tracking-widest hover:bg-blue-500/20 transition-all shadow-lg"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
            Extract Report
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="Net P&L" value={`₹${stats.totalNetPnL.toLocaleString()}`} subValue={`Gross: ₹${stats.totalGrossPnL.toLocaleString()}`} trend={stats.totalNetPnL >= 0 ? 'up' : 'down'} color={stats.totalNetPnL >= 0 ? 'text-emerald-400' : 'text-red-400'} />
        <StatCard label="Win Rate" value={`${stats.winRate.toFixed(1)}%`} subValue={`${stats.winCount}W / ${stats.lossCount}L`} color="text-cyan-400" />
        <StatCard label="Option Perf." value={`${stats.optionWinRate.toFixed(1)}%`} subValue={`P&L Ratio: ${stats.optionPnLRatio.toFixed(1)}%`} color="text-purple-400" />
        <StatCard label="Profit Factor" value={stats.profitFactor.toFixed(2)} subValue="Ratio of Gross P/L" color={stats.profitFactor >= 1.5 ? 'text-emerald-400' : stats.profitFactor < 1 ? 'text-red-400' : 'text-amber-400'} />
        <StatCard label="Avg RRR" value={`${stats.rrr.toFixed(2)}:1`} subValue="Risk / Reward Ratio" color={stats.rrr >= 1 ? 'text-emerald-400' : 'text-slate-200'} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard label="Avg Win" value={`₹${stats.avgWin.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} subValue="Avg Profit per Win" color="text-emerald-400" />
        <StatCard label="Avg Loss" value={`₹${stats.avgLoss.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} subValue="Avg Loss per Loss" color="text-red-400" />
        <StatCard label="Largest Win" value={`₹${stats.bestTradePnL.toLocaleString()}`} subValue="Session Max Profit" color="text-emerald-400" />
        <StatCard label="Largest Loss" value={`₹${stats.worstTradePnL.toLocaleString()}`} subValue="Session Max Drawdown" color="text-red-400" />
        <StatCard label="Brokerages" value={`₹${stats.totalFees.toLocaleString()}`} subValue="Cumulative Fees" color="text-slate-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#0e1421] p-6 rounded-2xl border border-[#1e293b] shadow-xl">
          <h3 className="text-lg font-bold mb-6 text-slate-200 flex items-center gap-2">
             <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"></path></svg>
             Equity Performance Curve
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.chartData}>
                <defs>
                  <linearGradient id="colorPnL" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="date" stroke="#64748b" fontSize={10} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={10} axisLine={false} tickFormatter={(val) => `₹${val}`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#070a13', borderColor: '#1e293b', color: '#f8fafc' }}
                  itemStyle={{ color: '#10b981' }}
                  formatter={(value) => [`₹${Number(value).toLocaleString()}`, 'Net P&L']}
                />
                <Area 
                  isAnimationActive={false} 
                  type="monotone" 
                  dataKey="pnl" 
                  stroke="#10b981" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorPnL)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#0e1421] p-6 rounded-2xl border border-[#1e293b] shadow-xl flex flex-col items-center">
          <h3 className="text-lg font-bold mb-6 text-slate-200 w-full">Execution Distribution</h3>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  isAnimationActive={false} 
                  data={assetDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {assetDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#070a13', borderColor: '#1e293b', color: '#f8fafc' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-4 mt-4">
            {assetDistribution.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                <span className="text-xs text-slate-400 font-bold uppercase tracking-tighter">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, subValue, trend, color }: any) => (
  <div className="bg-[#0e1421] p-5 rounded-2xl border border-[#1e293b] shadow-lg flex flex-col justify-between h-full transition-transform active:scale-[0.98]">
    <div>
      <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{label}</span>
      <div className="flex items-baseline gap-2 mt-2">
        <span className={`text-2xl font-black font-mono truncate ${color || 'text-slate-100'}`}>{value}</span>
        {trend && (
          <span className={trend === 'up' ? 'text-emerald-500 text-sm' : 'text-red-500 text-sm'}>
            {trend === 'up' ? '▲' : '▼'}
          </span>
        )}
      </div>
    </div>
    {subValue && <span className="text-slate-600 text-[10px] mt-3 block font-bold uppercase tracking-tight border-t border-[#1e293b] pt-3">{subValue}</span>}
  </div>
);

export default Dashboard;
