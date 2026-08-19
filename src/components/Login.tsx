import React, { useState } from 'react';
import { Car, Shield, Users, Clock, Mail, Lock, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';
import { auth, signInWithEmailAndPassword, sendPasswordResetEmail } from '../firebase';

interface LoginProps {
  onShowSignup: () => void;
}

export default function Login({ onShowSignup }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Please enter your email address to reset password.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage("Password reset email sent! Check your inbox.");
    } catch (err: any) {
      setError(err.message || "Failed to send reset email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-dvh max-h-dvh w-full bg-slate-50 flex flex-col justify-center items-center p-3 sm:p-6 overflow-hidden relative">
      <div className="max-w-sm sm:max-w-md w-full my-auto flex flex-col gap-2.5 sm:gap-3.5">
        {/* Mobile Compact Header */}
        <div className="text-center flex items-center justify-center gap-2.5">
          <div className="w-10 h-10 sm:w-12 sm:h-12 gradient-brand rounded-xl shadow-md shadow-indigo-200 flex items-center justify-center shrink-0">
            <Car className="text-white w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="text-left">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 font-display leading-none">
              SteerSafe
            </h1>
            <p className="text-slate-500 text-[10px] sm:text-xs font-semibold mt-0.5">Driving School Mobile Portal</p>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-xl shadow-slate-200/60 border border-slate-100 flex flex-col gap-2.5 sm:gap-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div>
              <h2 className="text-base font-black text-slate-900">Welcome Back</h2>
              <p className="text-[11px] text-slate-500 font-medium">Sign in to your account</p>
            </div>
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
              Sign In
            </span>
          </div>

          <form onSubmit={handleLogin} className="space-y-3.5">
            {error && (
              <div className="bg-rose-50 text-rose-600 p-2 rounded-lg flex items-center gap-1.5 text-[11px] font-bold animate-in fade-in">
                <AlertCircle size={14} className="shrink-0" />
                <span className="leading-tight truncate">{error}</span>
              </div>
            )}
            {message && (
              <div className="bg-emerald-50 text-emerald-600 p-2 rounded-lg flex items-center gap-1.5 text-[11px] font-bold animate-in fade-in">
                <CheckCircle2 size={14} className="shrink-0" />
                <span className="leading-tight truncate">{message}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-indigo-600 text-xs font-bold text-slate-900"
                  placeholder="name@steersafe.com"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center px-0.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Password</label>
                <button 
                  type="button" 
                  onClick={handleForgotPassword}
                  className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                >
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:border-indigo-600 text-xs font-bold text-slate-900"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[44px] flex items-center justify-center gap-2 gradient-brand text-white font-black text-xs sm:text-sm py-2.5 px-4 rounded-xl shadow-md shadow-indigo-200 transition-all cursor-pointer touch-press active:scale-95 disabled:opacity-50 mt-1"
            >
              {loading ? "Signing in..." : "Sign In to Account"}
              <ArrowRight size={14} />
            </button>
          </form>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] sm:text-xs text-slate-500 font-medium">New Student?</span>
            <button
              onClick={onShowSignup}
              className="text-[11px] sm:text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded-lg border border-indigo-100 transition-all cursor-pointer touch-press"
            >
              Create Account
            </button>
          </div>
        </div>

        {/* Footer Role Badges */}
        <div className="flex justify-center gap-3 text-slate-400 text-[9px] font-bold uppercase tracking-wider">
          <span className="flex items-center gap-1"><Users size={11} /> Students</span>
          <span className="flex items-center gap-1"><Shield size={11} /> Instructors</span>
          <span className="flex items-center gap-1"><Clock size={11} /> Parents</span>
        </div>
      </div>
    </div>
  );
}

