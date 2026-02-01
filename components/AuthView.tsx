
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
        if (newUser) onAuthComplete(newUser);
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
          alert('Logic Reset command issued.');
          setMode('LOGIN');
          setPassword('');
        } else {
          setErrorMessage('Verification Error: No profile found matching these credentials.');
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected logic error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const benefits = [
    { icon: "📈", title: "Execution Discipline", text: "Transform impulsive gambling into systematic execution through rigorous post-trade logging.", color: "from-emerald-500/20 to-transparent" },
    { icon: "📊", title: "Edge Identification", text: "Pinpoint high-probability setups by isolating the strategies that generate highest profit factors.", color: "from-blue-500/20 to-transparent" },
    { icon: "🛡️", title: "Risk Mitigation", text: "Instantly detect capital-draining leaks like over-leveraging or recurring rule violations.", color: "from-red-500/20 to-transparent" },
    { icon: "🤖", title: "AI Risk Coaching", text: "Leverage Gemini AI to audit your logic and receive actionable directives for immediate improvement.", color: "from-purple-500/20 to-transparent" }
  ];

  return (
    <div className="min-h-screen bg-[#070a13] flex flex-col items-center p-6 md:p-12 relative overflow-x-hidden overflow-y-auto no-scrollbar pb-40">
      <div className={`absolute top-[-10%] left-[-10%] w-[60%] h-[60%] ${isActualAdminAttempt ? 'bg-purple-600/20' : 'bg-emerald-600/10'} rounded-full blur-[140px] pointer-events-none`}></div>

      <div className="w-full max-w-lg relative z-10 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-700 mt-8">
        <div className="flex flex-col items-center text-center mb-10">
          <div className={`w-20 h-20 rounded-[2.5rem] flex items-center justify-center font-black text-3xl shadow-2xl transition-all duration-700 ${isActualAdminAttempt ? 'bg-purple-600 text-white shadow-purple-500/30' : mode === 'FORGOT' ? 'bg-blue-600 text-white shadow-blue-500/30' : 'bg-emerald-500 text-slate-900 shadow-emerald-500/30'}`}>
            {isActualAdminAttempt ? '🛡️' : mode === 'FORGOT' ? '?' : 'T'}
          </div>
          <h1 className="text-4xl font-black text-white tracking-tighter mt-6">
            TradeMind <span className={isActualAdminAttempt ? 'text-purple-400' : mode === 'FORGOT' ? 'text-blue-400' : 'text-emerald-500'}>{isActualAdminAttempt ? 'Root' : mode === 'FORGOT' ? 'Reset' : 'AI'}</span>
          </h1>
          <p className="text-slate-500 text-[9px] mt-2 font-black uppercase tracking-[0.4em]">Performance Intelligence Terminal</p>
        </div>

        <div className={`w-full p-8 md:p-10 rounded-[3rem] border shadow-2xl transition-all duration-500 ${isActualAdminAttempt ? 'bg-[#120b24]/90 border-purple-500/30' : mode === 'FORGOT' ? 'bg-[#0a1226]/90 border-blue-500/30' : 'bg-[#0e1421]/90 border-[#1e293b]'}`}>
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-black text-white mb-2 tracking-tight">
              {isActualAdminAttempt ? 'Root Authorization' : mode === 'REGISTER' ? 'Initialize Identity' : mode === 'FORGOT' ? 'Recover Logic' : 'Welcome Back'}
            </h2>
            <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest">Secure Cloud Link Synchronized</p>
          </div>
          
          {errorMessage && (
            <div className="mb-6 p-4 rounded-2xl border bg-red-500/10 border-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-widest text-center">{errorMessage}</div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'REGISTER' && (
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-[#070a13] border border-[#1e293b] rounded-2xl p-4 focus:ring-2 focus:ring-emerald-500 outline-none text-white font-bold text-sm" placeholder="Identity Name" />
            )}
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-[#070a13] border border-[#1e293b] rounded-2xl p-4 focus:ring-2 focus:ring-emerald-500 outline-none text-white font-bold text-sm" placeholder="Terminal ID (Email)" />
            {mode !== 'FORGOT' && (
              <div className="space-y-1">
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-[#070a13] border border-[#1e293b] rounded-2xl p-4 focus:ring-2 focus:ring-emerald-500 outline-none text-white font-bold text-sm" placeholder="Logic Passphrase" />
                {mode === 'LOGIN' && (
                  <div className="flex justify-end px-1">
                    <button type="button" onClick={() => setMode('FORGOT')} className="text-[9px] font-black text-blue-400 uppercase tracking-widest hover:underline">Forgot Passphrase?</button>
                  </div>
                )}
              </div>
            )}

            {mode === 'REGISTER' && (
              <div className="flex items-start gap-3 p-3 bg-[#070a13] rounded-2xl border border-[#1e293b]">
                <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} className="w-4 h-4 mt-0.5 rounded accent-emerald-500 cursor-pointer" required />
                <label className="text-[9px] font-bold text-slate-500 uppercase tracking-tight leading-relaxed">
                  I accept the <button type="button" onClick={() => setShowTermsModal(true)} className="text-emerald-500 underline">Terms & Conditions</button> and acknowledge that system performance is tied to journaling consistency.
                </label>
              </div>
            )}
            
            <button type="submit" disabled={isSubmitting} className={`w-full font-black py-4 rounded-2xl transition-all shadow-xl flex items-center justify-center gap-3 text-[11px] uppercase tracking-[0.2em] mt-2 ${isActualAdminAttempt ? 'bg-purple-600 text-white' : mode === 'FORGOT' ? 'bg-blue-600 text-white' : 'bg-emerald-500 text-slate-900'}`}>
              {isSubmitting ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div> : (mode === 'REGISTER' ? 'Initialize' : 'Enter Terminal')}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-[#1e293b] flex flex-col gap-3">
            <button onClick={() => setMode(mode === 'REGISTER' ? 'LOGIN' : 'REGISTER')} className="w-full py-4 text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-all">
              {mode === 'REGISTER' ? 'Already have an Identity? Login' : 'New to TradeMind? Create Identity'}
            </button>
            {!isActualAdminAttempt && (
              <button onClick={() => setIsAdminMode(true)} className="w-full py-2 text-[8px] font-black uppercase tracking-[0.2em] text-purple-400/50 hover:text-purple-400 transition-all">Root Access Portal</button>
            )}
          </div>
        </div>
      </div>

      <div className="w-full max-w-5xl mt-20 px-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {benefits.map((b, i) => (
          <div key={i} className={`bg-[#0e1421]/60 backdrop-blur-sm border border-[#1e293b] p-6 rounded-[2rem] flex flex-col gap-4 relative overflow-hidden group hover:border-emerald-500/30 transition-all`}>
            <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${b.color}`}></div>
            <div className="text-2xl bg-[#070a13] w-12 h-12 rounded-xl border border-[#1e293b] flex items-center justify-center">{b.icon}</div>
            <div>
              <h4 className="font-black text-white text-[10px] uppercase tracking-widest mb-1">{b.title}</h4>
              <p className="text-slate-500 text-[11px] leading-relaxed font-medium">{b.text}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Permanent Footer / Contact Us Section */}
      <footer className="w-full max-w-lg mt-16 text-center space-y-4">
        <div className="flex items-center justify-center gap-6">
          <a href="mailto:support@trademind.ai" className="text-slate-500 hover:text-emerald-400 transition-colors flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
            Email Support
          </a>
          <a href="https://wa.me/91XXXXXXXXXX" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-emerald-400 transition-colors flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.246 2.248 3.484 5.232 3.483 8.413-.003 6.557-5.338 11.892-11.893 11.892-1.997-.001-3.951-.5-5.688-1.448l-6.308 1.654zm6.233-3.762c1.508.893 3.078 1.364 4.671 1.365 5.439 0 9.865-4.426 9.868-9.866.002-2.628-1.022-5.1-2.883-6.963-1.861-1.862-4.332-2.887-6.961-2.888-5.442 0-9.866 4.426-9.869 9.866-.001 1.79.483 3.531 1.397 5.051l-1.088 3.972 4.065-1.067z"></path></svg>
            WhatsApp Admin
          </a>
        </div>
        <p className="text-[8px] text-slate-700 font-black uppercase tracking-[0.2em]">© 2025 TradeMind Institutional Labs. All rights reserved.</p>
      </footer>

      {/* Terms Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
          <div className="bg-[#0e1421] w-full max-w-2xl rounded-[2.5rem] border border-[#1e293b] p-8 md:p-12 space-y-6 shadow-2xl animate-in zoom-in duration-300">
            <h3 className="text-2xl font-black text-white tracking-tighter">Terms of Service</h3>
            <div className="max-h-[60vh] overflow-y-auto pr-4 text-slate-400 text-xs leading-relaxed space-y-4 custom-scrollbar">
              <p className="font-bold text-slate-300">1. Journaling Commitment</p>
              <p>TradeMind is a discipline-first platform. Users acknowledge that success depends on consistent data logging and adherence to established trading plans.</p>
              <p className="font-bold text-slate-300">2. Risk Disclosure</p>
              <p>Trading involves substantial risk. AI insights provided are for analysis purposes only and do not constitute financial advice. Users are solely responsible for their financial decisions.</p>
              <p className="font-bold text-slate-300">3. Subscription & Payments</p>
              <p>Access is granted upon verification of payment. Refunds are issued only in the case of verified system-wide technical failure.</p>
              <p className="font-bold text-slate-300">4. Data Privacy</p>
              <p>Your trade data is encrypted and used only to power your personalized AI coaching models. We do not sell user-specific trading data to third parties.</p>
            </div>
            <button onClick={() => setShowTermsModal(false)} className="w-full py-4 bg-emerald-500 text-slate-900 font-black rounded-xl text-[10px] uppercase tracking-widest">Close & Return</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthView;
