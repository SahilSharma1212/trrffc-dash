// components/Sidebar.tsx
'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import axios from 'axios';

// ─── Types ───────────────────────────────────────────────────────────────────
interface DaySummary {
  day: string;       // "YYYY-MM-DD"
  total: number;
  challans: number;
  accepted: number;
  declined: number;
}

// ─── Nav items ────────────────────────────────────────────────────────────────
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

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatDay(iso: string): string {
  // "2025-04-14" → "14 Apr"
  const [, m, d] = iso.split('-');
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${parseInt(d, 10)} ${months[parseInt(m, 10) - 1]}`;
}

function isToday(iso: string): boolean {
  return iso === new Date().toISOString().slice(0, 10);
}

// ─── Mini stat pill ───────────────────────────────────────────────────────────
function Pill({
  value,
  color,
  title,
}: {
  value: number;
  color: string;
  title: string;
}) {
  return (
    <span
      title={title}
      className={`inline-flex items-center justify-center min-w-[22px] px-1 h-[18px] text-[9px] font-black rounded-[3px] tabular-nums leading-none ${color}`}
    >
      {value}
    </span>
  );
}

// ─── SummaryRow ───────────────────────────────────────────────────────────────
function SummaryRow({ row, isExpanded }: { row: DaySummary; isExpanded: boolean }) {
  const today = isToday(row.day);

  return (
    <div
      className={`rounded-[3px] px-2 py-1.5 transition-colors ${
        today ? 'bg-white/10' : 'hover:bg-white/5'
      }`}
    >
      {/* Date label + total */}
      <div className="flex items-center justify-between gap-1 mb-1">
        <span className={`text-[9px] font-black uppercase tracking-wider ${today ? 'text-white' : 'text-blue-200/70'}`}>
          {today ? 'TODAY' : formatDay(row.day)}
        </span>
        <span className={`text-[10px] font-black tabular-nums ${today ? 'text-white' : 'text-blue-200/60'}`}>
          {row.total}
        </span>
      </div>

      {/* Stat pills */}
      <div className="flex items-center gap-1 flex-wrap">
        <Pill value={row.challans} color="bg-blue-500/30 text-blue-100"     title="Challans issued" />
        <Pill value={row.accepted} color="bg-emerald-500/25 text-emerald-200" title="Accepted" />
        <Pill value={row.declined} color="bg-rose-500/25 text-rose-200"      title="Declined" />
      </div>

      {/* Progress bar (accepted / total) */}
      {row.total > 0 && (
        <div className="mt-1.5 h-[2px] bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-400/60 rounded-full transition-all duration-500"
            style={{ width: `${Math.round((row.accepted / row.total) * 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────
interface SidebarProps {
  language?: 'en' | 'hi';
  isCollapsed: boolean;
  setIsCollapsed: (val: boolean) => void;
}

export default function Sidebar({ language = 'en', isCollapsed, setIsCollapsed }: SidebarProps) {
  const pathname = usePathname();

  // Summary state
  const [summary, setSummary]       = useState<DaySummary[]>([]);
  const [summaryOpen, setSummaryOpen] = useState(true);
  const [loading, setLoading]       = useState(false);
  const [lastFetched, setLastFetched] = useState<number>(0);

  // Fetch summary — debounced: only re-fetch if 60 s have passed
  const fetchSummary = async (force = false) => {
    if (!force && Date.now() - lastFetched < 60_000) return;
    setLoading(true);
    try {
      const res = await axios.get<{ summary: DaySummary[] }>('/api/summary');
      setSummary(res.data.summary ?? []);
      setLastFetched(Date.now());
    } catch {
      // silent fail — sidebar summary is non-critical
    } finally {
      setLoading(false);
    }
  };

  // Fetch when sidebar expands or on first mount
  useEffect(() => {
    if (!isCollapsed) fetchSummary();
  }, [isCollapsed]); // eslint-disable-line

  // Auto-refresh every 2 minutes when expanded
  useEffect(() => {
    if (isCollapsed) return;
    const id = setInterval(() => fetchSummary(true), 120_000);
    return () => clearInterval(id);
  }, [isCollapsed]); // eslint-disable-line

  return (
    <aside
      className={`fixed left-0 top-0 h-screen bg-blue-700 flex flex-col z-50 shadow-2xl transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* ── Toggle button ── */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-12 bg-white text-blue-700 rounded-full p-1 shadow-lg border border-blue-100 hover:bg-blue-50 transition-transform active:scale-90"
        title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
      >
        <svg
          className={`w-4 h-4 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* ── Brand ── */}
      <div className="px-4 py-5 border-b border-blue-600/60 overflow-hidden shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex flex-col gap-[3px] shrink-0">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-400 shadow-sm shadow-rose-900/20" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-900/20" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-900/20" />
          </div>
          {!isCollapsed && (
            <div className="transition-opacity duration-300 whitespace-nowrap">
              <p className="text-[11px] font-black text-white uppercase tracking-[0.18em] leading-tight">Traffic</p>
              <p className="text-[11px] font-black text-blue-200 uppercase tracking-[0.18em] leading-tight">Console</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Nav links ── */}
      <nav className="py-4 px-2 flex flex-col gap-1 overflow-x-hidden shrink-0">
        {!isCollapsed && (
          <p className="text-[8px] font-black text-blue-300/50 uppercase tracking-[0.25em] px-3 mb-2">
            Modules
          </p>
        )}

        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname.startsWith(item.href));

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
                  <p className="text-[12px] font-bold uppercase tracking-widest leading-tight truncate">
                    {language === 'hi' ? item.labelHi : item.label}
                  </p>
                </div>
              )}

              {/* Tooltip when collapsed */}
              {isCollapsed && (
                <div className="absolute left-full ml-4 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 font-bold tracking-widest uppercase">
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

      {/* ── SUMMARY SECTION ─────────────────────────────────────────────────── */}
{!isCollapsed && (
  <div className="flex-1 flex flex-col min-h-0 border-t border-blue-600/60">

    {/* Section header: Changed from <button> to <div> */}
    <div
      onClick={() => setSummaryOpen((o) => !o)}
      className="flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors shrink-0 cursor-pointer"
    >
      <div className="flex items-center gap-2">
        <svg className="w-3.5 h-3.5 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <span className="text-[9px] font-black text-blue-300/70 uppercase tracking-[0.25em]">
          Daily Summary
        </span>
        {loading && (
          <svg className="w-3 h-3 text-blue-300/40 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
          </svg>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        {/* Inner button is now safe because the parent is a <div> */}
        <button
          type="button"
          onClick={(e) => { 
            e.stopPropagation(); // Prevents the parent div from toggling collapse
            fetchSummary(true); 
          }}
          title="Refresh summary"
          className="p-0.5 rounded text-blue-400/40 hover:text-blue-200 transition-colors"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
        <svg
          className={`w-3 h-3 text-blue-300/40 transition-transform duration-200 ${summaryOpen ? '' : '-rotate-90'}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>

    {/* ... rest of the code ... */}

          {/* Legend row */}
          {summaryOpen && (
            <div className="px-4 pb-1.5 shrink-0">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-sm bg-blue-500/40" />
                  <span className="text-[8px] text-blue-300/50 uppercase tracking-wider font-bold">CH</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-sm bg-emerald-500/30" />
                  <span className="text-[8px] text-blue-300/50 uppercase tracking-wider font-bold">AC</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-sm bg-rose-500/30" />
                  <span className="text-[8px] text-blue-300/50 uppercase tracking-wider font-bold">DC</span>
                </span>
              </div>
            </div>
          )}

          {/* Scrollable day rows */}
          {summaryOpen && (
            <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-0.5 scrollbar-thin scrollbar-thumb-blue-500/30 scrollbar-track-transparent">
              {summary.length === 0 && !loading && (
                <p className="text-[9px] text-blue-300/30 uppercase tracking-widest text-center py-6 font-bold">
                  No data yet
                </p>
              )}
              {summary.map((row) => (
                <SummaryRow key={row.day} row={row} isExpanded={true} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Collapsed: show summary icon + today's total as tooltip */}
      {isCollapsed && (
        <div className="flex-1 flex flex-col items-center justify-start pt-3 border-t border-blue-600/60">
          <div className="group relative">
            <button
              onClick={() => { setIsCollapsed(false); setSummaryOpen(true); }}
              className="p-2 text-blue-300/50 hover:text-white hover:bg-white/10 rounded-sm transition-colors"
              title="View daily summary"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </button>
            {/* Today's total badge */}
            {summary.length > 0 && isToday(summary[0].day) && (
              <span className="absolute -top-1 -right-1 bg-white text-blue-700 text-[8px] font-black rounded-full w-4 h-4 flex items-center justify-center leading-none">
                {summary[0].total > 99 ? '99+' : summary[0].total}
              </span>
            )}
          </div>
        </div>
      )}

      {/* ── Footer ── */}
      <div className="px-4 py-4 border-t border-blue-600/60 overflow-hidden shrink-0">
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