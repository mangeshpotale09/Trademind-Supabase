
import React, { useEffect, useState } from 'react';
import { User, UserStatus } from '../types';
import { getCurrentUser } from '../services/storageService';

interface UserVerificationStatusProps {
  user: User;
  onLogout: () => void;
  onRetry: () => void;
}

const UserVerificationStatus: React.FC<UserVerificationStatusProps> = ({ user, onLogout, onRetry }) => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  if (user.status === UserStatus.WAITING_APPROVAL) {
    return (
      <div className="min-h-screen bg-[#070a13] flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-[#0e1421] p-12 rounded-[3rem] border border-[#1e293b] shadow-2xl space-y-10 relative overflow-hidden">
          {/* Decorative scanner effect */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent animate-[scan_3s_infinite]"></div>
          
          <div className="space-y-6">
            <div className="w-24 h-24 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(245,158,11,0.1)]">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-3xl font-black text-white tracking-tighter">Under Audit</h2>
              <p className="text-amber-500 text-[10px] font-black uppercase tracking-[0.3em]">Identity Verification Active{dots}</p>
            </div>

            <p className="text-slate-500 text-xs leading-relaxed font-medium">
              Terminal operator <span className="text-white font-black">Mangesh</span> has received your transaction proof. Node synchronization typically completes within <span className="text-slate-300">2-4 hours</span>.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <button 
              onClick={() => window.location.reload()} 
              className="w-full bg-white/5 hover:bg-white/10 text-white font-black py-4 rounded-2xl border border-white/5 text-[10px] uppercase tracking-widest transition-all"
            >
              Check Cloud Status
            </button>
            <button onClick={onLogout} className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-600 hover:text-red-400 transition-colors">Abort & Exit Session</button>
          </div>

          <div className="pt-6 border-t border-[#1e293b]">
             <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Ref ID: {user.displayId}</p>
          </div>
        </div>

        <style>{`
          @keyframes scan {
            0% { transform: translateY(0); opacity: 0; }
            50% { opacity: 1; }
            100% { transform: translateY(400px); opacity: 0; }
          }
        `}</style>
      </div>
    );
  }

  if (user.status === UserStatus.REJECTED) {
    return (
      <div className="min-h-screen bg-[#070a13] flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-[#0e1421] p-12 rounded-[3rem] border border-red-500/20 shadow-2xl space-y-8">
          <div className="w-24 h-24 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto border border-red-500/20">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-white tracking-tighter">Access Denied</h2>
            <p className="text-red-500 text-[10px] font-black uppercase tracking-widest">Verification Fault Detected</p>
          </div>
          <p className="text-slate-500 text-xs leading-relaxed font-medium">Your provided evidence does not match our transaction ledger. Please check the merchant ID and try again.</p>
          
          <div className="flex flex-col gap-4">
            <button onClick={onRetry} className="w-full bg-red-500 hover:bg-red-400 text-slate-900 font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest transition-all">Retry Submission</button>
            <button onClick={onLogout} className="text-[9px] font-black uppercase tracking-widest text-slate-600 hover:text-white transition-colors">Exit</button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default UserVerificationStatus;
