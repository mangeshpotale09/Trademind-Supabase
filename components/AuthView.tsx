
import React, { useState } from 'react';
import { User, UserRole, UserStatus } from '../types';
import { registerUser, validateLogin, resetUserPassword } from '../services/storageService';

interface AuthViewProps {
  onAuthComplete: (user: User) => void;
}

const TERMS_LIST = [
  "Risk Warning: Trading involves significant risk of loss. Capital is at risk.",
  "No Financial Advice: TradeMind provides analytical tools, not professional financial advice.",
  "Data Responsibility: You are solely responsible for the accuracy of your trade logs.",
  "AI Analysis: Gemini AI reviews are for educational purposes and pattern recognition only.",
  "Subscription Model: Access is granted only after payment verification by the administrator.",
  "Refund Policy: All digital subscription payments are final and non-refundable.",
  "Account Integrity: One terminal identity per user. Shared access is strictly prohibited.",
  "Privacy Policy: We use Supabase for data vaulting; your data is protected by industry standards.",
  "System Availability: We aim for maximum uptime but do not guarantee uninterrupted access.",
  "Prohibited Use: No reverse engineering, automated scraping, or misuse of the Gemini API.",
  "Administrative Control: The Admin (Mangesh) reserves the right to revoke access for violations.",
  "Referral Policy: Fraudulent use of referral codes will result in permanent account termination.",
  "Intellectual Property: TradeMind AI platform and logic are proprietary properties.",
  "Liability Limitation: TradeMind AI is not liable for any trading losses incurred.",
  "Verification Timeframe: Manual proof verification may take between 2 to 24 business hours.",
  "Amendments: Terms and Conditions may be updated with notice provided within the app.",
  "Binding Agreement: By registering and paying, you agree to all 17 terms listed herein."
];

const AuthView: React.FC<AuthViewProps> = ({ onAuthComplete }) => {
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER' | 'FORGOT'>('LOGIN');
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showTermsModal, setShowTermsModal] = useState(false);

  // Constants
  const ADMIN_EMAIL = 'mangeshpotale09@gmail.com';
  const isActualAdminAttempt = isAdminMode || email.toLowerCase().trim() === ADMIN_EMAIL;

  const validateInputs = (): boolean => {
    if (!email.trim()) {
      setErrorMessage("Terminal ID (Email) is required.");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMessage(`Email address "${email}" is invalid.`);
      return false;
    }
    if (mode !== 'FORGOT' && password.length < 6) {
      setErrorMessage("Passphrase must be at least 6 characters.");
      return false;
    }
    if (mode === 'REGISTER' && !name.trim()) {
      setErrorMessage("Identity Name is required for registration.");
      return false;
    }
    if (mode === 'REGISTER' && !termsAccepted) {
      setErrorMessage("Please accept the 17 Terms and Conditions to proceed.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!validateInputs()) return;

    setIsSubmitting(true);
    
    try {
      const normalizedEmail = email.toLowerCase().trim();

      if (mode === 'REGISTER') {
        const newUser = await registerUser({ email: normalizedEmail, password, name, mobile });
        if (newUser) {
          onAuthComplete(newUser);
        }
      } else if (mode === 'LOGIN') {
        const user = await validateLogin(normalizedEmail, password);
        if (user) {
          if (isActualAdminAttempt && user.role !== UserRole.ADMIN) {
             setErrorMessage("ROOT_ACCESS_PENDING: Identity verified but role not elevated.");
             return;
          }
          onAuthComplete(user);
        }
      } else if (mode === 'FORGOT') {
        const success = await resetUserPassword(normalizedEmail, mobile, newPassword);
        if (success) {
          alert('Logic Reset issued. Use your new passphrase to login.');
          setMode('LOGIN');
          setPassword('');
        } else {
          setErrorMessage('Verification Error: No profile found matching these credentials.');
        }
      }
    } catch (err: any) {
      console.error("Auth Exception:", err);
      setErrorMessage(err.message || 'An unexpected logic error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleAdmin = () => {
    setIsAdminMode(!isAdminMode);
    setErrorMessage(null);
    if (!isAdminMode) {
      setEmail(ADMIN_EMAIL);
    } else {
      setEmail('');
    }
  };

  return (
    <div className="min-h-screen bg-[#070a13] flex flex-col items-center p-6 md:p-12 relative overflow-x-hidden overflow-y-auto no-scrollbar pb-32">
      <div className={`absolute top-[-10%] left-[-10%] w-[60%] h-[60%] ${isActualAdminAttempt ? 'bg-purple-600/20' : 'bg-emerald-600/10'} rounded-full blur-[140px] pointer-events-none transition-all duration-1000`}></div>
      <div className={`absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] ${isActualAdminAttempt ? 'bg-indigo-600/20' : 'bg-emerald-500/5'} rounded-full blur-[140px] pointer-events-none transition-all duration-1000`}></div>

      <div className="w-full max-w-lg relative z-10 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-700 mt-8">
        
        <div className="flex flex-col items-center text-center mb-10">
          <div className={`w-24 h-24 rounded-[3rem] flex items-center justify-center font-black text-4xl shadow-2xl transition-all duration-700 ${isActualAdminAttempt ? 'bg-purple-600 text-white shadow-purple-500/30' : mode === 'FORGOT' ? 'bg-blue-600 text-white shadow-blue-500/30' : 'bg-emerald-500 text-slate-900 shadow-emerald-500/30'}`}>
            {isActualAdminAttempt ? '🛡️' : mode === 'FORGOT' ? '?' : 'T'}
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter mt-8">
            TradeMind <span className={isActualAdminAttempt ? 'text-purple-400' : mode === 'FORGOT' ? 'text-blue-400' : 'text-emerald-500'}>{isActualAdminAttempt ? 'Root' : mode === 'FORGOT' ? 'Reset' : 'AI'}</span>
          </h1>
        </div>

        <div className={`w-full p-8 md:p-12 rounded-[4rem] border shadow-2xl transition-all duration-500 ${isActualAdminAttempt ? 'bg-[#120b24]/90 border-purple-500/30 shadow-purple-900/10' : mode === 'FORGOT' ? 'bg-[#0a1226]/90 border-blue-500/30 shadow-blue-900/10' : 'bg-[#0e1421]/90 border-[#1e293b]'}`}>
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-black text-white mb-3 tracking-tight">
              {isActualAdminAttempt ? 'Root Authorization' : mode === 'REGISTER' ? 'Initialize Identity' : mode === 'FORGOT' ? 'Recover Logic' : 'Welcome Back'}
            </h2>
          </div>
          
          {errorMessage && (
            <div className="mb-6 p-4 rounded-2xl border bg-red-500/10 border-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-widest text-center animate-in shake">
              {errorMessage}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {mode === 'REGISTER' && (
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Identity Name</label>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-[#070a13] border border-[#1e293b] rounded-2xl p-4 md:p-5 focus:ring-2 focus:ring-emerald-500 outline-none text-white font-bold transition-all text-sm" placeholder="Trader Name" />
              </div>
            )}
            
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Terminal ID (Email)</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={`w-full bg-[#070a13] border rounded-2xl p-4 md:p-5 focus:ring-2 outline-none text-white font-bold transition-all text-sm ${isActualAdminAttempt ? 'border-purple-500/40 focus:ring-purple-500' : 'border-[#1e293b] focus:ring-emerald-500'}`} placeholder="trader@mind.ai" />
            </div>

            {mode !== 'FORGOT' && (
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Logic Passphrase</label>
                  {mode === 'LOGIN' && (
                    <button type="button" onClick={() => setMode('FORGOT')} className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Forgot?</button>
                  )}
                </div>
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className={`w-full bg-[#070a13] border rounded-2xl p-4 md:p-5 focus:ring-2 outline-none text-white font-bold transition-all text-sm ${isActualAdminAttempt ? 'border-purple-500/40 focus:ring-purple-500' : 'border-[#1e293b] focus:ring-emerald-500'}`} placeholder="••••••••" />
              </div>
            )}

            {mode === 'REGISTER' && (
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-[#070a13] rounded-2xl border border-[#1e293b]">
                  <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} className="w-5 h-5 mt-0.5 rounded border-[#1e293b] bg-slate-900 text-emerald-500 accent-emerald-500 cursor-pointer" required />
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-tight leading-relaxed">
                    I accept all <button type="button" onClick={() => setShowTermsModal(true)} className="text-emerald-500 underline">17 Terms and Conditions</button> regarding financial risk and system audit.
                  </label>
                </div>
              </div>
            )}
            
            <button type="submit" disabled={isSubmitting} className={`w-full font-black py-5 rounded-3xl transition-all shadow-xl flex items-center justify-center gap-4 text-xs uppercase tracking-[0.25em] mt-4 disabled:opacity-50 ${isActualAdminAttempt ? 'bg-purple-600 hover:bg-purple-500 text-white' : mode === 'FORGOT' ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-emerald-500 hover:bg-emerald-400 text-slate-900'}`}>
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>{isActualAdminAttempt ? 'Authorize Root' : mode === 'REGISTER' ? 'Register' : 'Enter Terminal'}</>
              )}
            </button>
          </form>

          <div className="mt-10 pt-10 border-t border-[#1e293b] flex flex-col gap-4">
            <button onClick={() => { setMode(mode === 'REGISTER' ? 'LOGIN' : 'REGISTER'); setErrorMessage(null); }} className="w-full py-5 rounded-3xl border border-[#1e293b] text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all">
              {mode === 'REGISTER' ? 'Already have an Identity? Login' : 'New to TradeMind? Create Identity'}
            </button>
          </div>
        </div>
      </div>

      {/* 17 Terms Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/95 backdrop-blur-md">
          <div className="w-full max-w-2xl bg-[#0e1421] rounded-[3rem] border border-[#1e293b] overflow-hidden shadow-2xl animate-in zoom-in">
            <div className="p-8 border-b border-[#1e293b] flex justify-between items-center bg-[#0a0f1d]/50">
               <h3 className="text-xl font-black text-white uppercase tracking-widest">17 Terms & Conditions</h3>
               <button onClick={() => setShowTermsModal(false)} className="text-slate-500 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
               </button>
            </div>
            <div className="p-8 max-h-[60vh] overflow-y-auto space-y-4 no-scrollbar">
              {TERMS_LIST.map((term, idx) => (
                <div key={idx} className="flex gap-4 p-4 bg-[#0a0f1d] rounded-2xl border border-[#1e293b]/50">
                   <span className="text-emerald-500 font-black text-xs">{idx + 1}</span>
                   <p className="text-slate-300 text-xs font-medium leading-relaxed">{term}</p>
                </div>
              ))}
            </div>
            <div className="p-8 border-t border-[#1e293b] bg-[#0a0f1d]/50">
               <button onClick={() => { setTermsAccepted(true); setShowTermsModal(false); }} className="w-full bg-emerald-500 text-slate-900 font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest">Understand & Accept All Terms</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthView;
