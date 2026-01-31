
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
  const [agreedToFinancialTerms, setAgreedToFinancialTerms] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const plans = [
    { type: PlanType.MONTHLY, price: 299, label: 'Monthly Pass', desc: 'Full AI access for 30 days' },
    { type: PlanType.SIX_MONTHS, price: 599, label: 'Pro (6 Months)', desc: 'Advanced analytics & deep logs' },
    { type: PlanType.ANNUAL, price: 999, label: 'Elite (Annual)', desc: 'Unlimited AI coaching & archives' },
  ];

  const currentPrice = plans.find(p => p.type === selectedPlan)?.price || 0;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      setFile(files[0]);
      setPreviewUrl(URL.createObjectURL(files[0]));
      setError(null);
    }
  };

  const handleSubmit = async () => {
    if (!agreedToFinancialTerms) {
      setError("Please confirm compliance with the 17 Terms and Conditions.");
      return;
    }
    if (!file) {
      setError("Please upload your payment screenshot to proceed.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await submitPaymentProof(user.id, selectedPlan, file);
      onPaymentSubmitted();
    } catch (err: any) {
      setError(err.message || 'Verification submission failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070a13] flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-6xl bg-[#0e1421] rounded-[3rem] border border-[#1e293b] shadow-2xl overflow-hidden flex flex-col lg:flex-row animate-in zoom-in duration-500">
        
        {/* Left: Plan Selection & Terms Summary */}
        <div className="flex-1 bg-[#0a0f1d] p-8 md:p-12 border-r border-[#1e293b] space-y-8 max-h-[90vh] overflow-y-auto no-scrollbar">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tighter">Authorize <span className="text-emerald-500">Node</span></h1>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-2">Initialize Your Trading Node Access</p>
          </div>

          <div className="space-y-4">
            {plans.map(plan => (
              <button
                key={plan.type}
                onClick={() => setSelectedPlan(plan.type)}
                className={`w-full p-6 rounded-3xl border text-left transition-all relative overflow-hidden group ${
                  selectedPlan === plan.type 
                    ? 'bg-emerald-500/10 border-emerald-500 shadow-xl' 
                    : 'bg-[#111827] border-[#1e293b] hover:border-slate-500'
                }`}
              >
                <div className="flex justify-between items-center relative z-10">
                  <div>
                    <h4 className={`text-[10px] font-black uppercase tracking-widest ${selectedPlan === plan.type ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {plan.label}
                    </h4>
                    <p className="text-2xl font-black text-white mt-1">₹{plan.price}</p>
                    <p className="text-[10px] text-slate-500 font-medium mt-1">{plan.desc}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="p-6 bg-red-500/5 rounded-2xl border border-red-500/20 space-y-4">
            <h5 className="text-[10px] font-black text-red-400 uppercase tracking-widest">Review 17 Terms Summary</h5>
            <ul className="text-[10px] text-slate-400 space-y-2 font-medium">
              <li className="flex gap-2">
                <span className="text-red-500 font-black">1-4:</span>
                Trading involves absolute risk; AI and platform are for educational auditing only.
              </li>
              <li className="flex gap-2">
                <span className="text-red-500 font-black">5-10:</span>
                Subscriptions are non-refundable; no scraping or reverse engineering allowed.
              </li>
              <li className="flex gap-2">
                <span className="text-red-500 font-black">11-17:</span>
                Admin holds full audit authority; verification takes 2-24 hours.
              </li>
            </ul>
            <label className="flex items-center gap-3 p-3 bg-red-500/10 rounded-xl cursor-pointer">
              <input type="checkbox" checked={agreedToFinancialTerms} onChange={(e) => setAgreedToFinancialTerms(e.target.checked)} className="accent-red-500" />
              <span className="text-[9px] font-black uppercase tracking-widest text-white">I confirm absolute agreement to all 17 terms</span>
            </label>
          </div>
        </div>

        {/* Right: Payment & Upload */}
        <div className="flex-1 p-8 md:p-12 flex flex-col justify-center space-y-8">
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-black text-white">Execute Payment</h3>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Authorized Merchant: Mangesh Potale</p>
          </div>

          <div className="flex flex-col items-center gap-6">
            <div className="relative p-3 bg-white rounded-[2rem] shadow-2xl">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=mangeshpotale09@okaxis&pn=Mangesh%20Potale&am=${currentPrice}&cu=INR`} 
                alt="UPI QR" 
                className="w-48 h-48"
              />
            </div>
            
            <div className="text-center">
              <p className="text-slate-400 text-xs font-bold font-mono">mangeshpotale09@okaxis</p>
              <p className="text-slate-600 text-[9px] font-black uppercase tracking-widest mt-1">Verified UPI Node</p>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Payment Evidence (Screenshot)</label>
            {previewUrl ? (
              <div className="relative w-full aspect-video bg-[#0a0f1d] rounded-3xl border border-emerald-500/20 overflow-hidden group">
                <img src={previewUrl} alt="Proof" className="w-full h-full object-cover" />
                <button onClick={() => { setFile(null); setPreviewUrl(null); }} className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-full shadow-lg">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>
            ) : (
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-16 border-2 border-dashed border-[#1e293b] rounded-3xl flex flex-col items-center justify-center text-slate-500 hover:border-emerald-500 hover:text-emerald-500 transition-all bg-[#0a0f1d]"
              >
                <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Upload Transaction Proof</span>
              </button>
            )}
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-[10px] font-black text-red-400 uppercase tracking-widest text-center animate-in shake">
              {error}
            </div>
          )}

          <button 
            onClick={handleSubmit}
            disabled={loading || !file || !agreedToFinancialTerms}
            className={`w-full font-black py-5 rounded-3xl shadow-2xl transition-all text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-4 ${
              loading || !file || !agreedToFinancialTerms ? 'bg-[#111827] text-slate-600 border border-[#1e293b]' : 'bg-emerald-500 hover:bg-emerald-400 text-slate-900'
            }`}
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>Authorize Subscription</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentView;
