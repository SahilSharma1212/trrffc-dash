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

export default function Sidebar({ language = 'en' }: { language?: 'en' | 'hi' }) {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-56 bg-blue-700 flex flex-col z-50 shadow-2xl">

      {/* Brand */}
      <div className="px-5 py-5 border-b border-blue-600/60">
        <div className="flex items-center gap-2.5 mb-0.5">
          {/* Traffic light icon */}
          <div className="flex flex-col gap-[3px] items-center">
            <div className="w-2 h-2 rounded-full bg-rose-400" />
            <div className="w-2 h-2 rounded-full bg-amber-400" />
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
          </div>
          <div>
            <p className="text-[11px] font-black text-white uppercase tracking-[0.18em] leading-tight">
              Traffic
            </p>
            <p className="text-[11px] font-black text-blue-200 uppercase tracking-[0.18em] leading-tight">
              Console
            </p>
          </div>
        </div>
        <p className="text-[9px] text-blue-300/70 uppercase tracking-widest mt-2 font-bold">
          District Administration
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 flex flex-col gap-1">
        <p className="text-[8px] font-black text-blue-300/50 uppercase tracking-[0.25em] px-2 mb-2">
          Modules
        </p>

        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 px-3 py-3 transition-all duration-150 rounded-sm ${
                isActive
                  ? 'bg-white/15 text-white shadow-inner border border-white/10'
                  : 'text-blue-200 hover:bg-white/8 hover:text-white'
              }`}
            >
              <span className={`shrink-0 transition-colors ${isActive ? 'text-white' : 'text-blue-300 group-hover:text-white'}`}>
                {item.icon}
              </span>
              <div className="min-w-0">
                <p className={`text-[12px] font-bold uppercase tracking-widest leading-tight ${isActive ? 'text-white' : ''}`}>
                  {language === 'hi' ? item.labelHi : item.label}
                </p>
              </div>
              {isActive && (
                <div className="ml-auto w-1 h-6 bg-white rounded-full shrink-0" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-blue-600/60">
        <p className="text-[9px] text-blue-400/60 uppercase tracking-widest font-bold">
          Enforcement System
        </p>
        <p className="text-[8px] text-blue-500/50 mt-0.5">v2.0</p>
      </div>
    </aside>
  );
}