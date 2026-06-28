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
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#31353d] bg-[#1c2027] hover:bg-[#262a32] text-sm font-semibold text-[#dfe2ec] transition-all duration-200 active:scale-95"
        aria-label="Change language"
      >
        <Globe size={14} className="text-[#ffaaf7]" />
        <span className="hidden sm:inline">{current.flag} {current.code.toUpperCase()}</span>
        <span className="sm:hidden">{current.flag}</span>
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-1.5 bg-[#1c2027] border border-[#31353d] rounded-xl shadow-2xl py-1.5 z-50 min-w-[160px]">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => { setLocale(lang.code); setOpen(false); }}
              className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 hover:bg-[#262a32] transition-colors ${
                locale === lang.code ? 'bg-[#262a32] font-semibold text-[#ffaaf7]' : 'text-[#dfe2ec]'
              }`}
            >
              <span className="text-base">{lang.flag}</span>
              <span>{lang.label}</span>
              {locale === lang.code && <span className="ml-auto text-[#ffaaf7] text-xs">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
