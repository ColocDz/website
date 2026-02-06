'use client';

import React, { useState } from "react";
import styled from "styled-components";
import Link from "next/link";

interface MenuItem {
  label: string;
  path: string;
  icon?: React.ReactNode;
}

interface SidebarMenuProps {
  menuItems: MenuItem[];
}

const SidebarContainer = styled.div<{ $isOpen: boolean }>`
  width: ${({ $isOpen }) => ($isOpen ? "250px" : "60px")};
  height: 100vh;
  background-color: #1e1e2f;
  color: white;
  transition: width 0.3s ease;
  overflow: hidden;
  position: fixed;
  left: 0;
  top: 0;
`;

const SidebarHeader = styled.div`
  padding: 1rem;
  font-size: 1.2rem;
  font-weight: bold;
  background-color: #151521;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const MenuList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const MenuItemLink = styled(Link)`
  padding: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 10px;
  color: white;
  text-decoration: none;
  &:hover {
    background-color: #2a2a40;
  }
`;

const MenuItemStyled = styled.li`
  &:hover {
    background-color: #2a2a40;
  }
`;

export const SidebarMenu: React.FC<SidebarMenuProps> = ({ menuItems }) => {
  const [isOpen, setIsOpen] = useState(true);

  const openSidebar = () => {
    setIsOpen((prev) => !prev);
  };

  return (
    <SidebarContainer $isOpen={isOpen}>
      <SidebarHeader onClick={openSidebar}>
        {isOpen ? "Coloc DZ" : "☰"}
      </SidebarHeader>

      <MenuList>
        {menuItems.map((item, index) => (
          <MenuItemStyled key={index}>
            <MenuItemLink href={item.path}>
              {item.icon}
              {isOpen && item.label}
            </MenuItemLink>
          </MenuItemStyled>
        ))}
      </MenuList>
    </SidebarContainer>
  );
};
