
import React, { useState } from 'react';
import { User, UserRole, UserStatus } from '../types';
import { registerUser, validateLogin, resetUserPassword } from '../services/storageService';

interface AuthViewProps {
  onAuthComplete: (user: User) => void;
}

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
      setErrorMessage("Please accept the terms to proceed.");
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
          // Security check for the admin UI state vs database role
          if (isActualAdminAttempt && user.role !== UserRole.ADMIN) {
             setErrorMessage("ROOT_ACCESS_PENDING: Identity verified but role not elevated. Please ensure you have run the latest schema.sql in your Supabase SQL Editor.");
             return;
          }
          onAuthComplete(user);
        }
      } else if (mode === 'FORGOT') {
        const success = await resetUserPassword(normalizedEmail, mobile, newPassword);
        if (success) {
          alert('Logic Reset command issued. If email confirmation is enabled, check your inbox. Otherwise, enter your new passphrase at the login screen.');
          setMode('LOGIN');
          setPassword('');
        } else {
          setErrorMessage('Verification Error: No profile found matching these credentials.');
        }
      }
    } catch (err: any) {
      console.error("Auth Exception:", err);
      let msg = err.message || 'An unexpected logic error occurred.';
      
      const lowMsg = msg.toLowerCase();
      if (lowMsg.includes("invalid login credentials") || err.status === 400 || err.status === 401) {
        setErrorMessage("ACCESS_DENIED: Invalid Email or Password. If you haven't created this account yet, switch to 'Create Identity' mode. Also ensure you have confirmed your email if required.");
      } else if (lowMsg.includes("already registered") || lowMsg.includes("user_already_exists") || err.status === 422) {
        setErrorMessage("IDENTITY_EXISTS: This email is already registered. Please use 'Login' mode.");
      } else if (lowMsg.includes("email not confirmed")) {
        setErrorMessage("VERIFICATION_REQUIRED: Please check your email inbox and confirm your account before logging in.");
      } else {
        setErrorMessage(msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleAdmin = () => {
    setIsAdminMode(!isAdminMode);
    setErrorMessage(null);
    if (!isAdminMode) {
      setEmail(ADMIN_EMAIL);
      // We don't force LOGIN mode here so user can REGISTER if it's the first time
    } else {
      setEmail('');
    }
  };

  const benefits = [
    { icon: "📈", title: "Execution Discipline", text: "Transform impulsive gambling into systematic, rule-based execution through rigorous post-trade logging." },
    { icon: "📊", title: "Edge Identification", text: "Pinpoint high-probability setups by isolating the strategies that generate your highest profit factors." },
    { icon: "🛡️", title: "Risk Mitigation", text: "Instantly detect capital-draining leaks like over-leveraging or recurring stop-loss violations." },
    { icon: "🤖", title: "AI Risk Coaching", text: "Leverage Gemini AI to audit your logic and receive actionable directives for immediate improvement." }
  ];

  return (
    <div className="min-h-screen bg-[#070a13] flex flex-col items-center p-6 md:p-12 relative overflow-x-hidden overflow-y-auto no-scrollbar pb-32">
      {/* Dynamic Background Blurs */}
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
          <p className="text-slate-500 text-[10px] mt-3 font-black uppercase tracking-[0.4em]">
            Institutional Performance Terminal
          </p>
        </div>

        <div className={`w-full p-8 md:p-12 rounded-[4rem] border shadow-2xl transition-all duration-500 ${isActualAdminAttempt ? 'bg-[#120b24]/90 border-purple-500/30 shadow-purple-900/10' : mode === 'FORGOT' ? 'bg-[#0a1226]/90 border-blue-500/30 shadow-blue-900/10' : 'bg-[#0e1421]/90 border-[#1e293b]'}`}>
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-black text-white mb-3 tracking-tight">
              {isActualAdminAttempt ? 'Root Authorization' : mode === 'REGISTER' ? 'Initialize Identity' : mode === 'FORGOT' ? 'Recover Logic' : 'Welcome Back'}
            </h2>
            <div className="flex items-center justify-center gap-2">
               <div className={`w-1.5 h-1.5 rounded-full ${isActualAdminAttempt ? 'bg-purple-500' : 'bg-emerald-500'} animate-pulse`}></div>
               <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest">{isActualAdminAttempt ? 'System Administrator Credential Required' : 'Secure Cloud Link Synchronized'}</p>
            </div>
          </div>
          
          {errorMessage && (
            <div className="mb-6 p-4 rounded-2xl border bg-red-500/10 border-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-widest text-center animate-in shake duration-300">
              {errorMessage}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {mode === 'REGISTER' && (
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Identity Name</label>
                <input 
                  type="text" 
                  required 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  className="w-full bg-[#070a13] border border-[#1e293b] rounded-2xl p-4 md:p-5 focus:ring-2 focus:ring-emerald-500 outline-none text-white font-bold transition-all text-sm" 
                  placeholder="John Doe" 
                />
              </div>
            )}
            
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Terminal ID (Email)</label>
              <input 
                type="email" 
                required 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                className={`w-full bg-[#070a13] border rounded-2xl p-4 md:p-5 focus:ring-2 outline-none text-white font-bold transition-all text-sm ${isActualAdminAttempt ? 'border-purple-500/40 focus:ring-purple-500' : 'border-[#1e293b] focus:ring-emerald-500'}`} 
                placeholder="trader@mind.ai" 
              />
            </div>

            {mode !== 'FORGOT' && (
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Logic Passphrase</label>
                  {mode === 'LOGIN' && (
                    <button type="button" onClick={() => setMode('FORGOT')} className="text-[9px] font-black text-blue-400 uppercase tracking-widest hover:underline">Forgot?</button>
                  )}
                </div>
                <input 
                  type="password" 
                  required 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  className={`w-full bg-[#070a13] border rounded-2xl p-4 md:p-5 focus:ring-2 outline-none text-white font-bold transition-all text-sm ${isActualAdminAttempt ? 'border-purple-500/40 focus:ring-purple-500' : 'border-[#1e293b] focus:ring-emerald-500'}`} 
                  placeholder="••••••••" 
                />
              </div>
            )}

            {mode === 'REGISTER' && (
              <div className="flex items-start gap-4 p-2 bg-[#070a13] rounded-2xl border border-[#1e293b]">
                <input 
                  type="checkbox" 
                  checked={termsAccepted} 
                  onChange={(e) => setTermsAccepted(e.target.checked)} 
                  className="w-5 h-5 mt-0.5 rounded border-[#1e293b] bg-slate-900 text-emerald-500 accent-emerald-500 cursor-pointer" 
                  required 
                />
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-tight leading-relaxed">
                  I accept the disciplinary terms and acknowledge that system performance is tied to journaling consistency.
                </label>
              </div>
            )}
            
            <button 
              type="submit" 
              disabled={isSubmitting} 
              className={`w-full font-black py-5 rounded-3xl transition-all shadow-xl flex items-center justify-center gap-4 text-xs uppercase tracking-[0.25em] mt-4 disabled:opacity-50 ${isActualAdminAttempt ? 'bg-purple-600 hover:bg-purple-500 text-white' : mode === 'FORGOT' ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-emerald-500 hover:bg-emerald-400 text-slate-900'}`}
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  {isActualAdminAttempt ? (mode === 'REGISTER' ? 'Initialize Admin' : 'Authorize Root Access') : mode === 'REGISTER' ? 'Initialize Identity' : 'Enter Terminal'}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                </>
              )}
            </button>
          </form>

          <div className="mt-10 pt-10 border-t border-[#1e293b] flex flex-col gap-4">
            <button 
              onClick={() => { setMode(mode === 'REGISTER' ? 'LOGIN' : 'REGISTER'); setErrorMessage(null); }} 
              className="w-full py-5 rounded-3xl border border-[#1e293b] text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-white/5 hover:text-white transition-all shadow-sm"
            >
              {mode === 'REGISTER' ? 'Already have an Identity? Login' : 'New to TradeMind? Create Identity'}
            </button>
            
            <button 
              onClick={toggleAdmin}
              className={`w-full py-4 rounded-3xl border text-[10px] font-black uppercase tracking-widest transition-all ${isActualAdminAttempt ? 'border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/10' : 'border-purple-500/20 text-purple-400 hover:bg-purple-500/10'}`}
            >
              {isActualAdminAttempt ? 'Switch to Trader Terminal' : 'Access Root Admin Portal'}
            </button>
          </div>
        </div>
      </div>

      <div className="w-full max-w-5xl mt-24 px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((b, i) => (
            <div key={i} className="bg-[#0e1421]/60 backdrop-blur-sm border border-[#1e293b] p-8 rounded-[3rem] flex flex-col gap-6 group hover:border-emerald-500/30 transition-all">
              <div className="text-3xl bg-[#070a13] w-16 h-16 rounded-2xl border border-[#1e293b] flex items-center justify-center group-hover:scale-110 transition-transform">{b.icon}</div>
              <div className="flex-1">
                <h4 className="font-black text-white text-[11px] uppercase tracking-widest mb-2">{b.title}</h4>
                <p className="text-slate-500 text-[12px] leading-relaxed font-medium">{b.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AuthView;
