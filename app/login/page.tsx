'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from '@/lib/auth-client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setError('');

    try {
      const result = await signIn.email({
        email: data.email,
        password: data.password,
      });

      if (result.error) {
        // better-auth returns 'Invalid email or password' on bad credentials
        const msg = result.error.message || '';
        if (msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('credentials') || msg.toLowerCase().includes('password')) {
          setError('Incorrect email or password. Please try again.');
        } else {
          setError(msg || 'Sign in failed. Please try again.');
        }
        return;
      }

      router.push('/');
    } catch (err) {
      setError('Something went wrong. Please check your connection and try again.');
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
      <div className="absolute top-20 right-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
      <div className="absolute bottom-20 left-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>

      <div className="relative w-full max-w-sm z-10">
        <div className="w-full p-4 rounded-3xl bg-gradient-to-b from-[rgba(24,24,27,0.95)] to-[rgba(24,24,27,0.88)] backdrop-blur-xl border border-white/5 shadow-2xl">
          <div className="text-center mb-6 pt-2">
            <h1 className="text-lg font-semibold text-white tracking-wide">Welcome back</h1>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs text-gray-400">Email</label>
              <input
                type="email"
                {...register('email')}
                placeholder="you@example.com"
                className={`w-full px-3 py-2 rounded-2xl bg-[rgba(39,39,42,0.9)] text-white placeholder-gray-500 text-xs border shadow-inner focus:outline-none focus:ring-1 transition-all ${
                  errors.email ? 'border-red-500/60 focus:ring-red-500/50' : 'border-white/5 focus:ring-blue-500/50'
                }`}
              />
              {errors.email && <p className="text-red-400 text-xs flex items-center gap-1">⚠ {errors.email.message}</p>}
            </div>
            
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs text-gray-400">Password</label>
                <span className="text-xs text-blue-400/60 cursor-not-allowed" title="Forgot password – coming soon">
                  Forgot password?
                </span>
              </div>
              <input
                type="password"
                {...register('password')}
                placeholder="••••••••"
                className={`w-full px-3 py-2 rounded-2xl bg-[rgba(39,39,42,0.9)] text-white placeholder-gray-500 text-xs border shadow-inner focus:outline-none focus:ring-1 transition-all ${
                  errors.password ? 'border-red-500/60 focus:ring-red-500/50' : 'border-white/5 focus:ring-blue-500/50'
                }`}
              />
              {errors.password && <p className="text-red-400 text-xs flex items-center gap-1">⚠ {errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-2 rounded-full bg-gradient-to-b from-white to-gray-300 text-gray-900 text-xs font-semibold cursor-pointer hover:shadow-xl hover:shadow-white/20 disabled:opacity-50 transition-all shadow-lg shadow-black/25"
            >
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="flex gap-2 mt-3">
            <button
              onClick={handleGoogleLogin}
              className="flex-1 px-2 py-2 rounded-2xl bg-[rgba(63,63,70,0.85)] text-gray-300 text-xs font-medium cursor-pointer flex items-center justify-center gap-2 hover:bg-[rgba(63,63,70,1)] transition-all border border-white/5"
            >
              <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Google</span>
            </button>
            <button disabled title="Available after deployment with HTTPS" className="flex-1 px-2 py-2 rounded-2xl bg-transparent text-gray-400 text-xs font-medium cursor-not-allowed flex items-center justify-center gap-2 border border-white/10 opacity-50">
              <img src="https://www.svgrepo.com/show/475647/facebook-color.svg" alt="Facebook" className="w-3.5 h-3.5 opacity-70" />
              <span className="hidden sm:inline">Facebook</span>
            </button>
          </div>

          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              Don't have an account?{' '}
              <Link href="/signup" className="text-blue-400 hover:text-blue-300 transition-colors">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
