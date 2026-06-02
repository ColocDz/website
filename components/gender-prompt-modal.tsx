'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from '@/lib/auth-client';
import { useI18n } from '@/lib/i18n';

export function GenderPromptModal() {
  const { data: session } = useSession();
  const { t, dir } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedGender, setSelectedGender] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function checkGender() {
      if (!session?.user) return;
      try {
        const res = await fetch('/api/user');
        if (res.ok) {
          const user = await res.json();
          // If gender is not set, show the modal prompt
          if (!user.gender) {
            setIsOpen(true);
          }
        }
      } catch (err) {
        console.error('Failed to verify gender status:', err);
      }
    }
    checkGender();
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGender) {
      setError('Please select a gender option.');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const res = await fetch('/api/user', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gender: selectedGender }),
      });

      if (res.ok) {
        setIsOpen(false);
        // Refresh page to apply updated filters/labels
        window.location.reload();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to save gender preference.');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4" dir={dir}>
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {t('genderPrompt.title') || 'One Quick Step'}
          </h2>
          <p className="text-gray-600 text-sm">
            {t('genderPrompt.description') || 'Please select your gender to complete your profile registration. This helps roommates filter properties accurately.'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setSelectedGender('Male')}
              className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${
                selectedGender === 'Male'
                  ? 'border-indigo-600 bg-indigo-50/50 text-indigo-700 shadow-md'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="text-4xl">👨</span>
              <span className="font-semibold text-sm">{t('settings.male') || 'Male'}</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedGender('Female')}
              className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${
                selectedGender === 'Female'
                  ? 'border-pink-600 bg-pink-50/50 text-pink-700 shadow-md'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="text-4xl">👩</span>
              <span className="font-semibold text-sm">{t('settings.female') || 'Female'}</span>
            </button>
          </div>

          <button
            type="submit"
            disabled={isSaving || !selectedGender}
            className="w-full py-3 bg-black text-white rounded-2xl font-bold hover:bg-gray-800 disabled:opacity-50 transition-colors shadow-lg shadow-black/10"
          >
            {isSaving ? (t('common.saving') || 'Saving...') : (t('common.confirm') || 'Confirm')}
          </button>
        </form>
      </div>
    </div>
  );
}
