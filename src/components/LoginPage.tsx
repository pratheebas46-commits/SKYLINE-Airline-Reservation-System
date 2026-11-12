import React, { useState, useEffect } from 'react';
import {
  Lock,
  User as UserIcon,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  ArrowRight,
  Plane,
  Eye,
  EyeOff,
  ShieldAlert
} from 'lucide-react';
import { db } from '../services/db';
import { User } from '../types';

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
  onNavigate: (view: string) => void;
}

// Generate simple 5-character alphanumeric captcha locally
function generateLocalCaptcha(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let str = '';
  for (let i = 0; i < 5; i++) {
    str += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return str;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onNavigate }) => {
  const [authPortal, setAuthPortal] = useState<'customer' | 'admin'>('customer');
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [captchaCode, setCaptchaCode] = useState(generateLocalCaptcha);
  const [userCaptchaInput, setUserCaptchaInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const handleRefreshCaptcha = () => {
    setCaptchaCode(generateLocalCaptcha());
    setUserCaptchaInput('');
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate captcha locally
    if (userCaptchaInput.trim().toUpperCase() !== captchaCode.toUpperCase()) {
      setError('Incorrect Captcha code. Please enter the characters shown in the box.');
      handleRefreshCaptcha();
      return;
    }

    if (!usernameOrEmail.trim() || !password) {
      setError('Please provide your Username/Email and Password.');
      return;
    }

    // Call existing authentication system
    const user = db.login(usernameOrEmail.trim(), password);
    if (!user) {
      setError('Invalid Username/Email or Password. Please verify your credentials or register a new account.');
      handleRefreshCaptcha();
      return;
    }

    if (authPortal === 'admin') {
      if (user.role !== 'admin') {
        setError(`Access Restricted: Account "@${user.username}" is registered as "${user.role.toUpperCase()}". Only accounts with Administrator privileges can access this panel.`);
        handleRefreshCaptcha();
        return;
      }
      onLoginSuccess(user);
      onNavigate('admin');
      return;
    }

    onLoginSuccess(user);
    if (user.role === 'admin') {
      onNavigate('admin');
    } else if (user.role === 'staff') {
      onNavigate('staff');
    } else {
      onNavigate('home');
    }
  };

  return (
    <div className="max-w-md mx-auto py-6">
      
      {/* Portal Selection Tabs (Keeping customer and admin strictly separate) */}
      <div className="flex bg-slate-200 p-1.5 rounded-2xl mb-4 text-xs font-bold shadow-inner">
        <button
          id="portal-tab-customer"
          type="button"
          onClick={() => {
            setAuthPortal('customer');
            setError(null);
            handleRefreshCaptcha();
          }}
          className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
            authPortal === 'customer'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Plane className="w-4 h-4" />
          <span>Customer & Staff</span>
        </button>

        <button
          id="portal-tab-admin"
          type="button"
          onClick={() => {
            setAuthPortal('admin');
            setError(null);
            handleRefreshCaptcha();
          }}
          className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
            authPortal === 'admin'
              ? 'bg-purple-700 text-white shadow-sm'
              : 'text-slate-600 hover:text-purple-700'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Admin Portal</span>
        </button>
      </div>

      {/* Portal Container */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        
        {/* Portal Header */}
        <div className={`p-6 text-white text-center relative transition-colors ${
          authPortal === 'admin'
            ? 'bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950'
            : 'bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900'
        }`}>
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 text-white shadow-lg ${
            authPortal === 'admin' ? 'bg-purple-600 shadow-purple-500/25' : 'bg-blue-600 shadow-blue-500/25'
          }`}>
            {authPortal === 'admin' ? (
              <ShieldAlert className="w-6 h-6" />
            ) : (
              <Plane className="w-6 h-6 -rotate-45" />
            )}
          </div>
          
          {authPortal === 'admin' ? (
            <>
              <span className="inline-block px-3 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30 text-[10px] font-bold uppercase tracking-wider mb-1">
                Restricted Airline Access
              </span>
              <h2 className="text-xl font-black tracking-tight">Administrator Access Portal</h2>
              <p className="text-xs text-slate-300 mt-1">
                Sign in with verified administrator credentials to access flight control & system settings
              </p>
            </>
          ) : (
            <>
              <h2 className="text-xl font-black tracking-tight">Passenger & Staff Login</h2>
              <p className="text-xs text-slate-300 mt-1">
                Access your bookings, boarding pass, and personalized travel profile
              </p>
            </>
          )}
        </div>

        {/* Portal Body */}
        <div className="p-6 sm:p-8 space-y-5">
          
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
            {/* Username or Email */}
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1.5">
                Username or Email Address *
              </label>
              <div className="relative">
                <input
                  id="login-username-input"
                  type="text"
                  required
                  value={usernameOrEmail}
                  onChange={e => setUsernameOrEmail(e.target.value)}
                  placeholder={authPortal === 'admin' ? "admin or admin@airline.com" : "e.g. your_username or email@domain.com"}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-bold text-slate-700 uppercase tracking-wider text-[11px]">
                  Password *
                </label>
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(true)}
                  className="text-blue-600 hover:text-blue-700 font-semibold text-[11px]"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <input
                  id="login-password-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl pl-9 pr-10 py-2.5 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Captcha Section (Completely Local) */}
            <div className="pt-1">
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1.5">
                Security Verification Captcha *
              </label>

              <div className="flex items-center gap-3">
                {/* Stylized Captcha Canvas Box */}
                <div
                  className="px-4 py-2 bg-slate-100 border border-slate-300 rounded-xl select-none font-mono tracking-widest text-lg font-black text-slate-800 shadow-inner flex items-center justify-center relative overflow-hidden"
                  style={{
                    backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)',
                    backgroundSize: '8px 8px',
                  }}
                  title="Verification Captcha"
                >
                  <span className="transform -rotate-2 inline-block text-blue-900 font-serif">
                    {captchaCode}
                  </span>
                  {/* Subtle scratch line */}
                  <div className="absolute inset-0 border-t border-slate-400/40 transform rotate-6 pointer-events-none"></div>
                </div>

                <button
                  type="button"
                  onClick={handleRefreshCaptcha}
                  className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors"
                  title="Generate new Captcha"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>

                <input
                  id="login-captcha-input"
                  type="text"
                  required
                  maxLength={5}
                  value={userCaptchaInput}
                  onChange={e => setUserCaptchaInput(e.target.value.toUpperCase())}
                  placeholder="Enter Captcha"
                  className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">Captcha is case-insensitive and generated locally</p>
            </div>

            {/* Submit Button */}
            <button
              id="login-page-submit-btn"
              type="submit"
              className={`w-full mt-2 py-3 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer ${
                authPortal === 'admin'
                  ? 'bg-purple-700 hover:bg-purple-800 shadow-purple-700/25'
                  : 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
              }`}
            >
              <span>{authPortal === 'admin' ? 'Enter Admin Control Center' : 'Login to Passenger Portal'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* New User Register Link (Only for Customer Portal) */}
          {authPortal === 'customer' ? (
            <div className="pt-3 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-600">
                New Passenger?{' '}
                <button
                  id="login-page-register-btn"
                  onClick={() => onNavigate('register')}
                  className="font-bold text-blue-600 hover:underline"
                >
                  Register Customer Account
                </button>
              </p>
            </div>
          ) : (
            <div className="pt-3 border-t border-slate-100 text-center">
              <p className="text-[11px] text-slate-500">
                Authorized airline administrative personnel only. Customer accounts must use the Passenger Portal.
              </p>
            </div>
          )}

        </div>

      </div>

      {/* Forgot Password Modal (Local simulation) */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-sm text-slate-900">Reset Portal Password</h3>
            </div>

            {!forgotSuccess ? (
              <form
                onSubmit={e => {
                  e.preventDefault();
                  if (forgotEmail) {
                    setForgotSuccess(true);
                  }
                }}
                className="space-y-3 text-xs"
              >
                <p className="text-slate-500">
                  Enter your registered email address. We will verify your account in the local database.
                </p>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                    placeholder="customer@airline.com"
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 font-semibold"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsForgotModalOpen(false);
                      setForgotSuccess(false);
                    }}
                    className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold"
                  >
                    Send Reset Link
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-3 text-xs text-center py-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <p className="font-bold text-slate-800">Password Reset Instructions Sent</p>
                <p className="text-slate-500">
                  Password recovery for <span className="font-semibold text-slate-700">{forgotEmail}</span> has been processed. Default password for demo users is <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">password123</code>.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotModalOpen(false);
                    setForgotSuccess(false);
                  }}
                  className="w-full py-2 bg-blue-600 text-white rounded-xl font-bold"
                >
                  Return to Login
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
