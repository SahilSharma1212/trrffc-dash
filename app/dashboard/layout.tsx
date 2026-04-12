// app/dashboard/layout.tsx
'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Pass state and setter to Sidebar */}
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

      {/* Main content: 
          If collapsed, margin-left is 64px (w-16).
          If expanded, margin-left is 224px (w-56).
      */}
      <div 
        className={`flex-1 min-h-screen overflow-x-hidden transition-all duration-300 ${
          isCollapsed ? 'ml-16' : 'ml-56'
        }`}
      >
        {children}
      </div>
    </div>
  );
}