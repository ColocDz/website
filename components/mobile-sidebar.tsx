'use client';

import React, { useState, useRef, useEffect } from "react";
import styled from "styled-components";
import Link from "next/link";
import { X } from "react-feather"; // Import X component
import { CloseButton } from "react-bootstrap"; // Import CloseButton component

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

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 39;
`;

const SidebarContainer = styled.div<{ $translateX: number }>`
  width: 64%;
  max-width: 256px;
  height: 100vh;
  background-color: #1e1e2f;
  color: white;
  display: flex;
  flex-direction: column;
  padding-top: 1rem;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 40;
  transform: translateX(${props => props.$translateX}px);
  transition: transform 0.3s ease-out;
  touch-action: none;
`;

const SidebarHeader = styled.div`
  padding: 1rem;
  font-size: 1.2rem;
  font-weight: bold;
  background-color: #151521;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  margin-bottom: 1rem;
`;

const MenuList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  flex: 1;
`;

const MenuItemLink = styled(Link)`
  padding: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 15px;
  color: white;
  text-decoration: none;
  font-size: 1rem;
  &:hover {
    background-color: #2a2a40;
  }
`;

const MenuItemStyled = styled.li`
  &:hover {
    background-color: #2a2a40;
  }
`;

const IconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
`;

export const MobileSidebar: React.FC<MobileSidebarProps> = ({ menuItems, onClose }) => {
  const [translateX, setTranslateX] = useState(0);
  const startX = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const CLOSE_THRESHOLD = 80; // pixels to drag before closing

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const currentX = e.touches[0].clientX;
    const diff = currentX - startX.current;
    
    // Only allow dragging to the left (negative values)
    if (diff < 0) {
      setTranslateX(diff);
    }
  };

  const handleTouchEnd = () => {
    if (translateX < -CLOSE_THRESHOLD) {
      // Animate out and close
      setTranslateX(-300);
      setTimeout(onClose, 300);
    } else {
      // Snap back
      setTranslateX(0);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    startX.current = e.clientX;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (e.buttons !== 1) return; // Only on left mouse button drag
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

  const handleResize = () => {
    // Handle resize logic here
  };

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove as any);
    document.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check

    return () => {
      document.removeEventListener('mousemove', handleMouseMove as any);
      document.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('resize', handleResize);
    };
  }, [translateX]);

  return (
    <>
      <Overlay onClick={onClose} />
      <SidebarContainer
        ref={containerRef}
        $translateX={translateX}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
      >
        <SidebarHeader>
          <span>Coloc DZ</span>
          <CloseButton onClick={onClose}>
            <X size={24} />
          </CloseButton>
        </SidebarHeader>

        <MenuList>
          {menuItems.map((item, index) => (
            <MenuItemStyled key={index}>
              {item.onClick ? (
                <button
                  onClick={() => {
                    item.onClick?.();
                    onClose();
                  }}
                  style={{
                    width: '100%',
                    padding: '1rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '15px',
                    color: 'white',
                    textDecoration: 'none',
                    fontSize: '1rem',
                    background: 'none',
                    border: 'none',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2a2a40'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <IconWrapper>{item.icon}</IconWrapper>
                  <span>{item.label}</span>
                </button>
              ) : (
                <MenuItemLink href={item.path || '/'} onClick={onClose}>
                  <IconWrapper>{item.icon}</IconWrapper>
                  <span>{item.label}</span>
                </MenuItemLink>
              )}
            </MenuItemStyled>
          ))}
        </MenuList>
      </SidebarContainer>
    </>
  );
};
