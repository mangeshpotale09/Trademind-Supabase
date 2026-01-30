
import React, { useState, useRef } from 'react';
import { Trade, TradeStatus, TradeSide, TradeType, Attachment } from '../types';
import { calculatePnL, uploadAttachment } from '../services/storageService';
import { getAIReviewForTrade } from '../services/geminiService';

interface TradeDetailProps {
  trade: Trade;
  onUpdate: (updatedTrade: Trade) => void;
  onEdit: (trade: Trade) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
  isAdmin?: boolean;
  currentUserId?: string;
}

const TradeDetail: React.FC<TradeDetailProps> = ({ trade, onUpdate, onEdit, onDelete, onClose, isAdmin = false, currentUserId }) => {
  const [exitPrice, setExitPrice] = useState(trade.exitPrice?.toString() || '');
  const [isUploading, setIsUploading] = useState(false);
  
  const formatDateTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  };

  const [exitDate, setExitDate] = useState(formatDateTime(new Date().toISOString()));
  const [isReviewing, setIsReviewing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pnl = calculatePnL(trade);

  const canModify = isAdmin || trade.userId === currentUserId;

  const handleCloseTrade = () => {
    if (!canModify) return;
    const price = parseFloat(exitPrice);
    if (isNaN(price)) {
      alert('Please provide a valid Exit Price.');
      return;
    }

    const updatedTrade: Trade = {
      ...trade,
      status: TradeStatus.CLOSED,
      exitPrice: price,
      exitDate: new Date(exitDate).toISOString()
    };
    onUpdate(updatedTrade);
  };

  const handleAIReview = async () => {
    if (!canModify) return;
    setIsReviewing(true);
    const review = await getAIReviewForTrade(trade);
    if (review) {
      onUpdate({ ...trade, aiReview: review });
    }
    setIsReviewing(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && currentUserId) {
      setIsUploading(true);
      try {
        // Fix: Added explicit File type to avoid unknown type errors
        const uploadPromises = Array.from(files).map(async (file: File) => {
          const publicUrl = await uploadAttachment(currentUserId, file);
          return {
            id: crypto.randomUUID(),
            name: file.name,
            type: file.type,
            url: publicUrl
          };
        });
        const newAttachments = await Promise.all(uploadPromises);
        onUpdate({
          ...trade,
          attachments: [...(trade.attachments || []), ...newAttachments]
        });
      } catch (err) {
        alert("Upload failed.");
      } finally {
        setIsUploading(false);
      }
    }
  };

  const confirmAndDelete = () => {
    if (!canModify) return;
    if (window.confirm('Are you sure you want to permanently delete this trade? This action cannot be undone.')) {
      onDelete(trade.id);
    }
  };

  const formatTimestamp = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
  };

  return (
    <div className="bg-[#0e1421] rounded-2xl border border-[#1e293b] overflow-hidden animate-in slide-in-from-right duration-300 max-h-[90vh] flex flex-col shadow-2xl">
      <input type="file" ref={fileInputRef} multiple accept="image/*" onChange={handleFileUpload} className="hidden" />
      
      <div className="p-6 border-b border-[#1e293b] flex justify-between items-center bg-[#0a0f1d]/80 sticky top-0 z-10 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl ${trade.side === TradeSide.LONG ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
            {trade.symbol.substring(0, 1)}
          </div>
          <div>
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              {trade.symbol} 
              <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded tracking-widest ${trade.side === TradeSide.LONG ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                {trade.side}
              </span>
            </h2>
            <div className="flex flex-col">
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Opened: {formatTimestamp(trade.entryDate)}</p>
              {trade.exitDate && <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Closed: {formatTimestamp(trade.exitDate)}</p>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {canModify && (
            <>
              <button onClick={() => onEdit(trade)} className="p-2 hover:bg-[#1e293b] rounded-lg text-slate-400 transition-colors" title="Edit Record">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
              </button>
              <button onClick={confirmAndDelete} className="p-2 hover:bg-red-500/10 rounded-lg text-slate-400 hover:text-red-500 transition-colors" title="Purge Record">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
              </button>
            </>
          )}
          <button onClick={onClose} className="p-2 hover:bg-[#1e293b] rounded-lg text-slate-400 ml-1 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
      </div>

      <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#0a0f1d] p-4 rounded-2xl border border-[#1e293b]">
              <span className="block text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Entry Quote</span>
              <span className="text-lg font-mono font-black text-slate-200">₹{trade.entryPrice.toLocaleString()}</span>
            </div>
            <div className="bg-[#0a0f1d] p-4 rounded-2xl border border-[#1e293b]">
              <span className="block text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Lot Size</span>
              <span className="text-lg font-mono font-black text-slate-200">{trade.quantity}</span>
            </div>
            {trade.status === TradeStatus.CLOSED && (
              <div className="bg-[#0a0f1d] p-4 rounded-2xl border border-[#1e293b]">
                <span className="block text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Exit Quote</span>
                <span className="text-lg font-mono font-black text-slate-200">₹{trade.exitPrice?.toLocaleString()}</span>
              </div>
            )}
            <div className="bg-[#0a0f1d] p-4 rounded-2xl border border-[#1e293b]">
              <span className="block text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Costs</span>
              <span className="text-lg font-mono font-black text-red-400">₹{trade.fees.toLocaleString()}</span>
            </div>
          </div>

          <div className={`p-8 rounded-2xl border flex flex-col items-center justify-center transition-all ${pnl >= 0 ? 'bg-emerald-500/5 border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.05)]' : 'bg-red-500/5 border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.05)]'}`}>
            <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Net Realized Value</span>
            <span className={`text-4xl font-black font-mono tracking-tighter ${pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {pnl >= 0 ? '+' : '-'}₹{Math.abs(pnl).toLocaleString()}
            </span>
          </div>

          <div>
            <h3 className="text-slate-400 font-black text-xs uppercase tracking-widest mb-2 flex items-center gap-2">Notes & Analysis</h3>
            <p className="bg-[#0a0f1d] p-5 rounded-2xl text-slate-300 whitespace-pre-wrap italic border border-[#1e293b] leading-relaxed text-sm">"{trade.notes || 'No context provided.'}"</p>
          </div>

          <div className="space-y-4">
            <h3 className="text-slate-400 font-black text-xs uppercase tracking-widest">Evidence Vault ({trade.attachments?.length || 0})</h3>
            <div className="grid grid-cols-1 gap-4">
              {trade.attachments && trade.attachments.length > 0 ? trade.attachments.length > 0 && trade.attachments.map(att => (
                <div key={att.id} className="border border-[#1e293b] rounded-2xl overflow-hidden bg-[#0a0f1d]">
                  {att.type.startsWith('image/') ? (
                    <img src={att.url} alt={att.name} className="w-full h-auto" />
                  ) : (
                    <div className="p-6 flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-300">{att.name}</span>
                      <a href={att.url} target="_blank" rel="noopener noreferrer" className="text-[10px] font-black uppercase text-emerald-400">View File</a>
                    </div>
                  )}
                </div>
              )) : (
                <div className="p-10 border-2 border-dashed border-[#1e293b] rounded-2xl text-center">
                   <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">No evidence captured</p>
                </div>
              )}
              {canModify && (
                 <button 
                  onClick={() => fileInputRef.current?.click()} 
                  disabled={isUploading}
                  className="w-full py-4 bg-[#0a0f1d] border border-[#1e293b] rounded-2xl flex items-center justify-center gap-3 text-slate-500 hover:text-white transition-all disabled:opacity-50"
                >
                  {isUploading ? "Uploading..." : "Add Evidence"}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex justify-between items-center bg-[#0a0f1d] p-4 rounded-2xl border border-[#1e293b]">
            <h3 className="text-xl font-black flex items-center gap-2 text-white">AI Coach Audit</h3>
            {canModify && (
              <button onClick={handleAIReview} disabled={isReviewing} className={`text-xs font-black py-2.5 px-5 rounded-xl transition-all disabled:opacity-50 shadow-lg ${trade.aiReview ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30' : 'bg-emerald-500 text-slate-900'}`}>{isReviewing ? 'Analyzing...' : trade.aiReview ? 'Re-Audit' : 'Run Audit'}</button>
            )}
          </div>
          {trade.aiReview ? (
            <div className="space-y-4">
              <div className="bg-[#0a0f1d] rounded-2xl border border-[#1e293b] p-6 flex items-center justify-between shadow-xl">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-2xl font-black text-emerald-400">{trade.aiReview.score}</div>
                  <div>
                    <h4 className="font-black text-slate-200 text-sm">Coach Score</h4>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Logic & Discipline</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div className="bg-emerald-500/5 rounded-2xl border border-emerald-500/20 overflow-hidden">
                  <div className="bg-emerald-500/10 px-4 py-2 border-b border-emerald-500/10"><span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Strengths</span></div>
                  <div className="p-4"><p className="text-slate-300 text-xs italic">"{trade.aiReview.well}"</p></div>
                </div>
                <div className="bg-red-500/5 rounded-2xl border border-red-500/20 overflow-hidden">
                  <div className="bg-red-500/10 px-4 py-2 border-b border-red-500/10"><span className="text-[9px] font-black text-red-400 uppercase tracking-widest">Leaks</span></div>
                  <div className="p-4"><p className="text-slate-300 text-xs italic">"{trade.aiReview.wrong}"</p></div>
                </div>
                <div className="bg-blue-500/5 rounded-2xl border border-blue-500/20 overflow-hidden">
                  <div className="bg-blue-500/10 px-4 py-2 border-b border-blue-500/10"><span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Growth Directive</span></div>
                  <div className="p-4"><p className="text-white text-xs font-bold leading-relaxed">{trade.aiReview.improvement}</p></div>
                </div>
              </div>
              
              {trade.aiReview.sources && trade.aiReview.sources.length > 0 && (
                <div className="mt-4 p-4 bg-[#0a0f1d] rounded-2xl border border-[#1e293b]">
                  <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Verified Market Sources</h5>
                  <div className="space-y-2">
                    {trade.aiReview.sources.map((src, idx) => (
                      <a 
                        key={idx} 
                        href={src.uri} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-all group"
                      >
                        <svg className="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                        <span className="text-[10px] font-bold text-slate-300 group-hover:text-white truncate">{src.title}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
             <div className="h-full flex flex-col items-center justify-center bg-[#0a0f1d] rounded-2xl border border-[#1e293b] p-10 text-center space-y-4">
               <div className="w-16 h-16 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></div>
               <h3 className="text-white font-black">AI Analysis Pending</h3>
               <p className="text-slate-500 text-xs leading-relaxed">Run a Coach Audit to evaluate this trade with Google Search grounded intelligence.</p>
            </div>
          )}
        </div>
      </div>

      {trade.status === TradeStatus.OPEN && canModify && (
        <div className="p-6 border-t border-[#1e293b] bg-[#0a0f1d] flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-4">
               <input 
                type="number"
                step="0.01"
                placeholder="Exit Price (₹)"
                value={exitPrice}
                onChange={(e) => setExitPrice(e.target.value)}
                className="w-full bg-[#111827] border border-[#1e293b] rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 outline-none text-white font-mono"
              />
              <input 
                type="datetime-local"
                value={exitDate}
                onChange={(e) => setExitDate(e.target.value)}
                className="w-full bg-[#111827] border border-[#1e293b] rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 outline-none text-white text-sm"
              />
            </div>
            <button 
              onClick={handleCloseTrade}
              className="w-full md:w-fit bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black px-10 py-3 rounded-xl transition-all shadow-lg shadow-emerald-500/10 uppercase text-xs tracking-widest whitespace-nowrap"
            >
              Realize Trade
            </button>
        </div>
      )}
    </div>
  );
};

export default TradeDetail;
