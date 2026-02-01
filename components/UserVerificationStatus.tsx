
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
        <div className="max-w-md bg-[#0e1421] p-12 rounded-[3rem] border border-[#1e293b] shadow-2xl space-y-8 animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 bg-orange-500/10 text-orange-500 rounded-[2rem] flex items-center justify-center mx-auto animate-pulse border border-orange-500/20">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-black text-white tracking-tighter">Identity Verification</h2>
            <p className="text-slate-500 text-[11px] leading-relaxed font-medium uppercase tracking-tight">Your payment proof has been queued for subject audit. Verification usually takes 1-2 hours during active market hours.</p>
          </div>
          
          <div className="pt-6 border-t border-[#1e293b] space-y-6">
            <div className="space-y-2">
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Urgent Requirement?</p>
              <a href="https://wa.me/91XXXXXXXXXX" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 text-emerald-500 font-black text-[11px] uppercase tracking-widest hover:underline transition-all">
                Contact Verification Desk
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.246 2.248 3.484 5.232 3.483 8.413-.003 6.557-5.338 11.892-11.893 11.892-1.997-.001-3.951-.5-5.688-1.448l-6.308 1.654zm6.233-3.762c1.508.893 3.078 1.364 4.671 1.365 5.439 0 9.865-4.426 9.868-9.866.002-2.628-1.022-5.1-2.883-6.963-1.861-1.862-4.332-2.887-6.961-2.888-5.442 0-9.866 4.426-9.869 9.866-.001 1.79.483 3.531 1.397 5.051l-1.088 3.972 4.065-1.067z"></path></svg>
              </a>
            </div>

            <div className="flex flex-col gap-3">
              <button onClick={() => window.location.reload()} className="w-full bg-white/5 hover:bg-white/10 text-white font-black py-4 rounded-2xl border border-white/10 text-[10px] uppercase tracking-widest transition-all">Refresh Status</button>
              <button onClick={onLogout} className="w-full text-[9px] font-black uppercase tracking-widest text-slate-600 hover:text-red-400 transition-colors">Sign Out</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (user.status === UserStatus.REJECTED) {
    return (
      <div className="min-h-screen bg-[#070a13] flex items-center justify-center p-6 text-center">
        <div className="max-w-md bg-[#0e1421] p-12 rounded-[3rem] border border-[#1e293b] shadow-2xl space-y-8">
          <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-[2rem] flex items-center justify-center mx-auto border border-red-500/20">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-black text-white tracking-tighter">Terminal Authorization Denied</h2>
            <p className="text-slate-500 text-[11px] leading-relaxed font-medium uppercase tracking-tight">The provided payment signature was invalid or could not be verified by our systems. Please re-submit your proof or contact support.</p>
          </div>
          
          <div className="flex flex-col gap-4">
            <button onClick={onRetry} className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black py-4 rounded-2xl text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl shadow-emerald-500/10">Re-Submit Identity Proof</button>
            <div className="pt-6 border-t border-[#1e293b] space-y-4">
               <a href="mailto:support@trademind.ai" className="block text-[10px] font-black text-blue-400 uppercase tracking-widest hover:underline">Request Manual Audit (Email)</a>
               <button onClick={onLogout} className="block w-full text-[9px] font-black uppercase tracking-widest text-slate-600 hover:text-white transition-colors">Logout</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default UserVerificationStatus;
