'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Smartphone, CheckCircle, AlertCircle, Loader2, ArrowRight, ShieldCheck } from 'lucide-react';

interface PhoneOtpVerificationProps {
  initialPhone?: string;
  isAlreadyVerified?: boolean;
  onVerified?: () => void;
}

export default function PhoneOtpVerification({
  initialPhone = '',
  isAlreadyVerified = false,
  onVerified
}: PhoneOtpVerificationProps) {
  const [phone, setPhone] = useState(initialPhone);
  const [step, setStep] = useState<'input' | 'otp' | 'verified'>(isAlreadyVerified ? 'verified' : 'input');
  
  // OTP 6-digit input array
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [cooldown, setCooldown] = useState(0);

  // Sync phone if initialPhone changes
  useEffect(() => {
    if (initialPhone && !phone) {
      setPhone(initialPhone);
    }
  }, [initialPhone]);

  // Cooldown timer effect
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanedPhone = phone.replace(/\D/g, '');
    if (!/^(0?)(5|6|7)\d{8}$/.test(cleanedPhone)) {
      setErrorMsg('Please enter a valid Algerian phone number (e.g. 0550123456 or 550123456).');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/phone-otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanedPhone })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send verification code');
      }

      setSuccessMsg(data.message || 'Verification code sent via SMS!');
      setStep('otp');
      setCooldown(60);
      
      // Auto-focus first input box
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 150);

    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send SMS code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Take single character
    setOtp(newOtp);

    // Auto-advance to next input box
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasteData) {
      const newOtp = pasteData.split('').concat(Array(6).fill('')).slice(0, 6);
      setOtp(newOtp);
      inputRefs.current[Math.min(pasteData.length, 5)]?.focus();
    }
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const fullCode = otp.join('');
    if (fullCode.length !== 6) {
      setErrorMsg('Please enter all 6 digits of your verification code.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/phone-otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: fullCode })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Invalid verification code');
      }

      setStep('verified');
      setSuccessMsg('Phone number verified successfully! ✓');
      if (onVerified) onVerified();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to verify code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Verified View ───
  if (step === 'verified' || isAlreadyVerified) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-emerald-100 p-3 rounded-full text-emerald-600">
            <ShieldCheck size={28} />
          </div>
          <div>
            <h3 className="font-bold text-emerald-900 text-base">Phone Verified ✓</h3>
            <p className="text-emerald-700 text-xs mt-0.5">
              Your phone number is verified. Full roommate details and contact options are unlocked.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-6">
      <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
        <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
          <Smartphone size={24} />
        </div>
        <div>
          <h3 className="font-bold text-gray-900 text-lg">Phone Number SMS Verification</h3>
          <p className="text-xs text-gray-500">Verify your mobile number via 6-digit SMS code to unlock listing contact features.</p>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2 animate-shake">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-start gap-2">
          <CheckCircle size={16} className="flex-shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Step 1: Input Phone Number */}
      {step === 'input' && (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wider">
              Algerian Mobile Number
            </label>
            <div className="flex gap-2">
              <span className="flex items-center px-4 border border-gray-300 bg-gray-50 rounded-xl text-gray-600 text-sm font-semibold">
                🇩🇿 +213
              </span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0558 123 456"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-transparent outline-none text-sm font-medium"
                disabled={isLoading}
              />
            </div>
            <p className="text-[11px] text-gray-400 mt-1.5">Enter your 9 or 10-digit mobile number starting with 05, 06, or 07.</p>
          </div>

          <button
            type="submit"
            disabled={isLoading || !phone.trim()}
            className="w-full py-3 bg-black text-white rounded-xl font-bold hover:bg-gray-800 disabled:opacity-50 transition-all flex items-center justify-center gap-2 text-sm shadow-md"
          >
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Sending SMS Code...
              </>
            ) : (
              <>
                Send 6-Digit SMS Code
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      )}

      {/* Step 2: Input 6-Digit OTP */}
      {step === 'otp' && (
        <form onSubmit={handleVerifyOtp} className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-xs text-gray-600">
              Enter the 6-digit verification code sent via SMS to:
            </p>
            <p className="font-bold text-gray-900 text-sm dir-ltr">
              +213 {phone.replace(/\D/g, '').slice(-9)}
            </p>
          </div>

          {/* 6 Digit Input Boxes */}
          <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => { inputRefs.current[idx] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className="w-11 h-13 sm:w-12 sm:h-14 border-2 border-gray-300 rounded-xl text-center font-bold text-xl focus:border-black focus:ring-2 focus:ring-black outline-none transition-all bg-gray-50 focus:bg-white"
                disabled={isLoading}
              />
            ))}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => { setStep('input'); setErrorMsg(''); setOtp(['', '', '', '', '', '']); }}
              disabled={isLoading}
              className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 text-sm transition-colors"
            >
              Change Number
            </button>

            <button
              type="submit"
              disabled={isLoading || otp.join('').length !== 6}
              className="flex-1 py-3 bg-black text-white rounded-xl font-bold hover:bg-gray-800 disabled:opacity-50 text-sm transition-all flex items-center justify-center gap-2 shadow-md"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <CheckCircle size={18} />
                  Verify Code
                </>
              )}
            </button>
          </div>

          {/* Resend Cooldown */}
          <div className="text-center pt-2">
            {cooldown > 0 ? (
              <p className="text-xs text-gray-400">
                Resend code in <strong className="text-gray-700">{cooldown}s</strong>
              </p>
            ) : (
              <button
                type="button"
                onClick={() => handleSendOtp()}
                disabled={isLoading}
                className="text-xs text-black font-bold hover:underline"
              >
                Didn&apos;t receive code? Resend SMS
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
