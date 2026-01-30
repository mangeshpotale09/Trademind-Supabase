
import React, { useState, useEffect } from 'react';
import { Trade } from '../types';
import { getWeeklyInsights, queryTradeHistory } from '../services/geminiService';

interface AIInsightsViewProps {
  trades: Trade[];
}

const AIInsightsView: React.FC<AIInsightsViewProps> = ({ trades }) => {
  const [weeklySummary, setWeeklySummary] = useState<string | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [query, setQuery] = useState('');
  const [queryResponse, setQueryResponse] = useState<string | null>(null);
  const [isQuerying, setIsQuerying] = useState(false);

  useEffect(() => {
    // Only fetch if we have trades and no current summary
    if (trades.length > 0 && !weeklySummary && !isLoadingSummary) {
      handleRefreshSummary();
    }
  }, [trades]);

  const handleRefreshSummary = async () => {
    setIsLoadingSummary(true);
    const summary = await getWeeklyInsights(trades);
    setWeeklySummary(summary);
    setIsLoadingSummary(false);
  };

  const handleQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setIsQuerying(true);
    const response = await queryTradeHistory(query, trades);
    setQueryResponse(response);
    setIsQuerying(false);
  };

  return (
    <div className="space-y-6 pb-20">
      <section>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <h2 className="text-lg md:text-xl font-black flex items-center gap-2">
            <span className="bg-purple-500/20 text-purple-400 p-1.5 rounded-lg">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd"></path></svg>
            </span>
            Weekly AI Audit
          </h2>
          <button 
            onClick={handleRefreshSummary}
            disabled={isLoadingSummary}
            className="w-full sm:w-auto text-[10px] font-black uppercase tracking-widest bg-[#1e293b] hover:bg-[#334155] text-slate-200 py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all border border-[#334155]"
          >
            {isLoadingSummary ? (
              <><div className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div> Thinking...</>
            ) : (
              'Refresh Audit'
            )}
          </button>
        </div>

        {weeklySummary ? (
          <div className="bg-[#0e1421] rounded-2xl p-5 md:p-8 border border-[#1e293b] shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none group-hover:opacity-[0.05] transition-opacity">
              <svg className="w-32 h-32 md:w-48 md:h-48" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L1 21h22L12 2zm0 3.99L19.53 19H4.47L12 5.99zM11 16h2v2h-2zm0-6h2v4h-2z"/></svg>
            </div>
            <div className="prose prose-sm md:prose-invert max-w-none text-slate-300 leading-relaxed whitespace-pre-wrap font-medium">
              {weeklySummary}
            </div>
          </div>
        ) : (
          <div className="h-48 bg-[#0e1421] rounded-2xl border border-dashed border-[#1e293b] flex flex-col items-center justify-center text-slate-500 p-6 text-center">
            {isLoadingSummary ? (
              <div className="space-y-3">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-500 border-t-transparent mx-auto"></div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Gemini Pro is auditing patterns...</p>
              </div>
            ) : (
              <p className="text-[10px] font-black uppercase tracking-widest">Click refresh to generate deep weekly analysis.</p>
            )}
          </div>
        )}
      </section>

      <section className="bg-[#0a0f1d] p-5 md:p-8 rounded-2xl border border-[#1e293b]">
        <h3 className="text-base font-black mb-2 flex items-center gap-2 text-white">
          <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          Identity Query
        </h3>
        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-5">Audit your performance via natural language</p>
        
        <form onSubmit={handleQuery} className="flex flex-col sm:flex-row gap-2">
          <input 
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. My biggest mistake this week?"
            className="flex-1 bg-[#070a13] border border-[#1e293b] rounded-xl p-3 text-xs focus:ring-2 focus:ring-blue-500 outline-none shadow-inner text-slate-200"
          />
          <button 
            type="submit"
            disabled={isQuerying || !query.trim()}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-30 text-white font-black px-6 py-3 rounded-xl shadow-lg transition-all text-[10px] uppercase tracking-widest"
          >
            {isQuerying ? 'Auditing...' : 'Query'}
          </button>
        </form>

        {queryResponse && (
          <div className="mt-5 p-5 bg-blue-500/5 border border-blue-500/20 rounded-xl animate-in fade-in slide-in-from-top-4 duration-300">
             <div className="prose prose-sm max-w-none text-blue-100/90 whitespace-pre-wrap leading-relaxed font-medium">
              {queryResponse}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default AIInsightsView;
