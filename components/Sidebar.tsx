// components/Sidebar.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  {
    href: '/dashboard',
    label: 'Traffic Control',
    labelHi: 'यातायात नियंत्रण',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
      </svg>
    ),
  },
  {
    href: '/dashboard/vehicle-search',
    label: 'Vehicle Search',
    labelHi: 'वाहन खोज',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
          d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
      </svg>
    ),
  },
];

interface SidebarProps {
  language?: 'en' | 'hi';
  isCollapsed: boolean;
  setIsCollapsed: (val: boolean) => void;
}

export default function Sidebar({ language = 'en', isCollapsed, setIsCollapsed }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside 
      className={`fixed left-0 top-0 h-screen bg-blue-700 flex flex-col z-50 shadow-2xl transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-16' : 'w-56'
      }`}
    >
      {/* Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-12 bg-white text-blue-700 rounded-full p-1 shadow-lg border border-blue-100 hover:bg-blue-50 transition-transform active:scale-90"
        title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
      >
        <svg 
          className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} 
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Brand Section */}
      <div className={`px-4 py-5 border-b border-blue-600/60 overflow-hidden shrink-0`}>
        <div className="flex items-center gap-3">
          <div className="flex flex-col gap-[3px] shrink-0">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-400 shadow-sm shadow-rose-900/20" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-900/20" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-900/20" />
          </div>
          {!isCollapsed && (
            <div className="transition-opacity duration-300 whitespace-nowrap">
              <p className="text-[11px] font-black text-white uppercase tracking-[0.18em] leading-tight">
                Traffic
              </p>
              <p className="text-[11px] font-black text-blue-200 uppercase tracking-[0.18em] leading-tight">
                Console
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 py-4 px-2 flex flex-col gap-1 overflow-x-hidden">
        {!isCollapsed && (
          <p className="text-[8px] font-black text-blue-300/50 uppercase tracking-[0.25em] px-3 mb-2 transition-opacity duration-300">
            Modules
          </p>
        )}

        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 px-3 py-3 transition-all duration-150 rounded-sm relative ${
                isActive
                  ? 'bg-white/15 text-white shadow-inner border border-white/10'
                  : 'text-blue-200 hover:bg-white/8 hover:text-white'
              }`}
            >
              <span className={`shrink-0 transition-colors ${isActive ? 'text-white' : 'text-blue-300 group-hover:text-white'}`}>
                {item.icon}
              </span>
              
              {!isCollapsed && (
                <div className="min-w-0 transition-opacity duration-300">
                  <p className={`text-[12px] font-bold uppercase tracking-widest leading-tight truncate`}>
                    {language === 'hi' ? item.labelHi : item.label}
                  </p>
                </div>
              )}

              {/* Tooltip for collapsed state */}
              {isCollapsed && (
                <div className="absolute left-full ml-4 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z- font-bold tracking-widest uppercase">
                  {language === 'hi' ? item.labelHi : item.label}
                </div>
              )}

              {isActive && !isCollapsed && (
                <div className="ml-auto w-1 h-5 bg-white rounded-full shrink-0" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className={`px-4 py-4 border-t border-blue-600/60 overflow-hidden shrink-0`}>
        {!isCollapsed ? (
          <>
            <p className="text-[9px] text-blue-400/60 uppercase tracking-widest font-bold whitespace-nowrap">
              Enforcement System
            </p>
            <p className="text-[8px] text-blue-500/50 mt-0.5">v2.0</p>
          </>
        ) : (
          <p className="text-[9px] text-blue-400/60 font-black text-center">V2</p>
        )}
      </div>
    </aside>
  );
}