'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface CaptchaModalProps {
  onVerify: () => void;
  isOpen: boolean;
}

export function CaptchaModal({ onVerify, isOpen }: CaptchaModalProps) {
  const [captchaQuestion, setCaptchaQuestion] = useState('');
  const [userAnswer, setUserAnswer] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState(0);
  const [error, setError] = useState('');
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    if (isOpen && !isVerified) {
      generateCaptcha();
    }
  }, [isOpen, isVerified]);

  const generateCaptcha = () => {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    const answer = num1 + num2;
    
    setCaptchaQuestion(`${num1} + ${num2} = ?`);
    setCorrectAnswer(answer);
    setUserAnswer('');
    setError('');
  };

  const handleVerify = () => {
    if (!userAnswer) {
      setError('Please enter an answer');
      return;
    }

    if (parseInt(userAnswer) === correctAnswer) {
      setIsVerified(true);
      setTimeout(() => {
        onVerify();
      }, 500);
    } else {
      setError('Incorrect answer. Please try again.');
      setUserAnswer('');
      generateCaptcha();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          {isVerified ? (
            <div className="text-center space-y-4">
              <div className="text-5xl">✓</div>
              <h2 className="text-2xl font-bold text-green-600">Verified!</h2>
              <p className="text-gray-600">You've been verified. Redirecting...</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Verify You're Human</h2>
                <button className="text-gray-500 hover:text-gray-700">
                  <X size={24} />
                </button>
              </div>

              <p className="text-gray-600 text-sm">Complete this simple verification to continue</p>

              <div className="bg-gray-50 p-6 rounded-lg text-center">
                <p className="text-3xl font-bold text-gray-900 mb-6">{captchaQuestion}</p>
                <input
                  type="number"
                  value={userAnswer}
                  onChange={(e) => {
                    setUserAnswer(e.target.value);
                    setError('');
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && handleVerify()}
                  placeholder="Your answer"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg text-center text-lg font-semibold focus:outline-none focus:border-black"
                  autoFocus
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <button
                onClick={handleVerify}
                className="w-full bg-black text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors"
              >
                Verify
              </button>

              <p className="text-xs text-gray-500 text-center">
                Having trouble? This helps us prevent automated abuse.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
