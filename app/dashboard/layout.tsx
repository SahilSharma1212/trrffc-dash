// app/dashboard/layout.tsx
import React from 'react';
import Sidebar from '@/components/Sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Fixed sidebar — 224px wide (w-56) */}
      <Sidebar />

      {/* Main content — offset by sidebar width */}
      <div className="flex-1 ml-56 min-h-screen overflow-x-hidden">
        {children}
      </div>
    </div>
  );
}