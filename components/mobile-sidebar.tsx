'use client';

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { X } from "lucide-react";

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
        className="fixed inset-0 bg-black/50 z-[39]" 
        onClick={onClose} 
      />
      <div
        ref={containerRef}
        className="w-[64%] max-w-[256px] h-screen bg-[#1e1e2f] text-white flex flex-col pt-4 fixed left-0 top-0 z-[40]"
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
        <div className="p-4 text-xl font-bold bg-[#151521] flex items-center justify-between mb-4">
          <span>Coloc DZ</span>
          <button onClick={onClose} className="text-white bg-transparent border-none cursor-pointer p-1 hover:opacity-80">
            <X size={24} />
          </button>
        </div>

        <ul className="list-none p-0 m-0 flex-1">
          {menuItems.map((item, index) => (
            <li key={index} className="hover:bg-[#2a2a40] transition-colors">
              {item.onClick ? (
                <button
                  onClick={() => {
                    item.onClick?.();
                    onClose();
                  }}
                  className="w-full p-4 cursor-pointer flex items-center gap-4 text-white no-underline text-base bg-transparent border-none text-left"
                >
                  <div className="flex items-center justify-center text-xl">{item.icon}</div>
                  <span>{item.label}</span>
                </button>
              ) : (
                <Link 
                  href={item.path || '/'} 
                  onClick={onClose}
                  className="p-4 cursor-pointer flex items-center gap-4 text-white no-underline text-base w-full block"
                >
                  <div className="flex items-center justify-center text-xl">{item.icon}</div>
                  <span>{item.label}</span>
                </Link>
              )}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
};
