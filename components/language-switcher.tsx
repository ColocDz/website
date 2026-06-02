'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Globe } from 'lucide-react';
import { useI18n, Locale } from '@/lib/i18n';

const languages: { code: Locale; label: string; flag: string }[] = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'ar', label: 'العربية', flag: '🇩🇿' },
];

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const current = languages.find(l => l.code === locale) || languages[0];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-sm font-medium text-gray-700 transition-colors"
        aria-label="Change language"
      >
        <Globe size={15} className="text-gray-500" />
        <span className="hidden sm:inline">{current.flag} {current.code.toUpperCase()}</span>
        <span className="sm:hidden">{current.flag}</span>
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1.5 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-50 min-w-[160px]">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => { setLocale(lang.code); setOpen(false); }}
              className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                locale === lang.code ? 'bg-gray-50 font-semibold text-gray-900' : 'text-gray-700'
              }`}
            >
              <span className="text-base">{lang.flag}</span>
              <span>{lang.label}</span>
              {locale === lang.code && <span className="ml-auto text-emerald-500 text-xs">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
