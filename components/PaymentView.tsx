
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
    { type: PlanType.MONTHLY, price: 299, label: 'Monthly' },
    { type: PlanType.SIX_MONTHS, price: 599, label: '6 Months' },
    { type: PlanType.ANNUAL, price: 999, label: 'Annual (Best Value)' },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      setFile(files[0]);
      setPreviewUrl(URL.createObjectURL(files[0]));
      setError(null);
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      setError("Please upload your payment screenshot.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await submitPaymentProof(user.id, selectedPlan, file);
      alert("Payment proof received. Verification usually takes 1-2 hours.");
      onPaymentSubmitted();
    } catch (err: any) {
      setError(err.message || 'Submission failed. Please try again or contact support.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070a13] flex items-center justify-center p-6 pb-24 relative">
      {/* Permanent Floating Support */}
      <div className="fixed top-6 right-6 z-[100]">
        <a href="https://wa.me/91XXXXXXXXXX" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-4 py-2 bg-[#25D366]/10 border border-[#25D366]/20 rounded-full text-[#25D366] font-black text-[9px] uppercase tracking-widest hover:bg-[#25D366]/20 transition-all">
          <div className="w-2 h-2 rounded-full bg-[#25D366] animate-pulse"></div>
          Live Support
        </a>
      </div>

      <div className="w-full max-w-4xl bg-[#0e1421] rounded-[3.5rem] border border-[#1e293b] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-700">
        <div className="flex flex-col md:flex-row min-h-[600px]">
          
          <div className="md:w-1/2 bg-[#0a0f1d] p-10 md:p-14 border-r border-[#1e293b] space-y-10">
            <div>
              <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center mb-6">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
              </div>
              <h2 className="text-3xl font-black text-white tracking-tighter mb-2">Membership Plan</h2>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Select tier to activate your terminal</p>
            </div>

            <div className="space-y-4">
              {plans.map(plan => (
                <button
                  key={plan.type}
                  onClick={() => setSelectedPlan(plan.type)}
                  className={`w-full p-6 rounded-[2rem] border text-left transition-all ${
                    selectedPlan === plan.type 
                      ? 'bg-emerald-500/10 border-emerald-500 ring-4 ring-emerald-500/5' 
                      : 'bg-[#111827] border-[#1e293b] opacity-60'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className={`text-[10px] font-black uppercase tracking-widest mb-1 ${selectedPlan === plan.type ? 'text-emerald-400' : 'text-slate-400'}`}>{plan.label}</h4>
                      <p className="text-2xl font-black text-white">₹{plan.price}</p>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedPlan === plan.type ? 'bg-emerald-500 border-emerald-500' : 'border-[#1e293b]'}`}>
                      {selectedPlan === plan.type && <svg className="w-4 h-4 text-slate-900" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="space-y-4 pt-4">
               <div className="flex items-center gap-3">
                 <div className="w-1 h-1 rounded-full bg-emerald-500"></div>
                 <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Instant AI Feature Access</span>
               </div>
               <div className="flex items-center gap-3">
                 <div className="w-1 h-1 rounded-full bg-emerald-500"></div>
                 <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Cloud Sync Recovery</span>
               </div>
            </div>
          </div>

          <div className="md:w-1/2 p-10 md:p-14 flex flex-col items-center justify-center space-y-10 bg-[#0e1421]">
            <div className="text-center">
              <h3 className="text-2xl font-black text-white tracking-tight mb-2">Merchant Payment</h3>
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em]">Scan QR via GPay, PhonePe or Paytm</p>
            </div>

            <div className="relative group">
              <div className="absolute -inset-4 bg-emerald-500/10 rounded-[2.5rem] blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="w-52 h-52 bg-white p-3 rounded-[2rem] shadow-2xl relative z-10">
                <img 
                  src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=upi://pay?pa=mangeshpotale09@okaxis&pn=Mangesh%20Potale&am=0&cu=INR" 
                  alt="UPI QR" 
                  className="w-full h-full"
                />
              </div>
            </div>

            <div className="w-full space-y-4">
              <div className="text-center space-y-1">
                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Merchant VPA</p>
                <p className="text-xs font-mono font-bold text-white bg-[#0a0f1d] px-4 py-2 rounded-xl border border-[#1e293b]">mangeshpotale09@okaxis</p>
              </div>

              {previewUrl ? (
                <div className="relative w-full aspect-video bg-[#0a0f1d] rounded-2xl border border-emerald-500/20 overflow-hidden group shadow-lg">
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  <button onClick={() => { setFile(null); setPreviewUrl(null); }} className="absolute top-3 right-3 p-2 bg-red-500 text-white rounded-xl shadow-xl transition-transform hover:scale-110">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-8 border-2 border-dashed border-[#1e293b] rounded-3xl flex flex-col items-center justify-center text-slate-500 hover:border-emerald-500 hover:text-emerald-500 transition-all bg-[#0a0f1d]/50 group"
                >
                  <svg className="w-8 h-8 mb-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                  <span className="text-[10px] font-black uppercase tracking-widest">Upload Proof</span>
                </button>
              )}
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
            </div>

            {error && <div className="w-full p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-[9px] font-black text-red-400 uppercase tracking-widest text-center">{error}</div>}

            <button 
              onClick={handleSubmit}
              disabled={loading || !file}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black py-5 rounded-2xl shadow-xl transition-all text-xs uppercase tracking-widest disabled:opacity-50"
            >
              {loading ? <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto"></div> : "Submit Verification Request"}
            </button>

            <div className="pt-4 border-t border-[#1e293b] w-full text-center">
               <p className="text-[8px] text-slate-600 font-black uppercase tracking-widest">Subject ID: {user.displayId}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentView;
