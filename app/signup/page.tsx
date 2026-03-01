'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password1, setPassword1] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [name , setName]= useState('');
  const [lastName, setLastName]= useState('');
  const [phoneNumber , setPhoneNumber] = useState('');
  const [password2, setPassword2] = useState('');


  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate login
    setTimeout(() => {
      localStorage.setItem('isLoggedIn', 'true');
      setIsLoading(false);
      router.push('/');
    }, 500);
  };

  const handleSocialLogin = (provider: string) => {
    localStorage.setItem('isLoggedIn', 'true');
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
      {/* Decorative blur elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>

      {/* Login Form */}
      <div className="relative w-full max-w-sm z-10">
        <div className="w-full p-4 rounded-3xl bg-gradient-to-b from-[rgba(24,24,27,0.95)] to-[rgba(24,24,27,0.88)] backdrop-blur-xl border border-white/5 shadow-2xl">
          {/* Title */}
          <div className="text-center mb-6">
            <h1 className="text-lg font-semibold text-white tracking-wide">Hi there !</h1>
          </div>

          {/* Form */}
          <form onSubmit={handleSignIn} className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs text-gray-400">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder=""
                className="w-full px-3 py-2 rounded-2xl bg-[rgba(39,39,42,0.9)] text-white placeholder-gray-500 text-xs border border-white/5 shadow-inner focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-gray-400">LastName</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder=""
                className="w-full px-3 py-2 rounded-2xl bg-[rgba(39,39,42,0.9)] text-white placeholder-gray-500 text-xs border border-white/5 shadow-inner focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all"
              />
            </div>
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
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs text-gray-400">Phone number</label>
              <input
                type="number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+213"
                className="w-full px-3 py-2 rounded-2xl bg-[rgba(39,39,42,0.9)] text-white placeholder-gray-500 text-xs border border-white/5 shadow-inner focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs text-gray-400">Password</label>
              <input
                type="password"
                value={password1}
                onChange={(e) => getPassword(e.target.value)} // a function to confirm the password with the next one
                placeholder="••••••••"
                className="w-full px-3 py-2 rounded-2xl bg-[rgba(39,39,42,0.9)] text-white placeholder-gray-500 text-xs border border-white/5 shadow-inner focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-gray-400">Password</label>
              <input
                type="password"
                value={password2}
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
    </div>
  );
}
