'use client';

import React from "react";
import { SidebarMenu } from "./sidebar";
import { MdOutlinePostAdd } from "react-icons/md";
import { IoIosLogOut } from "react-icons/io";
import { FaHome, FaUser, FaCog } from "react-icons/fa";
import { AiFillMessage } from "react-icons/ai";

interface SidebarLayoutProps {
  children: React.ReactNode;
}

export const SidebarLayout: React.FC<SidebarLayoutProps> = ({ children }) => {
  const menuItems = [
    { label: "Home", path: "/", icon: <FaHome /> },
    { label: "Add Post", path: "/adding-post", icon: <MdOutlinePostAdd /> },
    { label: "Profile", path: "/profile", icon: <FaUser /> },
    { label: "Messages", path: "/messages", icon: <AiFillMessage /> },
    { label: "Settings", path: "/settings", icon: <FaCog /> },
    {label: "Log Out", path: "/logout", icon: <IoIosLogOut />},
  ];

  return (
    <div style={{ display: "flex" }}>
      <SidebarMenu menuItems={menuItems} />
      <div style={{ marginLeft: "250px", flex: 1, padding: "20px", width: "calc(100% - 250px)" }}>
        {children}
      </div>
    </div>
  );
};
