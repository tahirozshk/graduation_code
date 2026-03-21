'use client'

import React, { useState } from 'react'
import { 
  Home, 
  BookOpen, 
  HelpCircle, 
  Monitor, 
  BarChart3, 
  CalendarDays, 
  Book, 
  Mail, 
  Camera, 
  Settings, 
  Menu,
  Search,
  Globe,
  LogOut,
  X
} from 'lucide-react'

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  const sidebarItems = [
    { label: 'Home', icon: <Home size={20} />, active: false },
    { label: 'My Courses', icon: <BookOpen size={20} />, active: true },
    { label: 'My Exams', icon: <HelpCircle size={20} />, active: false },
    { label: 'Classroom', icon: <Monitor size={20} />, active: false },
    { label: 'My Grades', icon: <BarChart3 size={20} />, active: false },
    { label: 'My Timetable', icon: <CalendarDays size={20} />, active: false },
    { label: 'E-book', icon: <Book size={20} />, active: false },
    { label: 'Messaging', icon: <Mail size={20} />, active: false },
    { label: 'Register Face', icon: <Camera size={20} />, active: false },
    { label: 'Settings', icon: <Settings size={20} />, active: false },
  ]

  return (
    <div className="layout">
      {/* Header */}
      <header className="header">
        <div className="header-left">
          <button className="menu-toggle" onClick={() => setIsCollapsed(!isCollapsed)}>
            <Menu size={24} color="#6a1b2b" />
          </button>
          <div className="logo-placeholder">
            <div className="logo-circle">
               <div className="logo-inner"></div>
            </div>
            <div className="logo-text">
              <span className="univ-name">NEAR EAST UNIVERSITY INTERNATIONAL RESEARCH CENTER FOR AI AND IOT</span>
            </div>
          </div>
        </div>
        <div className="header-center">
          <h1 className="prof-dux">PROF. DUX</h1>
        </div>
        <div className="header-right">
          <Search size={18} className="header-icon" />
          <div className="lang-switcher">
            <Globe size={18} />
            <span>EN</span>
          </div>
          <div className="profile-circle">TO</div>
          <LogOut size={18} className="header-icon" />
        </div>
      </header>
      
      <div className="main-wrapper">
        <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
          <div className="sidebar-list">
            {sidebarItems.map((item, index) => (
              <div key={index} className={`sidebar-item ${item.active ? 'active' : ''}`}>
                <span className="sidebar-icon">{item.icon}</span>
                {!isCollapsed && <span className="sidebar-label">{item.label}</span>}
              </div>
            ))}
          </div>
        </aside>
        
        <main className="content">
          {children}
        </main>
      </div>
      
      <button className="fab-ask-dux">
        <div className="ai-pulse"></div>
        Ask Dux
      </button>

    </div>
  )
}
