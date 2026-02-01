
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
  const [showTermsModal, setShowTermsModal] = useState(false);

  const ADMIN_EMAIL = 'mangeshpotale09@gmail.com';
  const isActualAdminAttempt = isAdminMode || email.toLowerCase().trim() === ADMIN_EMAIL;

  const validateInputs = (): boolean => {
    if (!email.trim()) {
      setErrorMessage("Identity (Email) is required.");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMessage("Invalid email format.");
      return false;
    }
    if (mode !== 'FORGOT' && password.length < 6) {
      setErrorMessage("Passphrase must be at least 6 characters.");
      return false;
    }
    if (mode === 'REGISTER' && !name.trim()) {
      setErrorMessage("Display Name is required.");
      return false;
    }
    if (mode === 'REGISTER' && !termsAccepted) {
      setErrorMessage("You must accept the terms to proceed.");
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
        if (newUser) onAuthComplete(newUser);
      } else if (mode === 'LOGIN') {
        const user = await validateLogin(normalizedEmail, password);
        if (user) {
          if (isActualAdminAttempt && user.role !== UserRole.ADMIN) {
             setErrorMessage("ACCESS_DENIED: Elevation to ROOT required.");
             return;
          }
          onAuthComplete(user);
        }
      } else if (mode === 'FORGOT') {
        const success = await resetUserPassword(normalizedEmail, mobile, newPassword);
        if (success) {
          alert('Passphrase reset request processed. Returning to login.');
          setMode('LOGIN');
          setPassword('');
        } else {
          setErrorMessage('Profile not found or recovery criteria not met.');
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'System error during authentication.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const benefits = [
    { icon: "⚡", title: "Instant Analysis", text: "Commit trades and receive immediate Gemini AI audits on your execution logic.", color: "from-blue-500/20 to-transparent" },
    { icon: "🛡️", title: "Risk Mitigation", text: "Identify capital leaks and rule violations before they impact your drawdown.", color: "from-emerald-500/20 to-transparent" },
    { icon: "📊", title: "Edge Detection", text: "Uncover high-probability setups hidden in your historical execution tape.", color: "from-purple-500/20 to-transparent" },
    { icon: "📱", title: "Mobile Optimized", text: "Journal from any terminal or mobile node with seamless cloud synchronization.", color: "from-amber-500/20 to-transparent" }
  ];

  return (
    <div className="min-h-screen bg-[#070a13] flex flex-col items-center p-6 relative overflow-x-hidden no-scrollbar selection:bg-emerald-500/30">
      {/* Dynamic Background Glow */}
      <div className={`absolute top-[-20%] left-[-10%] w-[60%] h-[60%] ${isActualAdminAttempt ? 'bg-purple-600/10' : 'bg-emerald-600/5'} rounded-full blur-[140px] pointer-events-none`}></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Main Container */}
      <div className="w-full max-w-lg relative z-10 flex flex-col items-center mt-12 animate-in fade-in zoom-in duration-1000">
        <div className="text-center mb-10">
          <div className={`w-20 h-20 rounded-[2rem] mx-auto flex items-center justify-center font-black text-3xl shadow-2xl transition-all duration-700 ${isActualAdminAttempt ? 'bg-purple-600 text-white shadow-purple-500/30' : 'bg-emerald-500 text-slate-900 shadow-emerald-500/30'}`}>
            {isActualAdminAttempt ? '🛡️' : 'TM'}
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter mt-6">
            TradeMind <span className={isActualAdminAttempt ? 'text-purple-400' : 'text-emerald-500'}>{isActualAdminAttempt ? 'Root' : 'AI'}</span>
          </h1>
          <p className="text-slate-500 text-[9px] mt-2 font-black uppercase tracking-[0.4em]">Performance Intelligence Node</p>
        </div>

        <div className={`w-full p-8 md:p-10 rounded-[2.5rem] border shadow-2xl backdrop-blur-md transition-all duration-500 ${isActualAdminAttempt ? 'bg-[#120b24]/90 border-purple-500/20' : 'bg-[#0e1421]/90 border-[#1e293b]'}`}>
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-black text-white mb-2">
              {mode === 'REGISTER' ? 'Initialize Subject' : mode === 'FORGOT' ? 'Recovery Protocol' : 'Authorized Access'}
            </h2>
            <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest">Database Sync: Connected</p>
          </div>
          
          {errorMessage && (
            <div className="mb-6 p-4 rounded-2xl border bg-red-500/10 border-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-widest text-center">{errorMessage}</div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'REGISTER' && (
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-[#070a13] border border-[#1e293b] rounded-2xl p-4 focus:ring-2 focus:ring-emerald-500 outline-none text-white font-bold text-sm" placeholder="Display Identity" />
            )}
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-[#070a13] border border-[#1e293b] rounded-2xl p-4 focus:ring-2 focus:ring-emerald-500 outline-none text-white font-bold text-sm" placeholder="Email Address" />
            
            {mode !== 'FORGOT' ? (
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-[#070a13] border border-[#1e293b] rounded-2xl p-4 focus:ring-2 focus:ring-emerald-500 outline-none text-white font-bold text-sm" placeholder="Secure Passphrase" />
            ) : (
              <>
                <input type="text" required value={mobile} onChange={(e) => setMobile(e.target.value)} className="w-full bg-[#070a13] border border-[#1e293b] rounded-2xl p-4 focus:ring-2 focus:ring-blue-500 outline-none text-white font-bold text-sm" placeholder="Registered Mobile" />
                <input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full bg-[#070a13] border border-[#1e293b] rounded-2xl p-4 focus:ring-2 focus:ring-blue-500 outline-none text-white font-bold text-sm" placeholder="New Passphrase" />
              </>
            )}

            {mode === 'REGISTER' && (
              <div className="flex items-start gap-3 p-4 bg-[#070a13] rounded-2xl border border-[#1e293b]">
                <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} className="w-4 h-4 mt-0.5 rounded accent-emerald-500 cursor-pointer" />
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-tight leading-relaxed">
                  I acknowledge that TradeMind is a journaling tool and agree to the <button type="button" onClick={() => setShowTermsModal(true)} className="text-emerald-500 hover:text-emerald-400 underline">Terms of Use</button>.
                </label>
              </div>
            )}
            
            <button type="submit" disabled={isSubmitting} className={`w-full font-black py-4 rounded-2xl transition-all shadow-xl flex items-center justify-center gap-3 text-[11px] uppercase tracking-[0.2em] mt-4 ${isActualAdminAttempt ? 'bg-purple-600 text-white' : 'bg-emerald-500 text-slate-900'}`}>
              {isSubmitting ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div> : (mode === 'REGISTER' ? 'Register Subject' : 'Authorize Entry')}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-[#1e293b] space-y-2">
            <button onClick={() => setMode(mode === 'REGISTER' ? 'LOGIN' : 'REGISTER')} className="w-full py-2 text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-all">
              {mode === 'REGISTER' ? 'Return to Login' : 'New Identity? Create Profile'}
            </button>
            {mode === 'LOGIN' && (
              <button onClick={() => setMode('FORGOT')} className="w-full py-2 text-[8px] font-black uppercase tracking-widest text-blue-500/70 hover:text-blue-400">Recover Credentials</button>
            )}
          </div>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mt-12">
          {benefits.map((b, i) => (
            <div key={i} className="bg-[#0e1421]/60 backdrop-blur-md border border-[#1e293b] p-6 rounded-3xl flex flex-col gap-3 relative overflow-hidden group hover:border-emerald-500/20 transition-all">
               <div className={`absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r ${b.color}`}></div>
               <div className="text-xl">{b.icon}</div>
               <div>
                  <h4 className="font-black text-white text-[10px] uppercase tracking-widest mb-1">{b.title}</h4>
                  <p className="text-slate-500 text-[11px] leading-relaxed">{b.text}</p>
               </div>
            </div>
          ))}
        </div>

        {/* Permanent Institutional Footer */}
        <footer className="w-full mt-20 pb-10 text-center space-y-6">
          <div className="h-px w-20 bg-[#1e293b] mx-auto"></div>
          <div className="flex flex-wrap items-center justify-center gap-8">
            <a href="mailto:support@trademind.ai" className="text-slate-500 hover:text-emerald-400 transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
              Institutional Support
            </a>
            <a href="https://wa.me/91XXXXXXXXXX" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-emerald-500 transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.246 2.248 3.484 5.232 3.483 8.413-.003 6.557-5.338 11.892-11.893 11.892-1.997-.001-3.951-.5-5.688-1.448l-6.308 1.654zm6.233-3.762c1.508.893 3.078 1.364 4.671 1.365 5.439 0 9.865-4.426 9.868-9.866.002-2.628-1.022-5.1-2.883-6.963-1.861-1.862-4.332-2.887-6.961-2.888-5.442 0-9.866 4.426-9.869 9.866-.001 1.79.483 3.531 1.397 5.051l-1.088 3.972 4.065-1.067z"></path></svg>
              Emergency Contact
            </a>
          </div>
          <p className="text-[8px] text-slate-700 font-black uppercase tracking-[0.3em]">© 2025 TradeMind Intelligence Labs. All rights reserved.</p>
        </footer>
      </div>

      {/* Terms Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/90 backdrop-blur-lg">
          <div className="bg-[#0e1421] w-full max-w-2xl rounded-[3rem] border border-[#1e293b] p-10 space-y-8 shadow-2xl animate-in zoom-in duration-300">
            <h3 className="text-2xl font-black text-white tracking-tighter">Terms & Conditions</h3>
            <div className="max-h-[50vh] overflow-y-auto pr-4 text-slate-400 text-xs leading-relaxed space-y-4 no-scrollbar">
              <p className="font-bold text-slate-200">1. Nature of Service</p>
              <p>TradeMind AI is a journaling and performance analysis node. We do not provide financial advice, signals, or managed funds.</p>
              <p className="font-bold text-slate-200">2. Performance Responsibility</p>
              <p>Trading success depends on individual subject discipline. AI audits are based on historical data patterns and should not be used as the sole basis for live risk execution.</p>
              <p className="font-bold text-slate-200">3. Data Encrypton</p>
              <p>Subject data is stored securely and used only to power the subject's personal performance model. We do not share trade tape data with outside nodes.</p>
            </div>
            <button onClick={() => setShowTermsModal(false)} className="w-full py-4 bg-emerald-500 text-slate-900 font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-xl">Acknowledge & Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthView;
