'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { CaptchaModal } from './captcha-modal';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showCaptcha, setShowCaptcha] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Show captcha verification after 500ms
    setTimeout(() => {
      setIsLoading(false);
      setShowCaptcha(true);
    }, 500);
  };

  const handleCaptchaVerify = () => {
    localStorage.setItem('isLoggedIn', 'true');
    setShowCaptcha(false);
    onClose();
    router.refresh();
  };

  const handleSocialLogin = (provider: string) => {
    localStorage.setItem('isLoggedIn', 'true');
    onClose();
    router.refresh();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Captcha Modal */}
      <CaptchaModal isOpen={showCaptcha} onVerify={handleCaptchaVerify} />

      {/* Overlay - Blurred only on desktop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 hidden md:block"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Dark overlay for mobile */}
        <div
          className="fixed inset-0 bg-black/50 md:hidden"
          onClick={onClose}
        />

        {/* Modal Content */}
        <div className="relative w-full max-w-sm bg-gradient-to-b from-[rgba(24,24,27,0.98)] to-[rgba(24,24,27,0.95)] backdrop-blur-xl rounded-3xl border border-white/5 shadow-2xl p-4">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>

          {/* Title */}
          <div className="text-center mb-6 pt-2">
            <h1 className="text-lg font-semibold text-white tracking-wide">Welcome back</h1>
          </div>

          {/* Form */}
          <form onSubmit={handleSignIn} className="space-y-3">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs text-gray-400">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3 py-2 rounded-2xl bg-[rgba(39,39,42,0.9)] text-white placeholder-gray-500 text-xs border border-white/5 shadow-inner focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs text-gray-400">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 rounded-2xl bg-[rgba(39,39,42,0.9)] text-white placeholder-gray-500 text-xs border border-white/5 shadow-inner focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all"
              />
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-2 rounded-full bg-gradient-to-b from-white to-gray-300 text-gray-900 text-xs font-semibold cursor-pointer hover:shadow-xl hover:shadow-white/20 disabled:opacity-50 transition-all shadow-lg shadow-black/25"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          {/* Social Logins */}
          <div className="flex gap-2 mt-3">
            {/* Google */}
            <button
              onClick={() => handleSocialLogin('google')}
              className="flex-1 px-2 py-2 rounded-2xl bg-[rgba(63,63,70,0.85)] text-gray-300 text-xs font-medium cursor-pointer flex items-center justify-center gap-2 hover:bg-[rgba(63,63,70,1)] transition-all border border-white/5"
            >
              <img
                src="https://www.svgrepo.com/show/475656/google-color.svg"
                alt="Google"
                className="w-3.5 h-3.5"
              />
              <span className="hidden sm:inline">Google</span>
            </button>

            {/* Facebook */}
            <button
              onClick={() => handleSocialLogin('facebook')}
              className="flex-1 px-2 py-2 rounded-2xl bg-transparent text-gray-400 text-xs font-medium cursor-pointer flex items-center justify-center gap-2 border border-white/10 hover:border-white/20 hover:text-gray-300 transition-all"
            >
              <img
                src="https://www.svgrepo.com/show/475647/facebook-color.svg"
                alt="Facebook"
                className="w-3.5 h-3.5 opacity-70"
              />
              <span className="hidden sm:inline">Facebook</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
