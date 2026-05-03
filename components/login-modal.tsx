'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
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

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
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
        setError(result.error.message || 'Invalid credentials');
        return;
      }

      onClose();
      router.refresh();
    } catch {
      setError('Something went wrong');
    }
  };

  const handleGoogleLogin = async () => {
    await signIn.social({
      provider: 'google',
      callbackURL: '/',
    });
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 hidden md:block" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50 md:hidden" onClick={onClose} />
        <div className="relative w-full max-w-sm bg-gradient-to-b from-[rgba(24,24,27,0.98)] to-[rgba(24,24,27,0.95)] backdrop-blur-xl rounded-3xl border border-white/5 shadow-2xl p-4">
          <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
          
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
                className="w-full px-3 py-2 rounded-2xl bg-[rgba(39,39,42,0.9)] text-white placeholder-gray-500 text-xs border border-white/5 shadow-inner focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all"
              />
              {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs text-gray-400">Password</label>
              <input
                type="password"
                {...register('password')}
                placeholder="••••••••"
                className="w-full px-3 py-2 rounded-2xl bg-[rgba(39,39,42,0.9)] text-white placeholder-gray-500 text-xs border border-white/5 shadow-inner focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-all"
              />
              {errors.password && <p className="text-red-500 text-xs">{errors.password.message}</p>}
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
        </div>
      </div>
    </>
  );
};
