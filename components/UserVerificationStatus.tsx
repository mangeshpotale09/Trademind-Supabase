
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
        <div className="max-w-md bg-[#0e1421] p-10 rounded-3xl border border-[#1e293b] shadow-2xl space-y-6">
          <div className="w-20 h-20 bg-orange-500/10 text-orange-500 rounded-full flex items-center justify-center mx-auto animate-pulse">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          </div>
          <h2 className="text-2xl font-black text-white">Verification in Progress</h2>
          <p className="text-slate-500 text-sm leading-relaxed font-medium">Your payment proof has been submitted. An administrator (Mangesh) will review and grant access to your terminal within 2-4 hours.</p>
          <div className="flex flex-col gap-4">
            <button 
              onClick={() => window.location.reload()} 
              className="bg-orange-500 hover:bg-orange-400 text-slate-900 font-black px-8 py-3 rounded-xl text-xs uppercase tracking-widest transition-all"
            >
              Refresh Status
            </button>
            <button onClick={onLogout} className="text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-white transition-colors">Logout & Refresh Later</button>
          </div>
        </div>
      </div>
    );
  }

  if (user.status === UserStatus.REJECTED) {
    return (
      <div className="min-h-screen bg-[#070a13] flex items-center justify-center p-6 text-center">
        <div className="max-w-md bg-[#0e1421] p-10 rounded-3xl border border-[#1e293b] shadow-2xl space-y-6">
          <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </div>
          <h2 className="text-2xl font-black text-white">Verification Failed</h2>
          <p className="text-slate-500 text-sm leading-relaxed font-medium">Your payment proof was rejected. Please contact support or re-submit a valid transaction screenshot.</p>
          <button onClick={onRetry} className="bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black px-8 py-3 rounded-xl text-xs uppercase tracking-widest transition-all">Retry Submission</button>
          <button onClick={onLogout} className="block w-full text-[10px] font-black uppercase tracking-widest text-slate-600 hover:text-white transition-colors">Logout</button>
        </div>
      </div>
    );
  }

  return null;
};

export default UserVerificationStatus;
