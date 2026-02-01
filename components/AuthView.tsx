
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
  const [showRefundModal, setShowRefundModal] = useState(false);

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

  return (
    <div className="min-h-screen bg-[#070a13] flex flex-col items-center justify-center p-6 relative overflow-x-hidden no-scrollbar selection:bg-emerald-500/30">
      {/* Dynamic Background Glow */}
      <div className={`absolute top-[-20%] left-[-10%] w-[60%] h-[60%] ${isActualAdminAttempt ? 'bg-purple-600/10' : 'bg-emerald-600/5'} rounded-full blur-[140px] pointer-events-none`}></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-6xl z-10 flex flex-col lg:flex-row gap-12 items-center lg:items-stretch animate-in fade-in zoom-in duration-1000">
        
        {/* Left Side: Auth Terminal */}
        <div className="w-full lg:w-1/2 flex flex-col items-center lg:items-start justify-center">
          <div className="text-center lg:text-left mb-10 w-full">
            <div className={`w-20 h-20 rounded-[2rem] mx-auto lg:mx-0 flex items-center justify-center font-black text-3xl shadow-2xl transition-all duration-700 ${isActualAdminAttempt ? 'bg-purple-600 text-white shadow-purple-500/30' : 'bg-emerald-500 text-slate-900 shadow-emerald-500/30'}`}>
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
                <div className="flex flex-col gap-2 p-4 bg-[#070a13] rounded-2xl border border-[#1e293b]">
                  <div className="flex items-start gap-3">
                    <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} className="w-4 h-4 mt-0.5 rounded accent-emerald-500 cursor-pointer" />
                    <label className="text-[9px] font-bold text-slate-500 uppercase tracking-tight leading-relaxed">
                      I agree to the <button type="button" onClick={() => setShowTermsModal(true)} className="text-emerald-500 hover:text-emerald-400 underline">Terms</button> & <button type="button" onClick={() => setShowRefundModal(true)} className="text-emerald-500 hover:text-emerald-400 underline">Refund Policy</button>.
                    </label>
                  </div>
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
        </div>

        {/* Right Side: Information Panel */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center space-y-8">
          
          {/* Benefits Section (3 Lines) */}
          <div className="bg-[#0e1421]/60 backdrop-blur-md border border-[#1e293b] p-8 rounded-[2.5rem] relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/20"></div>
            <h3 className="text-xs font-black text-emerald-500 uppercase tracking-[0.3em] mb-4">Core Benefits</h3>
            <div className="space-y-2 text-slate-300 text-[13px] font-medium leading-relaxed">
              <p>1. Advanced Gemini AI Trade Audit & Sentiment Analysis</p>
              <p>2. Strategic Behavioral Pattern & Psychological Leak Detection</p>
              <p>3. High-Performance Data Visualization & Edge Discovery Suite</p>
            </div>
          </div>

          {/* Terms Section (3 Lines) */}
          <div className="bg-[#0e1421]/60 backdrop-blur-md border border-[#1e293b] p-8 rounded-[2.5rem] relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-purple-500/20"></div>
            <h3 className="text-xs font-black text-purple-400 uppercase tracking-[0.3em] mb-4">Terms & Conditions</h3>
            <div className="space-y-2 text-slate-400 text-[11px] font-bold uppercase tracking-wider leading-relaxed">
              <p>1. <button type="button" onClick={() => setShowTermsModal(true)} className="hover:text-purple-400 underline">Compliance With All 13 Institutional Usage Points</button></p>
              <p>2. <button type="button" onClick={() => setShowRefundModal(true)} className="hover:text-purple-400 underline">Strict No-Refund & Subscription Cancellation Policy</button></p>
              <p>3. Subject Data Ownership & Institutional Encryption Standards</p>
            </div>
          </div>

          {/* Contact Section (3 Lines) */}
          <div className="bg-[#0e1421]/60 backdrop-blur-md border border-[#1e293b] p-8 rounded-[2.5rem] relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/20"></div>
            <h3 className="text-xs font-black text-blue-400 uppercase tracking-[0.3em] mb-4">Contact Details</h3>
            <div className="space-y-2 text-slate-300 text-[13px] font-bold tracking-tight">
              <p>Email - <span className="text-blue-400">trademindai@gmail.com</span></p>
              <p>WhatsApp - <span className="text-emerald-400">8600299477</span></p>
              <p>24/7 Priority Support & Node Technical Recovery Desk</p>
            </div>
          </div>

        </div>
      </div>

      {/* Footer */}
      <footer className="w-full mt-20 pb-10 text-center relative z-10">
        <p className="text-[8px] text-slate-700 font-black uppercase tracking-[0.5em]">© 2025 TradeMind Intelligence Labs. All rights reserved.</p>
      </footer>

      {/* Terms Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/90 backdrop-blur-lg">
          <div className="bg-[#0e1421] w-full max-w-2xl rounded-[3rem] border border-[#1e293b] p-10 space-y-8 shadow-2xl animate-in zoom-in duration-300">
            <h3 className="text-2xl font-black text-white tracking-tighter">Institutional Terms</h3>
            <div className="max-h-[60vh] overflow-y-auto pr-4 text-slate-400 text-xs leading-relaxed space-y-6 no-scrollbar">
              <div>
                <p className="font-bold text-slate-200 underline text-sm mb-2">1. Eligibility</p>
                <p>You must be at least 18 years old (or the age of majority in your jurisdiction) to use the App. By using the App, you represent and warrant that you meet this requirement.</p>
              </div>

              <div>
                <p className="font-bold text-slate-200 underline text-sm mb-2">2. Purpose of the App (No Financial Advice)</p>
                <p>TradeMind AI is a trading journal and analytics tool intended solely for educational and informational purposes. The App does not provide financial, investment, legal, or tax advice. We do not recommend, endorse, or evaluate any securities, strategies, brokers, or trades. All trading decisions are made solely by you, at your own risk. You acknowledge that trading financial instruments involves substantial risk and may result in losses.</p>
              </div>

              <div>
                <p className="font-bold text-slate-200 underline text-sm mb-2">3. User Accounts</p>
                <p>To use certain features, you may be required to create an account. You agree to provide accurate and complete information, maintain the security of your login credentials, and accept responsibility for all activity under your account. We are not responsible for unauthorized access resulting from your failure to secure your account.</p>
              </div>

              <div>
                <p className="font-bold text-slate-200 underline text-sm mb-2">4. User Content & Trade Data</p>
                <p>You retain ownership of all data you enter into the App, including trade logs, notes, and performance data. By using the App, you grant us a limited, non-exclusive license to process this data solely for the purpose of operating and improving the App. We do not execute trades or connect to brokers unless explicitly stated.</p>
              </div>

              <div>
                <p className="font-bold text-slate-200 underline text-sm mb-2">5. Subscriptions & Payments</p>
                <p>If the App offers paid features: Fees are billed in advance on a recurring basis; Payments are non-refundable unless required by law; We may change pricing with prior notice; Failure to pay may result in suspension or termination of access.</p>
              </div>

              <div>
                <p className="font-bold text-slate-200 underline text-sm mb-2">6. Acceptable Use</p>
                <p>You agree not to use the App for unlawful purposes, attempt to reverse-engineer or exploit the node, upload malicious code, or use the App to misrepresent performance. We reserve the right to suspend or terminate accounts that violate these rules.</p>
              </div>

              <div>
                <p className="font-bold text-slate-200 underline text-sm mb-2">7. Data Accuracy & Availability</p>
                <p>While we strive for accuracy, we do not guarantee the correctness of calculations, analytics, or reports. Data may be delayed, incomplete, or contain errors. The App may be unavailable due to maintenance or technical issues. Use of the App is provided "as is" and "as available."</p>
              </div>

              <div>
                <p className="font-bold text-slate-200 underline text-sm mb-2">8. Third-Party Services</p>
                <p>The App may integrate with or link to third-party services (e.g., market data providers). We are not responsible for the content, accuracy, or availability of third-party services.</p>
              </div>

              <div>
                <p className="font-bold text-slate-200 underline text-sm mb-2">9. Limitation of Liability</p>
                <p>To the maximum extent permitted by law, we are not liable for any trading losses, lost profits, or indirect damages. Our total liability shall not exceed the amount you paid to us (if any) in the past 12 months.</p>
              </div>

              <div>
                <p className="font-bold text-slate-200 underline text-sm mb-2">10. Indemnification</p>
                <p>You agree to indemnify and hold harmless TradeMind AI from any claims arising out of your use of the App, your trading activity, or your violation of these Terms.</p>
              </div>

              <div>
                <p className="font-bold text-slate-200 underline text-sm mb-2">11. Termination</p>
                <p>We may suspend or terminate your access at any time, with or without notice, for any reason, including violation of these Terms. You may stop using the App at any time.</p>
              </div>

              <div>
                <p className="font-bold text-slate-200 underline text-sm mb-2">12. Changes to These Terms</p>
                <p>We may update these Terms from time to time. Continued use of the App after changes constitutes acceptance of the updated Terms.</p>
              </div>

              <div>
                <p className="font-bold text-slate-200 underline text-sm mb-2">13. Governing Law</p>
                <p>These Terms are governed by the laws of India, without regard to conflict-of-law principles.</p>
              </div>
            </div>
            <button onClick={() => setShowTermsModal(false)} className="w-full py-4 bg-emerald-500 text-slate-900 font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-xl">Acknowledge Terminal Rules</button>
          </div>
        </div>
      )}

      {/* Refund & Cancellation Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/90 backdrop-blur-lg">
          <div className="bg-[#0e1421] w-full max-w-2xl rounded-[3rem] border border-[#1e293b] p-10 space-y-8 shadow-2xl animate-in zoom-in duration-300">
            <h3 className="text-2xl font-black text-white tracking-tighter">Refund and Cancellation Policy</h3>
            <div className="max-h-[60vh] overflow-y-auto pr-4 text-slate-400 text-xs leading-relaxed space-y-6 no-scrollbar">
              <div>
                <p className="font-bold text-slate-200 underline text-sm mb-2">No Refund Policy</p>
                <p>All payments made to this app/website are final. As our services involve access to digital tools, analytics, and personal data management, once a subscription is purchased, it cannot be canceled, refunded, or transferred under any circumstances.</p>
              </div>

              <div>
                <p className="font-bold text-slate-200 underline text-sm mb-2">Cancellation Policy</p>
                <p>TradeMind AI operates on a subscription-based model. Once your subscription is activated, you will continue to have access until the end of the current billing cycle.</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>You may choose to cancel your subscription at any time.</li>
                  <li>Cancellation will prevent the next renewal, but no refund will be issued for the remaining period of an active subscription.</li>
                </ul>
              </div>

              <div className="p-5 bg-[#070a13] rounded-2xl border border-[#1e293b]">
                <p className="text-slate-300 leading-relaxed italic">
                  The TradeMind AI platform is intended for journaling, analysis, and performance tracking only. We do not provide trading advice, stock recommendations, or financial guidance. All insights and reports are based on user-input data and should be used at your own discretion. Trading and investing involve risk, and we make no guarantee of returns or outcomes based on the use of our platform.
                </p>
              </div>
            </div>
            <button onClick={() => setShowRefundModal(false)} className="w-full py-4 bg-emerald-500 text-slate-900 font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-xl">Confirm Understanding</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthView;
