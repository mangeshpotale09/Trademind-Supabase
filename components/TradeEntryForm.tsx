
import { Trade, TradeType, TradeSide, OptionType, TradeStatus, Attachment } from '../types';
import React, { useState, useRef, useEffect } from 'react';
import { generateUUID, uploadAttachment } from '../services/storageService';

interface TradeEntryFormProps {
  initialTrade?: Trade;
  onAdd: (trade: Trade) => void;
  onCancel: () => void;
  userId: string;
}

const EMOTIONS = ['Calm', 'Fear', 'Greed', 'FOMO', 'Excited', 'Anxious', 'Confident', 'Impatient'];
const MISTAKES = [
  'Chasing', 
  'No Stop Loss', 
  'Over-leveraged', 
  'Early Exit', 
  'Late Entry', 
  'Averaging Down', 
  'Revenge Trade', 
  'Ignored Setup', 
  'FOMO', 
  'More than 3 Trades', 
  'No strategy'
];
const STRATEGIES = [
  'Breakout', 
  'Mean Reversion', 
  'Trend Following', 
  'Support/Resistance', 
  'EMA Cross', 
  'VWAP Bounce', 
  'Scalp', 
  'Gap Fill', 
  '200 EMA support', 
  'PIVOT Resistance', 
  'PIVOT Support', 
  'EMA Retested'
];

const TradeEntryForm: React.FC<TradeEntryFormProps> = ({ initialTrade, onAdd, onCancel, userId }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [type, setType] = useState<TradeType>(initialTrade?.type || TradeType.STOCK);
  const [symbol, setSymbol] = useState(initialTrade?.symbol || 'NIFTY 50');
  const [customSymbol, setCustomSymbol] = useState('');
  const [side, setSide] = useState<TradeSide>(initialTrade?.side || TradeSide.LONG);
  const [entryPrice, setEntryPrice] = useState(initialTrade?.entryPrice?.toString() || '');
  const [exitPrice, setExitPrice] = useState(initialTrade?.exitPrice?.toString() || '');
  const [quantity, setQuantity] = useState(initialTrade?.quantity?.toString() || '');
  const [fees, setFees] = useState(initialTrade?.fees?.toString() || '0');
  const [notes, setNotes] = useState(initialTrade?.notes || '');
  
  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  };

  const initialEntryDate = initialTrade?.entryDate ? formatDateTime(initialTrade.entryDate) : formatDateTime(new Date().toISOString());
  const initialExitDate = initialTrade?.exitDate ? formatDateTime(initialTrade.exitDate) : '';

  const [entryDate, setEntryDate] = useState(initialEntryDate);
  const [exitDate, setExitDate] = useState(initialExitDate);

  const [selectedEmotions, setSelectedEmotions] = useState<string[]>(initialTrade?.emotions || []);
  const [selectedMistakes, setSelectedMistakes] = useState<string[]>(initialTrade?.mistakes || []);
  const [selectedStrategies, setSelectedStrategies] = useState<string[]>(initialTrade?.strategies || []);
  const [attachments, setAttachments] = useState<Attachment[]>(initialTrade?.attachments || []);

  const [strike, setStrike] = useState(initialTrade?.optionDetails?.strike?.toString() || '');
  const [expiration, setExpiration] = useState(initialTrade?.optionDetails?.expiration || '');
  const [optionType, setOptionType] = useState<OptionType>(initialTrade?.optionDetails?.option_type || OptionType.CALL);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const symbols = ['NIFTY 50', 'BANKNIFTY', 'SENSEX', 'GOLD', 'BTC', 'ETH', 'OTHER'];

  useEffect(() => {
    if (initialTrade && !symbols.includes(initialTrade.symbol)) {
      setSymbol('OTHER');
      setCustomSymbol(initialTrade.symbol);
    }
  }, [initialTrade]);

  const handleToggle = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>, item: string) => {
    if (list.includes(item)) {
      setList(list.filter(i => i !== item));
    } else {
      setList([...list, item]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setIsUploading(true);
      try {
        const uploadPromises = Array.from(files).map(async (file: File) => {
          const publicUrl = await uploadAttachment(userId, file);
          return {
            id: generateUUID(),
            name: file.name,
            type: file.type,
            url: publicUrl
          };
        });

        const newAttachments = await Promise.all(uploadPromises);
        setAttachments(prev => [...prev, ...newAttachments]);
      } catch (err: any) {
        console.error("Upload error details:", err);
        alert(`Storage Error: ${err.message || 'Check if trade-attachments bucket exists in Supabase Storage'}`);
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const parseNum = (val: string): number => {
    const n = parseFloat(val);
    return isNaN(n) ? 0 : n;
  };

  const isValidDate = (d: string) => d && !isNaN(new Date(d).getTime());

  const handleSubmit = async () => {
    if (isUploading) {
      alert("Please wait for evidence upload to finish.");
      return;
    }

    const finalSymbol = symbol === 'OTHER' ? customSymbol.toUpperCase() : symbol;
    if (!finalSymbol) {
      alert("A Market Ticker symbol is required.");
      return;
    }

    if (!entryPrice || parseNum(entryPrice) <= 0) {
      alert("Please specify a valid Entry Price.");
      return;
    }

    if (!quantity || parseNum(quantity) <= 0) {
      alert("Lot Size/Quantity must be greater than zero.");
      return;
    }

    const isClosed = exitPrice !== '' && !isNaN(parseFloat(exitPrice));
    
    setIsSubmitting(true);

    try {
      const entryISO = isValidDate(entryDate) ? new Date(entryDate).toISOString() : new Date().toISOString();
      const exitISO = isClosed ? (isValidDate(exitDate) ? new Date(exitDate).toISOString() : new Date().toISOString()) : undefined;

      const newTrade: Trade = {
        ...(initialTrade || {}),
        userId: initialTrade?.userId || userId,
        id: initialTrade?.id || generateUUID(),
        symbol: finalSymbol,
        type,
        side,
        entryPrice: parseNum(entryPrice),
        exitPrice: isClosed ? parseNum(exitPrice) : undefined,
        quantity: parseNum(quantity),
        entryDate: entryISO,
        exitDate: exitISO,
        fees: parseNum(fees),
        status: isClosed ? TradeStatus.CLOSED : TradeStatus.OPEN,
        tags: initialTrade?.tags || [],
        notes,
        emotions: selectedEmotions,
        mistakes: selectedMistakes,
        strategies: selectedStrategies,
        attachments: attachments || [],
        ...(type === TradeType.OPTION ? {
          optionDetails: {
            strike: parseNum(strike),
            expiration,
            option_type: optionType,
          }
        } : {})
      };

      await onAdd(newTrade);
    } catch (err: any) {
      console.error("Submission Error:", err);
      alert(`Commit Failure: ${err.message || 'Ensure your database schema is correct'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { id: 1, name: 'Setup', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg> },
    { id: 2, name: 'Mindset', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg> },
    { id: 3, name: 'Review', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg> }
  ];

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 3));
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  return (
    <div className="bg-[#0e1421] rounded-3xl border border-[#1e293b] shadow-2xl overflow-hidden animate-in zoom-in duration-300 max-h-[90vh] flex flex-col w-full max-w-2xl mx-auto">
      <div className="bg-[#0a0f1d] border-b border-[#1e293b] p-6">
        <div className="flex items-center justify-between mb-8">
           <h2 className="text-xl font-black text-white flex items-center gap-3">
            <span className="bg-emerald-500/20 text-emerald-400 p-2 rounded-xl">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
            </span>
            {initialTrade ? 'Refine Logic' : 'Establish Position'}
          </h2>
          <button onClick={onCancel} className="text-slate-500 hover:text-white transition-colors" disabled={isSubmitting}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <div className="flex items-center justify-between relative px-2">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-[#1e293b] -translate-y-1/2 z-0"></div>
          <div className="absolute top-1/2 left-0 h-0.5 bg-emerald-500 -translate-y-1/2 z-0 transition-all duration-500" style={{ width: `${(currentStep - 1) * 50}%` }}></div>

          {steps.map(step => (
            <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 border-2 ${currentStep >= step.id ? 'bg-emerald-500 border-emerald-500 text-slate-900 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'bg-[#0a0f1d] border-[#1e293b] text-slate-500'}`}>
                {step.icon}
              </div>
              <span className={`text-[10px] font-black uppercase tracking-widest ${currentStep >= step.id ? 'text-emerald-400' : 'text-slate-600'}`}>
                {step.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
        <form onSubmit={(e) => e.preventDefault()} className="space-y-8">
          <input type="file" ref={fileInputRef} multiple accept="image/*" onChange={handleFileChange} className="hidden" />

          {currentStep === 1 && (
            <div className="space-y-6 animate-in slide-in-from-right duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Asset Category</label>
                  <select value={type} onChange={(e) => setType(e.target.value as TradeType)} className="w-full bg-[#0a0f1d] border border-[#1e293b] rounded-2xl p-4 focus:ring-2 focus:ring-emerald-500 outline-none text-white font-bold">
                    <option value={TradeType.STOCK}>Equity / Cash</option>
                    <option value={TradeType.OPTION}>F&O (Derivatives)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Market Ticker</label>
                  <div className="space-y-2">
                    <select value={symbol} onChange={(e) => setSymbol(e.target.value)} className="w-full bg-[#0a0f1d] border border-[#1e293b] rounded-2xl p-4 focus:ring-2 focus:ring-emerald-500 outline-none text-white font-bold">
                      {symbols.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {symbol === 'OTHER' && (
                      <input type="text" required placeholder="SYMBOL" value={customSymbol} onChange={(e) => setCustomSymbol(e.target.value)} className="w-full bg-[#0a0f1d] border border-[#1e293b] rounded-2xl p-4 focus:ring-2 focus:ring-emerald-500 outline-none text-white font-bold uppercase" />
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Action</label>
                  <div className="flex bg-[#0a0f1d] p-1 rounded-2xl border border-[#1e293b]">
                    <button type="button" onClick={() => setSide(TradeSide.LONG)} className={`flex-1 py-3 rounded-xl font-black text-sm transition-all ${side === TradeSide.LONG ? 'bg-emerald-500 text-slate-900 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Long</button>
                    <button type="button" onClick={() => setSide(TradeSide.SHORT)} className={`flex-1 py-3 rounded-xl font-black text-sm transition-all ${side === TradeSide.SHORT ? 'bg-red-500 text-slate-900 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Short</button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Lot Size / Qty</label>
                  <input type="number" required value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-full bg-[#0a0f1d] border border-[#1e293b] rounded-2xl p-4 focus:ring-2 focus:ring-emerald-500 outline-none text-white font-mono font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Brokerage (₹)</label>
                  <input type="number" step="0.01" value={fees} onChange={(e) => setFees(e.target.value)} className="w-full bg-[#0a0f1d] border border-[#1e293b] rounded-2xl p-4 focus:ring-2 focus:ring-emerald-500 outline-none text-white font-mono font-bold" />
                </div>
              </div>

              {type === TradeType.OPTION && (
                <div className="bg-[#0a0f1d] p-6 rounded-3xl border border-emerald-500/20 grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-[8px] font-black text-emerald-500/50 uppercase tracking-widest">Strike</label>
                    <input type="number" step="0.5" value={strike} onChange={(e) => setStrike(e.target.value)} className="w-full bg-[#070a13] border border-[#1e293b] rounded-xl p-3 text-sm text-white font-mono" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[8px] font-black text-emerald-500/50 uppercase tracking-widest">Expiry</label>
                    <input type="date" value={expiration} onChange={(e) => setExpiration(e.target.value)} className="w-full bg-[#070a13] border border-[#1e293b] rounded-xl p-3 text-sm text-white" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[8px] font-black text-emerald-500/50 uppercase tracking-widest">Type</label>
                    <select value={optionType} onChange={(e) => setOptionType(e.target.value as OptionType)} className="w-full bg-[#070a13] border border-[#1e293b] rounded-xl p-3 text-sm text-white font-bold">
                      <option value={OptionType.CALL}>CE</option>
                      <option value={OptionType.PUT}>PE</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Entry Price (₹)</label>
                  <input type="number" step="0.01" required value={entryPrice} onChange={(e) => setEntryPrice(e.target.value)} className="w-full bg-[#0a0f1d] border border-emerald-500/30 rounded-2xl p-4 focus:ring-2 focus:ring-emerald-500 outline-none text-white font-mono font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Entry Date</label>
                  <input type="datetime-local" required value={entryDate} onChange={(e) => setEntryDate(e.target.value)} className="w-full bg-[#0a0f1d] border border-emerald-500/30 rounded-2xl p-4 text-xs text-white" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#0a0f1d]/40 p-6 rounded-3xl border border-[#1e293b]">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Exit Price (₹) - Optional</label>
                  <input type="number" step="0.01" placeholder="Keep empty for OPEN" value={exitPrice} onChange={(e) => setExitPrice(e.target.value)} className="w-full bg-[#0a0f1d] border border-[#1e293b] rounded-2xl p-4 focus:ring-2 focus:ring-emerald-500 outline-none text-white font-mono font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Exit Date</label>
                  <input type="datetime-local" value={exitDate} onChange={(e) => setExitDate(e.target.value)} className="w-full bg-[#0a0f1d] border border-[#1e293b] rounded-2xl p-4 text-xs text-white" />
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-8 animate-in slide-in-from-right duration-300">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Mindset Impulse</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {EMOTIONS.map(e => (
                    <button key={e} type="button" onClick={() => handleToggle(selectedEmotions, setSelectedEmotions, e)} className={`py-3 px-2 rounded-xl text-[10px] font-black uppercase tracking-tighter border transition-all ${selectedEmotions.includes(e) ? 'bg-blue-500 border-blue-400 text-slate-900 shadow-lg' : 'bg-[#0a0f1d] border-[#1e293b] text-slate-500'}`}>{e}</button>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Discipline Leaks</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {MISTAKES.map(m => (
                    <button key={m} type="button" onClick={() => handleToggle(selectedMistakes, setSelectedMistakes, m)} className={`py-3 px-2 rounded-xl text-[10px] font-black uppercase tracking-tighter border transition-all ${selectedMistakes.includes(m) ? 'bg-red-500 border-red-400 text-slate-900 shadow-lg' : 'bg-[#0a0f1d] border-[#1e293b] text-slate-500'}`}>{m}</button>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Setup Logic</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {STRATEGIES.map(s => (
                    <button key={s} type="button" onClick={() => handleToggle(selectedStrategies, setSelectedStrategies, s)} className={`py-3 px-2 rounded-xl text-[10px] font-black uppercase tracking-tighter border transition-all ${selectedStrategies.includes(s) ? 'bg-emerald-500 border-emerald-400 text-slate-900 shadow-lg' : 'bg-[#0a0f1d] border-[#1e293b] text-slate-500'}`}>{s}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-8 animate-in slide-in-from-right duration-300">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Thesis & Analysis</label>
                <textarea rows={6} value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full bg-[#0a0f1d] border border-[#1e293b] rounded-3xl p-6 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-200 leading-relaxed text-sm" placeholder="Post-execution analysis. What did you see on the tape?" />
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Evidence Vault ({attachments.length})</label>
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {attachments.map(att => (
                      <div key={att.id} className="relative aspect-square bg-[#0a0f1d] border border-[#1e293b] rounded-2xl overflow-hidden group">
                        <img src={att.url} alt={att.name} className="w-full h-full object-cover" />
                        <button type="button" onClick={() => removeAttachment(att.id)} className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                      </div>
                    ))}
                    <button 
                      type="button" 
                      onClick={() => fileInputRef.current?.click()} 
                      disabled={isUploading || isSubmitting}
                      className="aspect-square border-2 border-dashed border-[#1e293b] rounded-2xl flex flex-col items-center justify-center text-slate-600 hover:border-emerald-500 hover:text-emerald-500 transition-all"
                    >
                      {isUploading ? (
                        <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <svg className="w-8 h-8 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                      )}
                      <span className="text-[9px] font-black uppercase tracking-widest mt-1">{isUploading ? 'Syncing...' : 'Evidence'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>

      <div className="p-6 bg-[#0a0f1d] border-t border-[#1e293b] flex gap-4">
        {currentStep > 1 && <button type="button" onClick={prevStep} className="flex-1 bg-[#111827] hover:bg-[#1e293b] text-slate-300 font-black py-4 rounded-2xl border border-[#1e293b]" disabled={isSubmitting}>Back</button>}
        {currentStep < 3 ? (
          <button type="button" onClick={nextStep} className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black py-4 rounded-2xl shadow-lg" disabled={isSubmitting}>Continue</button>
        ) : (
          <button 
            type="button" 
            onClick={handleSubmit} 
            disabled={isSubmitting || isUploading}
            className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black py-4 rounded-2xl shadow-lg flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {isSubmitting ? (
              <><div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div> SYNCING...</>
            ) : (
              initialTrade ? 'RE-SYNC ENTRY' : 'COMMIT TO CLOUD'
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default TradeEntryForm;
