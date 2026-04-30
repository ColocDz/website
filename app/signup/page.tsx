'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signUp, signIn } from '@/lib/auth-client';

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password1, setPassword1] = useState('');
  const [password2, setPassword2] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [agreeToPolicy, setAgreeToPolicy] = useState(false);
  const [passwordMatch, setPasswordMatch] = useState(true);
  const [error, setError] = useState('');

  const handlePasswordChange = (value: string) => {
    setPassword1(value);
    if (password2) {
      setPasswordMatch(value === password2);
    }
  };

  const handleConfirmPasswordChange = (value: string) => {
    setPassword2(value);
    setPasswordMatch(password1 === value);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!agreeToPolicy) {
      setError('Please agree to the terms and conditions');
      return;
    }
    
    if (!passwordMatch) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const result = await signUp.email({
        email,
        password: password1,
        name: `${name} ${lastName}`.trim(),
      });

      if (result.error) {
        setError(result.error.message || 'Failed to create account');
        setIsLoading(false);
        return;
      }

      // Account created and auto-signed in
      router.push('/');
    } catch (err) {
      setError('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    await signIn.social({
      provider: 'google',
      callbackURL: '/',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
      {/* Decorative blur elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>

      {/* Signup Form */}
      <div className="relative w-full max-w-sm z-10">
        <div className="w-full p-4 rounded-3xl bg-gradient-to-b from-[rgba(24,24,27,0.95)] to-[rgba(24,24,27,0.88)] backdrop-blur-xl border border-white/5 shadow-2xl">
          {/* Title */}
          <div className="text-center mb-6">
            <h1 className="text-lg font-semibold text-white tracking-wide">Hi there !</h1>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSignUp} className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs text-gray-400">First Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="John"
                className="w-full px-3 py-2 rounded-2xl bg-[rgba(39,39,42,0.9)] text-white placeholder-gray-500 text-xs border border-white/5 shadow-inner focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-gray-400">Last Name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                placeholder="Doe"
                className="w-full px-3 py-2 rounded-2xl bg-[rgba(39,39,42,0.9)] text-white placeholder-gray-500 text-xs border border-white/5 shadow-inner focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-gray-400">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full px-3 py-2 rounded-2xl bg-[rgba(39,39,42,0.9)] text-white placeholder-gray-500 text-xs border border-white/5 shadow-inner focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-gray-400">Phone Number</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
                placeholder="+213..."
                className="w-full px-3 py-2 rounded-2xl bg-[rgba(39,39,42,0.9)] text-white placeholder-gray-500 text-xs border border-white/5 shadow-inner focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs text-gray-400">Password</label>
              <input
                type="password"
                value={password1}
                onChange={(e) => handlePasswordChange(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full px-3 py-2 rounded-2xl bg-[rgba(39,39,42,0.9)] text-white placeholder-gray-500 text-xs border border-white/5 shadow-inner focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-gray-400">Confirm Password</label>
              <input
                type="password"
                value={password2}
                onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                required
                placeholder="••••••••"
                className={`w-full px-3 py-2 rounded-2xl bg-[rgba(39,39,42,0.9)] text-white placeholder-gray-500 text-xs border shadow-inner focus:outline-none focus:ring-1 transition-all ${
                  password2 && !passwordMatch ? 'border-red-500 focus:ring-red-500/50' : 'border-white/5 focus:ring-blue-500/50'
                }`}
              />
              {password2 && !passwordMatch && <p className="text-xs text-red-500">Passwords do not match</p>}
            </div>

            {/* Policy Agreement Checkbox */}
            <div className="space-y-1.5 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreeToPolicy}
                  onChange={(e) => setAgreeToPolicy(e.target.checked)}
                  className="w-4 h-4 rounded accent-blue-500"
                />
                <span className="text-xs text-gray-400">
                  I agree to the{' '}
                  <Link href="/terms" className="text-blue-400 hover:text-blue-300">
                    Terms and Conditions
                  </Link>
                  {' '}and{' '}
                  <Link href="/privacy" className="text-blue-400 hover:text-blue-300">
                    Privacy Policy
                  </Link>
                </span>
              </label>
            </div>

            {/* Sign Up Button */}
            <button
              type="submit"
              disabled={isLoading || !agreeToPolicy || !passwordMatch}
              className="w-full mt-4 py-2 rounded-full bg-gradient-to-b from-white to-gray-300 text-gray-900 text-xs font-semibold cursor-pointer hover:shadow-xl hover:shadow-white/20 disabled:opacity-50 transition-all shadow-lg shadow-black/25"
            >
              {isLoading ? 'Creating Account...' : 'Sign Up'}
            </button>
          </form>

          {/* Social Logins */}
          <div className="flex gap-2 mt-3">
            {/* Google */}
            <button
              onClick={handleGoogleLogin}
              className="flex-1 px-2 py-2 rounded-2xl bg-[rgba(63,63,70,0.85)] text-gray-300 text-xs font-medium cursor-pointer flex items-center justify-center gap-2 hover:bg-[rgba(63,63,70,1)] transition-all border border-white/5"
            >
              <img
                src="https://www.svgrepo.com/show/475656/google-color.svg"
                alt="Google"
                className="w-3.5 h-3.5"
              />
              <span className="hidden sm:inline">Google</span>
            </button>

            {/* Facebook - disabled until HTTPS */}
            <button
              disabled
              title="Available after deployment with HTTPS"
              className="flex-1 px-2 py-2 rounded-2xl bg-transparent text-gray-400 text-xs font-medium cursor-not-allowed flex items-center justify-center gap-2 border border-white/10 opacity-50"
            >
              <img
                src="https://www.svgrepo.com/show/475647/facebook-color.svg"
                alt="Facebook"
                className="w-3.5 h-3.5 opacity-70"
              />
              <span className="hidden sm:inline">Facebook</span>
            </button>
          </div>

          {/* Footer */}
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              Already have an account?{' '}
              <Link href="/login" className="text-blue-400 hover:text-blue-300 transition-colors">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
