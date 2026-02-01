
import React from 'react';
import { User, UserStatus } from '../types';

interface UserVerificationStatusProps {
  user: User;
  onLogout: () => void;
  onRetry: () => void;
}

const UserVerificationStatus: React.FC<UserVerificationStatusProps> = ({ user, onLogout, onRetry }) => {
  if (user.status === UserStatus.WAITING_APPROVAL) {
    return (
      <div className="min-h-screen bg-[#070a13] flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-[#0e1421] p-12 rounded-[3.5rem] border border-[#1e293b] shadow-2xl space-y-10 animate-in fade-in zoom-in duration-700 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-orange-500/30">
            <div className="h-full bg-orange-500 w-1/2 animate-[loading_2s_infinite]"></div>
          </div>

          <div className="w-24 h-24 bg-orange-500/10 text-orange-500 rounded-[2.5rem] flex items-center justify-center mx-auto border border-orange-500/20 animate-pulse">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-3xl font-black text-white tracking-tighter">Activation Pending</h2>
            <p className="text-slate-500 text-xs leading-relaxed font-medium">Your settlement proof is currently in the audit queue. Verification usually takes 1-2 hours during market hours.</p>
          </div>
          
          <div className="pt-8 border-t border-[#1e293b] space-y-6">
            <div className="bg-[#0a0f1d] p-6 rounded-3xl border border-[#1e293b] space-y-4">
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Need instant access?</p>
               <a href="https://wa.me/91XXXXXXXXXX" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-3 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-emerald-500/10">
                 WhatsApp Risk Desk
                 <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.246 2.248 3.484 5.232 3.483 8.413-.003 6.557-5.338 11.892-11.893 11.892-1.997-.001-3.951-.5-5.688-1.448l-6.308 1.654zm6.233-3.762c1.508.893 3.078 1.364 4.671 1.365 5.439 0 9.865-4.426 9.868-9.866.002-2.628-1.022-5.1-2.883-6.963-1.861-1.862-4.332-2.887-6.961-2.888-5.442 0-9.866 4.426-9.869 9.866-.001 1.79.483 3.531 1.397 5.051l-1.088 3.972 4.065-1.067z"></path></svg>
               </a>
            </div>

            <div className="flex flex-col gap-3">
              <button onClick={() => window.location.reload()} className="w-full bg-white/5 hover:bg-white/10 text-white font-black py-4 rounded-2xl border border-white/10 text-[10px] uppercase tracking-widest transition-all">Check Access Status</button>
              <button onClick={onLogout} className="text-[9px] font-black uppercase tracking-widest text-slate-600 hover:text-red-400 transition-colors">Sign Out</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (user.status === UserStatus.REJECTED) {
    return (
      <div className="min-h-screen bg-[#070a13] flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-[#0e1421] p-12 rounded-[3.5rem] border border-[#1e293b] shadow-2xl space-y-10">
          <div className="w-24 h-24 bg-red-500/10 text-red-500 rounded-[2.5rem] flex items-center justify-center mx-auto border border-red-500/20">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
          </div>
          <div className="space-y-4">
            <h2 className="text-3xl font-black text-white tracking-tighter">Settlement Rejected</h2>
            <p className="text-slate-500 text-xs leading-relaxed font-medium">The uploaded settlement signature could not be verified. Please ensure the screenshot clearly shows the transaction ID and amount.</p>
          </div>
          
          <div className="flex flex-col gap-4">
            <button onClick={onRetry} className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black py-5 rounded-[2rem] text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl shadow-emerald-500/10">Re-Submit Identity Proof</button>
            <div className="pt-6 border-t border-[#1e293b] space-y-4 text-center">
               <a href="mailto:support@trademind.ai" className="block text-[10px] font-black text-blue-400 uppercase tracking-widest hover:underline">Manual Audit Request</a>
               <button onClick={onLogout} className="text-[9px] font-black uppercase tracking-widest text-slate-600 hover:text-white transition-colors">Sign Out</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default UserVerificationStatus;
