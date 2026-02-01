
import React, { useState, useRef } from 'react';
import { User, PlanType } from '../types';
import { submitPaymentProof } from '../services/storageService';

interface PaymentViewProps {
  user: User;
  onPaymentSubmitted: () => void;
}

const PaymentView: React.FC<PaymentViewProps> = ({ user, onPaymentSubmitted }) => {
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanType>(PlanType.ANNUAL);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const plans = [
    { type: PlanType.MONTHLY, price: 299, label: 'Standard Monthly' },
    { type: PlanType.SIX_MONTHS, price: 599, label: '6-Month Terminal' },
    { type: PlanType.ANNUAL, price: 999, label: 'Institutional Annual (Best Value)' },
  ];

  const currentPlan = plans.find(p => p.type === selectedPlan)!;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      setFile(files[0]);
      setPreviewUrl(URL.createObjectURL(files[0]));
      setError(null);
    }
  };

  const copyVPA = () => {
    navigator.clipboard.writeText('mangeshpotale09@okaxis');
    alert('VPA copied to clipboard');
  };

  const handleSubmit = async () => {
    if (!file) {
      setError("Evidence required: Please attach a screenshot of your successful payment.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await submitPaymentProof(user.id, selectedPlan, file);
      onPaymentSubmitted();
    } catch (err: any) {
      setError(err.message || 'Transmission error. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070a13] flex flex-col items-center justify-center p-6 relative overflow-y-auto no-scrollbar selection:bg-emerald-500/30">
      <div className="fixed top-0 left-0 w-full h-1 bg-emerald-500/20">
        <div className="h-full bg-emerald-500 w-1/4 animate-pulse"></div>
      </div>

      <div className="w-full max-w-5xl bg-[#0e1421] rounded-[3.5rem] border border-[#1e293b] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-700 flex flex-col lg:flex-row my-10 relative">
        <div className="absolute inset-0 bg-emerald-500/[0.01] pointer-events-none"></div>
        
        {/* Selection Column */}
        <div className="lg:w-1/2 p-10 lg:p-14 bg-[#0a0f1d]/50 border-b lg:border-b-0 lg:border-r border-[#1e293b] space-y-10 relative">
          <div>
            <div className="w-14 h-14 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center mb-6 border border-emerald-500/20 shadow-lg">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
            </div>
            <h2 className="text-4xl font-black text-white tracking-tighter mb-4 leading-none">Activate Your <br/> Journaling Node</h2>
            <p className="text-slate-500 text-xs font-medium tracking-tight leading-relaxed">Website access is locked for unverified nodes. Complete the settlement below to request manual authorization.</p>
          </div>

          <div className="space-y-3">
            {plans.map(plan => (
              <button
                key={plan.type}
                onClick={() => setSelectedPlan(plan.type)}
                className={`w-full p-6 rounded-[2rem] border text-left transition-all group relative overflow-hidden ${
                  selectedPlan === plan.type 
                    ? 'bg-emerald-500/10 border-emerald-500 ring-4 ring-emerald-500/5' 
                    : 'bg-[#111827] border-[#1e293b] opacity-60 hover:opacity-100'
                }`}
              >
                <div className="flex justify-between items-center relative z-10">
                  <div>
                    <h4 className={`text-[9px] font-black uppercase tracking-widest mb-1 ${selectedPlan === plan.type ? 'text-emerald-400' : 'text-slate-500'}`}>{plan.label}</h4>
                    <p className="text-2xl font-black text-white">₹{plan.price}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-2xl border-2 flex items-center justify-center transition-all ${selectedPlan === plan.type ? 'bg-emerald-500 border-emerald-500 text-slate-900 shadow-xl' : 'border-[#1e293b] text-slate-700'}`}>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="p-6 bg-[#070a13] rounded-3xl border border-[#1e293b] flex items-center gap-5">
             <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
             </div>
             <div>
               <p className="text-[10px] font-black text-white uppercase tracking-widest mb-1">Audit Policy</p>
               <p className="text-[9px] text-slate-600 font-bold leading-tight">Identity is manually verified by our risk desk within 60 minutes of submission.</p>
             </div>
          </div>
        </div>

        {/* QR Column */}
        <div className="lg:w-1/2 p-10 lg:p-14 flex flex-col items-center justify-center space-y-10 bg-[#0e1421]">
          <div className="text-center">
            <h3 className="text-2xl font-black text-white tracking-tight mb-2">Scan QR to Pay</h3>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em]">UPI ID: mangeshpotale09@okaxis</p>
          </div>

          <div className="relative group">
            <div className="absolute -inset-8 bg-emerald-500/10 rounded-full blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="w-60 h-60 bg-white p-4 rounded-[3rem] shadow-2xl relative z-10">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=upi://pay?pa=mangeshpotale09@okaxis&pn=Mangesh%20Potale&am=${currentPlan.price}&cu=INR`} 
                alt="UPI Settlement QR" 
                className="w-full h-full"
              />
            </div>
          </div>

          <div className="w-full space-y-6">
            <div className="flex flex-col items-center gap-2">
              <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Manual Entry VPA</span>
              <button onClick={copyVPA} className="bg-[#0a0f1d] px-6 py-2.5 rounded-xl border border-[#1e293b] text-sm font-mono font-black text-white hover:border-emerald-500/50 transition-colors flex items-center gap-2">
                mangeshpotale09@okaxis
                <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
              </button>
            </div>

            <div className="space-y-4">
              {previewUrl ? (
                <div className="relative w-full aspect-video bg-[#0a0f1d] rounded-3xl border border-emerald-500/20 overflow-hidden shadow-xl group">
                  <img src={previewUrl} alt="Settlement Proof" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button onClick={() => { setFile(null); setPreviewUrl(null); }} className="px-6 py-2 bg-red-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl">Remove Evidence</button>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-12 border-2 border-dashed border-[#1e293b] rounded-[2.5rem] flex flex-col items-center justify-center text-slate-500 hover:border-emerald-500 hover:text-emerald-500 transition-all bg-[#0a0f1d]/30 group"
                >
                  <svg className="w-10 h-10 mb-2 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                  <span className="text-[10px] font-black uppercase tracking-widest">Upload Payment Screenshot</span>
                </button>
              )}
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
            </div>

            {error && <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-[9px] font-black text-red-400 uppercase tracking-widest text-center">{error}</div>}

            <button 
              onClick={handleSubmit}
              disabled={loading || !file}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black py-5 rounded-[2.5rem] shadow-xl transition-all text-xs uppercase tracking-[0.2em] disabled:opacity-30 flex items-center justify-center gap-3"
            >
              {loading ? <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div> : (
                <>
                  Request Activation
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                </>
              )}
            </button>
          </div>
          
          <div className="pt-6 border-t border-[#1e293b] w-full text-center">
             <p className="text-[8px] text-slate-700 font-black uppercase tracking-[0.4em]">Registry Ref: {user.displayId}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentView;
