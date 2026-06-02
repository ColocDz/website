'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signUp, signIn } from '@/lib/auth-client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

const signupSchema = z.object({
  name: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phoneNumber: z.string().min(8, 'Phone number must be at least 8 digits'),
  gender: z.enum(['Male', 'Female'], {
    message: 'Please select Male or Female',
  }),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  agreeToPolicy: z.literal(true, {
    error: 'You must agree to the terms and conditions',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type SignupFormData = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormData) => {
    setError('');

    try {
      const result = await signUp.email({
        email: data.email,
        password: data.password,
        name: `${data.name} ${data.lastName}`.trim(),
      });

      if (result.error) {
        setError(result.error.message || 'Failed to create account');
        return;
      }

      // Save additional profile details (gender, phone, lastName)
      try {
        await fetch('/api/user', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lastName: data.lastName,
            phone: data.phoneNumber,
            gender: data.gender,
          }),
        });
      } catch (profileErr) {
        console.error('Failed to save profile details:', profileErr);
      }

      router.push('/');
    } catch (err) {
      setError('Something went wrong. Please try again.');
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
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse"></div>

      <div className="relative w-full max-w-sm z-10">
        <div className="w-full p-4 rounded-3xl bg-gradient-to-b from-[rgba(24,24,27,0.95)] to-[rgba(24,24,27,0.88)] backdrop-blur-xl border border-white/5 shadow-2xl">
          <div className="text-center mb-6">
            <h1 className="text-lg font-semibold text-white tracking-wide">Hi there !</h1>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs text-gray-400">First Name</label>
              <input
                type="text"
                {...register('name')}
                placeholder="John"
                className={`w-full px-3 py-2 rounded-2xl bg-[rgba(39,39,42,0.9)] text-white placeholder-gray-500 text-xs border shadow-inner focus:outline-none focus:ring-1 transition-all ${
                  errors.name ? 'border-red-500/60 focus:ring-red-500/50' : 'border-white/5 focus:ring-blue-500/50'
                }`}
              />
              {errors.name && <p className="text-red-400 text-xs flex items-center gap-1">⚠ {errors.name.message}</p>}
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs text-gray-400">Last Name</label>
              <input
                type="text"
                {...register('lastName')}
                placeholder="Doe"
                className={`w-full px-3 py-2 rounded-2xl bg-[rgba(39,39,42,0.9)] text-white placeholder-gray-500 text-xs border shadow-inner focus:outline-none focus:ring-1 transition-all ${
                  errors.lastName ? 'border-red-500/60 focus:ring-red-500/50' : 'border-white/5 focus:ring-blue-500/50'
                }`}
              />
              {errors.lastName && <p className="text-red-400 text-xs flex items-center gap-1">⚠ {errors.lastName.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-gray-400">Gender</label>
              <select
                {...register('gender')}
                className={`w-full px-3 py-2 rounded-2xl bg-[rgba(39,39,42,0.9)] text-white text-xs border shadow-inner focus:outline-none focus:ring-1 transition-all ${
                  errors.gender ? 'border-red-500/60 focus:ring-red-500/50' : 'border-white/5 focus:ring-blue-500/50'
                }`}
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
              {errors.gender && <p className="text-red-400 text-xs flex items-center gap-1">⚠ {errors.gender.message}</p>}
            </div>

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
              <label className="text-xs text-gray-400">Phone Number</label>
              <input
                type="tel"
                {...register('phoneNumber')}
                placeholder="+213..."
                className={`w-full px-3 py-2 rounded-2xl bg-[rgba(39,39,42,0.9)] text-white placeholder-gray-500 text-xs border shadow-inner focus:outline-none focus:ring-1 transition-all ${
                  errors.phoneNumber ? 'border-red-500/60 focus:ring-red-500/50' : 'border-white/5 focus:ring-blue-500/50'
                }`}
              />
              {errors.phoneNumber && <p className="text-red-400 text-xs flex items-center gap-1">⚠ {errors.phoneNumber.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-gray-400">Password</label>
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

            <div className="space-y-1.5">
              <label className="text-xs text-gray-400">Confirm Password</label>
              <input
                type="password"
                {...register('confirmPassword')}
                placeholder="••••••••"
                className={`w-full px-3 py-2 rounded-2xl bg-[rgba(39,39,42,0.9)] text-white placeholder-gray-500 text-xs border shadow-inner focus:outline-none focus:ring-1 transition-all ${
                  errors.confirmPassword ? 'border-red-500/60 focus:ring-red-500/50' : 'border-white/5 focus:ring-blue-500/50'
                }`}
              />
              {errors.confirmPassword && <p className="text-red-400 text-xs flex items-center gap-1">⚠ {errors.confirmPassword.message}</p>}
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('agreeToPolicy')}
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
              {errors.agreeToPolicy && <p className="text-red-400 text-xs flex items-center gap-1">⚠ {errors.agreeToPolicy.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-4 py-2 rounded-full bg-gradient-to-b from-white to-gray-300 text-gray-900 text-xs font-semibold cursor-pointer hover:shadow-xl hover:shadow-white/20 disabled:opacity-50 transition-all shadow-lg shadow-black/25"
            >
              {isSubmitting ? 'Creating Account...' : 'Sign Up'}
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
