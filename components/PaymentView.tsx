
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
      alert("Payment submitted successfully! An admin will review your proof shortly.");
      onPaymentSubmitted();
    } catch (err: any) {
      console.error("Payment Submission Error:", err);
      const msg = err.message || 'An unexpected error occurred.';
      
      if (msg.includes('RECURSION') || msg.includes('recursion')) {
        setError("DATABASE_RLS_ERROR: Infinite recursion detected in your Supabase policies. ACTION REQUIRED: Copy the content of 'schema.sql' and run it in the Supabase SQL Editor to reset your permissions safely.");
      } else if (msg.includes('Bucket')) {
        setError("STORAGE_ERROR: Bucket 'payment-proofs' missing. Ensure buckets are created in Supabase.");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070a13] flex items-center justify-center p-6 pb-24">
      <div className="w-full max-w-4xl bg-[#0e1421] rounded-[3rem] border border-[#1e293b] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-700">
        <div className="flex flex-col md:flex-row h-full">
          
          {/* Plan Selection */}
          <div className="md:w-1/2 bg-[#0a0f1d] p-8 md:p-12 border-r border-[#1e293b] space-y-8">
            <div>
              <h2 className="text-3xl font-black text-white tracking-tighter mb-2">Select Your Plan</h2>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Authorize Terminal Access</p>
            </div>

            <div className="space-y-3">
              {plans.map(plan => (
                <button
                  key={plan.type}
                  onClick={() => setSelectedPlan(plan.type)}
                  className={`w-full p-6 rounded-2xl border text-left transition-all group ${
                    selectedPlan === plan.type 
                      ? 'bg-emerald-500/10 border-emerald-500 shadow-lg' 
                      : 'bg-[#111827] border-[#1e293b] hover:border-slate-500'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className={`text-sm font-black uppercase tracking-widest ${selectedPlan === plan.type ? 'text-emerald-400' : 'text-slate-400'}`}>
                        {plan.label}
                      </h4>
                      <p className="text-2xl font-black text-white mt-1">₹{plan.price}</p>
                    </div>
                    {selectedPlan === plan.type && (
                      <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-slate-900" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>

            <div className="p-5 bg-blue-500/5 rounded-2xl border border-blue-500/10">
              <p className="text-[10px] text-blue-400 font-bold leading-relaxed uppercase tracking-tight">
                Institutional-grade security. All payments are verified by our root administration team.
              </p>
            </div>
          </div>

          {/* QR and Upload */}
          <div className="md:w-1/2 p-8 md:p-12 flex flex-col items-center justify-center space-y-8">
            <div className="text-center">
              <h3 className="text-xl font-black text-white mb-2">Scan & Pay</h3>
              <p className="text-slate-500 text-xs font-medium">Use any UPI app (GPay, PhonePe, Paytm)</p>
            </div>

            <div className="w-48 h-48 bg-white p-2 rounded-2xl shadow-xl shadow-white/5 relative group">
              <img 
                src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=mangeshpotale09@okaxis&pn=Mangesh%20Potale&am=0&cu=INR" 
                alt="Payment QR" 
                className="w-full h-full"
              />
              <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                 <span className="text-[9px] font-black text-white uppercase tracking-widest bg-slate-900 px-3 py-1 rounded-full">Merchant Verified</span>
              </div>
            </div>

            <div className="w-full space-y-4">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Upload Payment Screenshot</label>
              
              {previewUrl ? (
                <div className="relative w-full aspect-video bg-[#0a0f1d] rounded-2xl border border-[#1e293b] overflow-hidden group">
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                  <button 
                    onClick={() => { setFile(null); setPreviewUrl(null); }}
                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-10 border-2 border-dashed border-[#1e293b] rounded-2xl flex flex-col items-center justify-center text-slate-500 hover:border-emerald-500 hover:text-emerald-500 transition-all bg-[#0a0f1d]/50"
                >
                  <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                  <span className="text-[10px] font-black uppercase tracking-widest">Select Screenshot</span>
                </button>
              )}
              
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
            </div>

            {error && (
              <div className="w-full p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-[10px] font-black text-red-400 uppercase tracking-widest leading-relaxed animate-in shake duration-300">
                {error}
              </div>
            )}

            <button 
              onClick={handleSubmit}
              disabled={loading || !file}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black py-5 rounded-2xl shadow-xl transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>Submit Verification Request</>
              )}
            </button>

            <div className="flex flex-col items-center gap-2">
              <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Merchant ID: mangeshpotale09@okaxis</p>
              <div className="flex gap-4 opacity-30 grayscale">
                <img src="https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo-vector.svg" className="h-4" alt="UPI" />
                <img src="https://upload.wikimedia.org/wikipedia/commons/e/e4/Google_Pay_Logo.svg" className="h-4" alt="GPay" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentView;
