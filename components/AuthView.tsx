
import React, { useState } from 'react';
import { User, UserRole, UserStatus } from '../types';
import { registerUser, validateLogin, resetUserPassword } from '../services/storageService';

interface AuthViewProps {
  onAuthComplete: (user: User) => void;
}

const BENEFITS_LIST = [
  { title: "AI Performance Audits", desc: "Gemini Pro evaluates every execution for logic, discipline, and psychological leaks." },
  { title: "Edge Discovery", desc: "Automated identification of your most profitable trading hours, days, and setups." },
  { title: "Discipline Tracker", desc: "Quantify rule violations and FOMO to systematically eliminate emotional trading." },
  { title: "Evidence Vault", desc: "Secure cloud storage for charts and entry/exit screenshots to build your playbook." },
  { title: "Quant Analytics", desc: "Professional-grade equity curves, profit factors, and risk/reward metrics at your fingertips." },
  { title: "Identity Security", desc: "Isolated terminal identities with encrypted logic protocols and session management." }
];

const REFUND_POLICY = [
  "No Refunds: All subscription payments for TradeMind AI are final and non-refundable.",
  "Immediate Access: Since the Service provides immediate access to proprietary AI analytics and digital tools, we cannot offer refunds once a node is activated.",
  "Cancellation Policy: Users may terminate their subscription at any time; however, no refunds will be issued for the remaining duration of the current cycle.",
  "Extension Credits: At the sole discretion of the Admin, extension credits may be issued in the event of verified platform outages exceeding 48 hours.",
  "Billing Disputes: Any discrepancies must be reported to terminal support within 7 days of the transaction for audit."
];

const TERMS_LIST = [
  "Acceptance of Terms: By accessing or using the TradeMind AI trading journal application Service, you agree to be bound by these Terms and Conditions. If you do not agree, do not use the App.",
  "Purpose of the App: TradeMind AI is a personal trading journal and analytics tool designed to help users record, review, and analyze their stock and options trades. The App does not execute trades, provide brokerage services, or guarantee results.",
  "No Financial Advice: All content, features, data, analytics, metrics, insights, or summaries provided by the App are for educational and informational purposes only. The App does not provide investment, legal, tax, or financial advice. Nothing in the App should be considered a recommendation to buy, sell, or hold any security or derivative. You are solely responsible for your trading decisions and outcomes. You acknowledge that trading stocks and options involves substantial risk, including the possible loss of all invested capital.",
  "User Eligibility: By using the App, you represent that: You are at least 18 years old (or the legal age in your jurisdiction); You are legally permitted to use financial tracking software; You are not restricted from trading securities under applicable laws.",
  "User Accounts: You are responsible for: Maintaining the confidentiality of your login credentials; All activity that occurs under your account; Ensuring the accuracy of the data you enter. We reserve the right to suspend or terminate accounts that violate these Terms.",
  "User Data and Trade Entries: You retain ownership of the trade data and journal entries you submit. By using the App, you grant us a limited license to store, process, and analyze this data solely to provide and improve the Service. We do not verify the accuracy of imported or manually entered trading data.",
  "Market Data Disclaimer: Market data (if provided) may be: Delayed, Incomplete, or Supplied by third-party providers. We make no guarantees regarding the accuracy, reliability, or timeliness of market data.",
  "Performance Metrics and Analytics: Any performance statistics, charts, win rates, profit/loss calculations, or analytics are estimates only and may differ from actual brokerage records due to: Data input errors; Fees, commissions, or slippage; Corporate actions or adjustments.",
  "Prohibited Use: You agree not to: Use the App for unlawful purposes; Attempt to reverse engineer or exploit the App; Upload malicious code or interfere with system security; Use the App to provide financial advice to others without authorization.",
  "Intellectual Property: All trademarks, logos, software, designs, and content (excluding user-generated content) are the property of TradeMind AI and may not be copied or reused without permission.",
  "Third-Party Services: The App may integrate with third-party platforms (e.g., broker imports, APIs). We are not responsible for third-party services, data accuracy, or outages.",
  "Disclaimer of Warranties: The App is provided 'as is' and 'as available.' We make no warranties, express or implied, including but not limited to: Fitness for a particular purpose; Accuracy of analytics or calculations; Availability or uninterrupted access.",
  "Limitation of Liability: To the maximum extent permitted by law, TradeMind AI shall not be liable for: Trading losses or missed opportunities; Data loss or corruption; Indirect, incidental, or consequential damages. Your sole remedy is to stop using the App.",
  "Indemnification: You agree to indemnify and hold harmless TradeMind AI from any claims, damages, or losses arising from your use of the App or violation of these Terms.",
  "Termination: We may suspend or terminate your access at any time, with or without notice, for violation of these Terms or for operational reasons.",
  "Changes to Terms: We reserve the right to modify these Terms at any time. Continued use of the App after changes constitutes acceptance of the updated Terms.",
  "Governing Law: These Terms are governed by the laws of India, without regard to conflict of law principles."
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
  const [showContactModal, setShowContactModal] = useState(false);

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
      setErrorMessage("Please accept the Terms and Conditions to proceed.");
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

  return (
    <div className="min-h-screen bg-[#070a13] flex flex-col items-center p-6 md:p-12 relative overflow-hidden pb-32">
      {/* Contact Trigger (Three Dots) */}
      <button 
        onClick={() => setShowContactModal(true)}
        className="absolute top-8 right-8 z-[60] p-3 rounded-full bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center shadow-lg"
        title="Terminal Support & Information"
      >
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>

      {/* BACKGROUND ELEMENTS */}
      <div className="absolute inset-0 opacity-[0.15] pointer-events-none" 
        style={{ 
          backgroundImage: `linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(90deg, #1e293b 1px, transparent 1px)`,
          backgroundSize: '40px 40px' 
        }}>
      </div>

      <div className="absolute inset-0 pointer-events-none opacity-[0.05]">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <g fill="#10b981">
            <rect x="10%" y="20%" width="8" height="60" rx="2" />
            <rect x="10.2%" y="15%" width="2" height="70" rx="1" />
            <rect x="25%" y="40%" width="8" height="40" rx="2" />
            <rect x="25.2%" y="35%" width="2" height="55" rx="1" />
            <rect x="70%" y="10%" width="8" height="90" rx="2" />
            <rect x="70.2%" y="5%" width="2" height="110" rx="1" />
          </g>
          <g fill="#ef4444">
            <rect x="40%" y="30%" width="8" height="50" rx="2" />
            <rect x="40.2%" y="25%" width="2" height="70" rx="1" />
            <rect x="85%" y="60%" width="8" height="30" rx="2" />
            <rect x="85.2%" y="55%" width="2" height="45" rx="1" />
          </g>
        </svg>
      </div>

      <div className="absolute top-1/2 left-0 w-full h-[300px] -translate-y-1/2 pointer-events-none blur-[80px] opacity-[0.08]">
        <svg width="100%" height="100%" preserveAspectRatio="none">
          <path d="M0 150 Q 250 50 500 150 T 1000 150" fill="none" stroke="#10b981" strokeWidth="20" className="animate-[pulse_4s_infinite]" />
        </svg>
      </div>

      <div className={`absolute top-[-10%] left-[-10%] w-[60%] h-[60%] ${isActualAdminAttempt ? 'bg-purple-600/20' : 'bg-emerald-600/10'} rounded-full blur-[140px] pointer-events-none transition-all duration-1000 animate-pulse`}></div>
      <div className={`absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] ${isActualAdminAttempt ? 'bg-indigo-600/20' : 'bg-emerald-500/5'} rounded-full blur-[140px] pointer-events-none transition-all duration-1000`}></div>

      {/* CONTENT START */}
      <div className="w-full max-w-lg relative z-10 flex flex-col items-center justify-center animate-in fade-in zoom-in duration-700 mt-8">
        <div className="flex flex-col items-center text-center mb-10">
          <div className={`w-24 h-24 rounded-[3rem] flex items-center justify-center font-black text-4xl shadow-2xl transition-all duration-700 relative overflow-hidden group ${isActualAdminAttempt ? 'bg-purple-600 text-white shadow-purple-500/30' : mode === 'FORGOT' ? 'bg-blue-600 text-white shadow-blue-500/30' : 'bg-emerald-500 text-slate-900 shadow-emerald-500/30'}`}>
            <span className="relative z-10">{isActualAdminAttempt ? '🛡️' : mode === 'FORGOT' ? '?' : 'T'}</span>
            <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 skew-x-12"></div>
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter mt-8">
            TradeMind <span className={`transition-colors duration-500 ${isActualAdminAttempt ? 'text-purple-400' : mode === 'FORGOT' ? 'text-blue-400' : 'text-emerald-500'}`}>{isActualAdminAttempt ? 'Root' : mode === 'FORGOT' ? 'Reset' : 'AI'}</span>
          </h1>
          <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.4em] mt-3 opacity-60">Quant Performance Terminal</p>
        </div>

        <div className={`w-full p-8 md:p-12 rounded-[4rem] border shadow-2xl transition-all duration-500 backdrop-blur-xl ${isActualAdminAttempt ? 'bg-[#120b24]/80 border-purple-500/30 shadow-purple-900/10' : mode === 'FORGOT' ? 'bg-[#0a1226]/80 border-blue-500/30 shadow-blue-900/10' : 'bg-[#0e1421]/80 border-[#1e293b]'}`}>
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-black text-white mb-3 tracking-tight">
              {isActualAdminAttempt ? 'Root Authorization' : mode === 'REGISTER' ? 'Initialize Identity' : mode === 'FORGOT' ? 'Recover Logic' : 'Welcome Back'}
            </h2>
            <div className="w-12 h-1 bg-gradient-to-r from-transparent via-slate-700 to-transparent mx-auto mt-4 opacity-50"></div>
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
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-[#070a13]/50 border border-[#1e293b] rounded-2xl p-4 md:p-5 focus:ring-2 focus:ring-emerald-500 outline-none text-white font-bold transition-all text-sm placeholder-slate-700" placeholder="Trader Name" />
              </div>
            )}
            
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Terminal ID (Email)</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={`w-full bg-[#070a13]/50 border rounded-2xl p-4 md:p-5 focus:ring-2 outline-none text-white font-bold transition-all text-sm placeholder-slate-700 ${isActualAdminAttempt ? 'border-purple-500/40 focus:ring-purple-500' : 'border-[#1e293b] focus:ring-emerald-500'}`} placeholder="trader@mind.ai" />
            </div>

            {mode !== 'FORGOT' && (
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Logic Passphrase</label>
                  {mode === 'LOGIN' && (
                    <button type="button" onClick={() => setMode('FORGOT')} className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Forgot?</button>
                  )}
                </div>
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className={`w-full bg-[#070a13]/50 border rounded-2xl p-4 md:p-5 focus:ring-2 outline-none text-white font-bold transition-all text-sm placeholder-slate-700 ${isActualAdminAttempt ? 'border-purple-500/40 focus:ring-purple-500' : 'border-[#1e293b] focus:ring-emerald-500'}`} placeholder="••••••••" />
              </div>
            )}

            {mode === 'REGISTER' && (
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-[#070a13]/50 rounded-2xl border border-[#1e293b]">
                  <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} className="w-5 h-5 mt-0.5 rounded border-[#1e293b] bg-slate-900 text-emerald-500 accent-emerald-500 cursor-pointer" required />
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-tight leading-relaxed">
                    I accept all <button type="button" onClick={() => setShowTermsModal(true)} className="text-emerald-500 underline">Terms and Conditions</button> regarding financial risk and system audit.
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
            <button onClick={() => { setMode(mode === 'REGISTER' ? 'LOGIN' : 'REGISTER'); setErrorMessage(null); }} className="w-full py-5 rounded-3xl border border-[#1e293b] bg-white/5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:bg-white/10 transition-all">
              {mode === 'REGISTER' ? 'Already have an Identity? Login' : 'New to TradeMind? Create Identity'}
            </button>
          </div>
        </div>

        <div className="mt-12 flex gap-8 opacity-40">
           <div className="flex flex-col items-center">
             <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Market Node</span>
             <span className="text-[10px] font-mono font-bold text-emerald-500">CONNECTED</span>
           </div>
           <div className="flex flex-col items-center">
             <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Sync Protocol</span>
             <span className="text-[10px] font-mono font-bold text-slate-400">v2.5.0-FLASH</span>
           </div>
           <div className="flex flex-col items-center">
             <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Latency</span>
             <span className="text-[10px] font-mono font-bold text-emerald-500">12ms</span>
           </div>
        </div>
      </div>

      {/* Terms Modal (Direct Checkbox Version) */}
      {showTermsModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/95 backdrop-blur-md">
          <div className="w-full max-w-2xl bg-[#0e1421] rounded-[3rem] border border-[#1e293b] overflow-hidden shadow-2xl animate-in zoom-in">
            <div className="p-8 border-b border-[#1e293b] flex justify-between items-center bg-[#0a0f1d]/50">
               <h3 className="text-xl font-black text-white uppercase tracking-widest">Terms & Conditions</h3>
               <button onClick={() => setShowTermsModal(false)} className="text-slate-500 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
               </button>
            </div>
            <div className="p-8 max-h-[60vh] overflow-y-auto space-y-4 no-scrollbar">
              {TERMS_LIST.map((term, idx) => (
                <div key={idx} className="flex gap-4 p-4 bg-[#0a0f1d] rounded-2xl border border-[#1e293b]/50">
                   <span className="text-emerald-500 font-black text-xs min-w-[20px]">{idx + 1}</span>
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

      {/* Unified Support & Benefits & Terms & Refund Modal (Three Dot Entry) */}
      {showContactModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/95 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-[95vw] lg:max-w-7xl bg-[#0e1421] rounded-[3rem] border border-[#1e293b] overflow-hidden shadow-2xl animate-in zoom-in">
            <div className="p-8 border-b border-[#1e293b] flex justify-between items-center bg-[#0a0f1d]/50">
               <h3 className="text-xl font-black text-white uppercase tracking-widest">Terminal Information Portal</h3>
               <button onClick={() => setShowContactModal(false)} className="text-slate-500 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
               </button>
            </div>
            
            <div className="flex flex-col lg:flex-row max-h-[75vh] divide-y lg:divide-y-0 lg:divide-x divide-[#1e293b]">
              {/* Column 1: Support Details */}
              <div className="w-full lg:w-[15%] p-6 bg-[#0a0f1d]/30 space-y-6 shrink-0">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Support</h4>
                
                <div className="space-y-4">
                  <div className="p-4 bg-[#0a0f1d] rounded-2xl border border-[#1e293b]">
                    <div className="w-8 h-8 bg-emerald-500/10 text-emerald-500 rounded-lg flex items-center justify-center mb-3">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                    </div>
                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Email Node</p>
                    <p className="text-[10px] font-black text-white mt-1 break-all">trademindai@gmail.com</p>
                  </div>

                  <div className="p-4 bg-[#0a0f1d] rounded-2xl border border-[#1e293b]">
                    <div className="w-8 h-8 bg-blue-500/10 text-blue-400 rounded-lg flex items-center justify-center mb-3">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                    </div>
                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Phone Node</p>
                    <p className="text-[10px] font-black text-white mt-1">8600299477</p>
                  </div>
                </div>
              </div>

              {/* Column 2: Platform Benefits */}
              <div className="w-full lg:w-1/4 p-6 overflow-y-auto no-scrollbar space-y-4">
                <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-4">Core Benefits</h4>
                <div className="grid grid-cols-1 gap-4">
                  {BENEFITS_LIST.map((benefit, idx) => (
                    <div key={idx} className="p-4 bg-[#0a0f1d] rounded-2xl border border-emerald-500/10 hover:border-emerald-500/30 transition-all">
                      <h5 className="text-[10px] font-black text-white uppercase tracking-widest mb-1">{benefit.title}</h5>
                      <p className="text-[9px] text-slate-500 leading-relaxed font-medium">{benefit.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Column 3: Refund & Cancellation Policy (NEW) */}
              <div className="w-full lg:w-[20%] p-6 overflow-y-auto no-scrollbar space-y-4 bg-red-500/5">
                <h4 className="text-[10px] font-black text-red-400 uppercase tracking-[0.2em] mb-4">Refund Policy</h4>
                <div className="space-y-3">
                  {REFUND_POLICY.map((point, idx) => (
                    <div key={idx} className="p-4 bg-[#0a0f1d] rounded-2xl border border-red-500/10">
                      <p className="text-[10px] text-slate-300 leading-relaxed font-medium">
                        <span className="text-red-500 font-black mr-2">PROTOCOL {idx + 1}:</span>
                        {point}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Column 4: 17 Terms & Legal Protocols */}
              <div className="w-full lg:w-[40%] p-6 overflow-y-auto no-scrollbar space-y-4">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">17 Terms & Legal Protocols</h4>
                <div className="space-y-2">
                  {TERMS_LIST.map((term, idx) => (
                    <div key={idx} className="flex gap-4 p-4 bg-[#0a0f1d] rounded-2xl border border-[#1e293b]/50">
                      <span className="text-emerald-500 font-black text-[10px] min-w-[20px]">{idx + 1}</span>
                      <p className="text-slate-300 text-[10px] font-medium leading-relaxed">{term}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-8 bg-[#0a0f1d]/50 border-t border-[#1e293b] flex justify-between items-center">
               <p className="text-[9px] text-slate-500 italic">"Syncing terminal implies full legal acknowledgement of all protocols above."</p>
               <button onClick={() => setShowContactModal(false)} className="bg-[#1e293b] text-white font-black px-12 py-4 rounded-2xl text-[10px] uppercase tracking-widest hover:bg-[#334155] transition-all">Acknowledge & Sync Terminal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthView;
