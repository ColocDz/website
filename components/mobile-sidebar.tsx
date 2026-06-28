'use client';

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { useI18n } from "@/lib/i18n";

interface MenuItem {
  label: string;
  path?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
}

interface MobileSidebarProps {
  menuItems: MenuItem[];
  onClose: () => void;
}

export const MobileSidebar: React.FC<MobileSidebarProps> = ({ menuItems, onClose }) => {
  const [translateX, setTranslateX] = useState(0);
  const startX = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const CLOSE_THRESHOLD = 80;
  const { locale, setLocale } = useI18n();

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX.current;
    
    if (diff < 0) {
      setTranslateX(diff);
    }
  };

  const handleTouchEnd = () => {
    if (translateX < -CLOSE_THRESHOLD) {
      setTranslateX(-300);
      setTimeout(onClose, 300);
    } else {
      setTranslateX(0);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    startX.current = e.clientX;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (e.buttons !== 1) return;
    const currentX = e.clientX;
    const diff = currentX - startX.current;
    
    if (diff < 0) {
      setTranslateX(diff);
    }
  };

  const handleMouseUp = () => {
    if (translateX < -CLOSE_THRESHOLD) {
      setTranslateX(-300);
      setTimeout(onClose, 300);
    } else {
      setTranslateX(0);
    }
  };

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove as any);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove as any);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [translateX]);

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/70 z-[39] backdrop-blur-sm" 
        onClick={onClose} 
      />
      <div
        ref={containerRef}
        className="w-[75%] max-w-[280px] h-screen bg-[#0f131b] text-[#dfe2ec] flex flex-col fixed left-0 top-0 z-[40] border-r border-[#31353d]"
        style={{
          transform: `translateX(${translateX}px)`,
          transition: translateX === 0 || translateX === -300 ? 'transform 0.3s ease-out' : 'none',
          touchAction: 'none'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
      >
        <div className="p-4 text-xl font-bold bg-[#0c0f16] flex items-center justify-between border-b border-[#31353d]">
          <span className="font-display-lg italic text-[#dfe2ec]">Coloc DZ</span>
          <button onClick={onClose} className="text-[#dfe2ec] bg-transparent border-none cursor-pointer p-1 hover:text-[#ffaaf7] transition-colors">
            <X size={20} />
          </button>
        </div>

        <ul className="list-none p-0 m-0 flex-1 overflow-y-auto pt-2">
          {menuItems.map((item, index) => (
            <li key={index} className="hover:bg-[#1c2027] border-b border-white/5 transition-colors">
              {item.onClick ? (
                <button
                  onClick={() => {
                    item.onClick?.();
                    onClose();
                  }}
                  className="w-full p-4 cursor-pointer flex items-center gap-4 text-[#dfe2ec] hover:text-[#ffaaf7] no-underline text-sm font-semibold bg-transparent border-none text-left"
                >
                  <div className="flex items-center justify-center text-lg">{item.icon}</div>
                  <span className="font-label-caps uppercase tracking-widest text-xs">{item.label}</span>
                </button>
              ) : (
                <Link 
                  href={item.path || '/'} 
                  onClick={onClose}
                  className="p-4 cursor-pointer flex items-center gap-4 text-[#dfe2ec] hover:text-[#ffaaf7] no-underline text-sm font-semibold w-full block"
                >
                  <div className="flex items-center justify-center text-lg">{item.icon}</div>
                  <span className="font-label-caps uppercase tracking-widest text-xs">{item.label}</span>
                </Link>
              )}
            </li>
          ))}
        </ul>

        {/* Language Selection at the bottom */}
        <div className="p-4 border-t border-[#31353d] bg-[#0c0f16]">
          <p className="text-[9px] uppercase tracking-widest text-[#ffaaf7] font-bold mb-3">Language / Langue / اللغة</p>
          <div className="flex gap-2">
            {[
              { code: 'en', flag: '🇬🇧', label: 'EN' },
              { code: 'fr', flag: '🇫🇷', label: 'FR' },
              { code: 'ar', flag: '🇩🇿', label: 'عربي' }
            ].map((lang) => (
              <button
                key={lang.code}
                onClick={() => setLocale(lang.code as any)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold border transition-all ${
                  locale === lang.code
                    ? 'bg-[#ffaaf7] text-[#5a005e] border-[#ffaaf7]'
                    : 'bg-[#1c2027] text-[#dfe2ec] border-[#31353d] hover:bg-[#262a32]'
                }`}
              >
                <span>{lang.flag}</span>
                <span>{lang.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};
