'use client';

// app/dashboard/vehicle-search/page.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Vehicle Search — migrated from Streamlit to Next.js / React
// Reads from toll_all table via /api/vehicle-search
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';

// ── Types ────────────────────────────────────────────────────────────────────
interface TollRecord {
  'Vehicle No': string;
  [key: string]: any;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function cleanVehicleNo(value: string): string {
  return value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
}

function highlight(text: string, query: string): React.ReactNode {
  if (!query) return text;
  const clean = cleanVehicleNo(query);
  const idx = text.toUpperCase().indexOf(clean);
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-amber-200 text-amber-900 rounded-sm px-0.5">{text.slice(idx, idx + clean.length)}</mark>
      {text.slice(idx + clean.length)}
    </>
  );
}

// ── Cell renderer — formats values nicely ────────────────────────────────────
function CellValue({ value }: { value: any }) {
  if (value === null || value === undefined || value === '') {
    return <span className="text-slate-300 text-[10px]">—</span>;
  }
  if (typeof value === 'boolean') {
    return <span className={value ? 'text-emerald-600 font-bold' : 'text-rose-500 font-bold'}>{value ? 'Yes' : 'No'}</span>;
  }
  // Date-like strings
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    const d = new Date(value);
    if (!isNaN(d.getTime())) {
      return (
        <span className="whitespace-nowrap text-slate-600">
          {d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </span>
      );
    }
  }
  return <span>{String(value)}</span>;
}

// ── Stat pill ─────────────────────────────────────────────────────────────────
function StatPill({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className={`flex items-center gap-2 px-4 py-2 border ${color} bg-white`}>
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
      <span className="text-[15px] font-black text-slate-800">{value}</span>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function VehicleSearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<TollRecord[]>([]);
  const [uniqueVehicles, setUniqueVehicles] = useState<string[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [filteredRows, setFilteredRows] = useState<TollRecord[]>([]);
  const [columns, setColumns] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<'en' | 'hi'>('en');

  // Sorted columns (put Vehicle No first)
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const inputRef = useRef<HTMLInputElement>(null);

  // Focus on mount
  useEffect(() => { inputRef.current?.focus(); }, []);

  // Persist language
  useEffect(() => {
    const saved = localStorage.getItem('dash_lang');
    if (saved === 'hi' || saved === 'en') setLanguage(saved as 'en' | 'hi');
  }, []);

  // ── Search ─────────────────────────────────────────────────────────────────
  const handleSearch = useCallback(async (value?: string) => {
    const q = (value ?? query).trim();
    if (!q) return;

    setLoading(true);
    setError(null);
    setSearched(false);
    setResults([]);
    setUniqueVehicles([]);
    setSelectedVehicle(null);
    setFilteredRows([]);

    try {
      const { data } = await axios.get('/api/vehicle-search', { params: { q } });
      const rows: TollRecord[] = data.data ?? [];
      setResults(rows);

      if (rows.length > 0) {
        // Derive columns — Vehicle No always first
        const allKeys = Array.from(new Set(rows.flatMap(Object.keys)));
        const ordered = ['Vehicle No', ...allKeys.filter((k) => k !== 'Vehicle No')];
        setColumns(ordered);

        // Unique vehicles sorted by string length desc (longer/more specific first)
        const seen = new Set<string>();
        const uniq: string[] = [];
        [...rows]
          .sort((a, b) => (b['Vehicle No'] ?? '').length - (a['Vehicle No'] ?? '').length)
          .forEach((r) => {
            const v = r['Vehicle No'] ?? 'UNKNOWN';
            if (!seen.has(v)) { seen.add(v); uniq.push(v); }
          });
        setUniqueVehicles(uniq);

        // Auto-select if exact match
        const clean = cleanVehicleNo(q);
        const exactMatch = uniq.find((v) => cleanVehicleNo(v) === clean);
        if (exactMatch) {
          setSelectedVehicle(exactMatch);
        } else if (uniq.length === 1) {
          setSelectedVehicle(uniq[0]);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Search failed. Please try again.');
    } finally {
      setLoading(false);
      setSearched(true);
    }
  }, [query]);

  // ── Filter rows when vehicle selected ─────────────────────────────────────
  useEffect(() => {
    if (!selectedVehicle) { setFilteredRows([]); return; }
    setFilteredRows(results.filter((r) => (r['Vehicle No'] ?? 'UNKNOWN') === selectedVehicle));
    setSortCol(null);
  }, [selectedVehicle, results]);

  // ── Sorting ────────────────────────────────────────────────────────────────
  const sortedRows = React.useMemo(() => {
    if (!sortCol) return filteredRows;
    return [...filteredRows].sort((a, b) => {
      const av = a[sortCol] ?? '';
      const bv = b[sortCol] ?? '';
      const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filteredRows, sortCol, sortDir]);

  const handleSort = (col: string) => {
    if (sortCol === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(col);
      setSortDir('asc');
    }
  };

  // ── Compute summary stats ──────────────────────────────────────────────────
  const totalAmount = React.useMemo(() => {
    const col = columns.find((c) => /amount|fee|toll|charge|fare/i.test(c));
    if (!col) return null;
    const sum = filteredRows.reduce((acc, r) => acc + (parseFloat(r[col]) || 0), 0);
    return { col, sum };
  }, [filteredRows, columns]);

  // ── UI ─────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">

      {/* ── Header ── */}
      <header className="bg-blue-600 border-b border-blue-700 sticky top-0 z-30 shadow-sm">
        <div className="px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-sm font-bold text-white uppercase tracking-widest">
              {language === 'en' ? 'Vehicle Search' : 'वाहन खोज'}
            </h1>
            <p className="text-[10px] text-blue-200 mt-0.5 uppercase tracking-widest">
              {language === 'en' ? 'Toll Records Database' : 'टोल रिकॉर्ड डेटाबेस'}
            </p>
          </div>
          <button
            onClick={() => {
              const next = language === 'en' ? 'hi' : 'en';
              setLanguage(next);
              localStorage.setItem('dash_lang', next);
            }}
            className="text-[13px] font-bold text-blue-200 hover:text-white uppercase tracking-widest px-3 py-1 border border-blue-400 hover:border-white transition-all"
          >
            {language === 'en' ? 'हिन्दी' : 'English'}
          </button>
        </div>
      </header>

      <main className="px-8 py-8 max-w-7xl mx-auto">

        {/* ── Search Box ── */}
        <div className="bg-white border border-blue-100 shadow-sm p-6 mb-6">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
            {language === 'en'
              ? 'Enter full number, last 4 digits, or partial plate'
              : 'पूरा नंबर, अंतिम 4 अंक या आंशिक नंबर दर्ज करें'}
          </p>

          <div className="flex gap-3 items-stretch">
            <div className="relative flex-1 max-w-md">
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder={language === 'en' ? 'e.g. CG04AB1234 or 1234' : 'जैसे CG04AB1234 या 1234'}
                className="w-full border border-blue-200 px-4 py-3 text-sm font-mono font-bold text-blue-800 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-400 bg-blue-50/30 placeholder:text-slate-300 placeholder:font-sans placeholder:font-normal uppercase tracking-widest transition-all"
              />
              {query && (
                <button
                  onClick={() => {
                    setQuery('');
                    setResults([]);
                    setSearched(false);
                    setSelectedVehicle(null);
                    inputRef.current?.focus();
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            <button
              onClick={() => handleSearch()}
              disabled={loading || !query.trim()}
              className="px-8 py-3 bg-blue-600 text-white text-[11px] font-bold uppercase tracking-widest hover:bg-blue-700 transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <><AiOutlineLoading3Quarters className="w-4 h-4 animate-spin" />
                  {language === 'en' ? 'Searching…' : 'खोज रहे हैं…'}</>
              ) : (
                <>{language === 'en' ? 'Search' : 'खोजें'}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
                  </svg></>
              )}
            </button>
          </div>

          {/* Search strategy hint */}
          <div className="flex gap-4 mt-3">
            {[
              { label: language === 'en' ? 'Full number' : 'पूरा नंबर', eg: 'CG04AB1234' },
              { label: language === 'en' ? 'Last 4 digits' : 'अंतिम 4 अंक', eg: '1234' },
              { label: language === 'en' ? 'Last 3 digits' : 'अंतिम 3 अंक', eg: '234' },
            ].map((hint) => (
              <div key={hint.label} className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-300" />
                <span className="text-[10px] text-slate-400 uppercase tracking-wide font-bold">{hint.label}</span>
                <span className="text-[10px] font-mono text-blue-500 bg-blue-50 px-1.5 py-0.5 border border-blue-100">{hint.eg}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 px-5 py-4 mb-6 flex items-center gap-3">
            <svg className="w-4 h-4 text-rose-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-rose-700 font-medium">{error}</p>
          </div>
        )}

        {/* ── No results ── */}
        {searched && !loading && results.length === 0 && !error && (
          <div className="bg-white border border-blue-100 py-20 text-center flex flex-col items-center gap-3">
            <svg className="w-10 h-10 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-[12px] text-slate-400 uppercase tracking-widest font-bold">
              {language === 'en' ? 'No matching vehicle found' : 'कोई वाहन नहीं मिला'}
            </p>
            <p className="text-[11px] text-slate-300">
              {language === 'en' ? 'Try last 4 digits or a different number' : 'अंतिम 4 अंक या दूसरा नंबर आज़माएं'}
            </p>
          </div>
        )}

        {/* ── Results section ── */}
        {results.length > 0 && (
          <div className="space-y-5">

            {/* Vehicle picker + stats */}
            <div className="bg-white border border-blue-100 shadow-sm p-5">
              <div className="flex flex-col md:flex-row md:items-center gap-4">

                {/* Dropdown */}
                <div className="flex-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">
                    {language === 'en' ? 'Select Vehicle' : 'वाहन चुनें'}
                    <span className="ml-2 text-blue-500 font-bold">({uniqueVehicles.length} {language === 'en' ? 'found' : 'मिले'})</span>
                  </p>

                  <div className="relative">
                    <select
                      value={selectedVehicle ?? ''}
                      onChange={(e) => setSelectedVehicle(e.target.value || null)}
                      className="w-full border border-blue-200 px-4 py-3 text-[13px] font-mono font-bold text-blue-800 bg-blue-50/40 focus:outline-none focus:border-blue-600 appearance-none cursor-pointer uppercase tracking-widest"
                    >
                      <option value="">
                        {language === 'en' ? '— Select a vehicle —' : '— वाहन चुनें —'}
                      </option>
                      {uniqueVehicles.map((v) => (
                        <option key={v} value={v}>{v}</option>
                      ))}
                    </select>
                    <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {/* Quick-select chips */}
                {uniqueVehicles.length > 1 && uniqueVehicles.length <= 8 && (
                  <div className="flex flex-wrap gap-2">
                    {uniqueVehicles.map((v) => (
                      <button
                        key={v}
                        onClick={() => setSelectedVehicle(v)}
                        className={`px-3 py-1.5 text-[11px] font-mono font-bold uppercase tracking-widest border transition-all ${
                          selectedVehicle === v
                            ? 'bg-blue-600 text-white border-blue-600 shadow'
                            : 'bg-white text-blue-600 border-blue-200 hover:border-blue-500'
                        }`}
                      >
                        {highlight(v, query)}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Stats row */}
              {selectedVehicle && (
                <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-slate-100">
                  <StatPill
                    label={language === 'en' ? 'Records' : 'रिकॉर्ड'}
                    value={filteredRows.length}
                    color="border-blue-100"
                  />
                  {totalAmount && (
                    <StatPill
                      label={totalAmount.col}
                      value={`₹ ${totalAmount.sum.toLocaleString('en-IN')}`}
                      color="border-emerald-100"
                    />
                  )}
                  <StatPill
                    label={language === 'en' ? 'Columns' : 'कॉलम'}
                    value={columns.length}
                    color="border-slate-100"
                  />
                </div>
              )}
            </div>

            {/* Table */}
            {selectedVehicle && sortedRows.length > 0 && (
              <div className="bg-white border border-blue-100 shadow-xl">

                {/* Table header bar */}
                <div className="px-6 py-4 border-b border-blue-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black text-blue-700 bg-blue-50 px-3 py-1 border border-blue-200 uppercase tracking-widest">
                      {selectedVehicle}
                    </span>
                    <span className="text-[11px] text-slate-400 uppercase tracking-widest font-bold">
                      — {sortedRows.length} {language === 'en' ? 'records' : 'रिकॉर्ड'}
                    </span>
                  </div>

                  {/* Export CSV */}
                  <button
                    onClick={() => {
                      const headers = columns.join(',');
                      const rows = sortedRows.map((r) =>
                        columns.map((c) => `"${String(r[c] ?? '').replace(/"/g, '""')}"`).join(',')
                      );
                      const csv = [headers, ...rows].join('\n');
                      const blob = new Blob([csv], { type: 'text/csv' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `${selectedVehicle}_toll_records.csv`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-widest hover:bg-slate-50 hover:border-slate-300 transition-all"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    {language === 'en' ? 'Export CSV' : 'CSV डाउनलोड'}
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-[12px]">
                    <thead>
                      <tr className="bg-slate-50 border-b border-blue-100">
                        <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest w-10">#</th>
                        {columns.map((col) => (
                          <th
                            key={col}
                            onClick={() => handleSort(col)}
                            className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap cursor-pointer hover:bg-blue-50 hover:text-blue-700 transition-colors select-none"
                          >
                            <div className="flex items-center gap-1.5">
                              {col}
                              <span className={`text-[9px] transition-opacity ${sortCol === col ? 'opacity-100 text-blue-600' : 'opacity-20'}`}>
                                {sortCol === col ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}
                              </span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-blue-50/60">
                      {sortedRows.map((row, i) => (
                        <tr key={i} className="hover:bg-blue-50/30 transition-colors">
                          <td className="px-4 py-3 text-[10px] text-slate-300 font-bold">{i + 1}</td>
                          {columns.map((col) => (
                            <td key={col} className="px-4 py-3 text-slate-600 whitespace-nowrap">
                              {col === 'Vehicle No' ? (
                                <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 border border-blue-100">
                                  {highlight(String(row[col] ?? ''), query)}
                                </span>
                              ) : (
                                <CellValue value={row[col]} />
                              )}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Table footer */}
                <div className="px-6 py-3 border-t border-blue-50 bg-slate-50/50">
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                    {language === 'en'
                      ? `Showing all ${sortedRows.length} records · Click column headers to sort`
                      : `सभी ${sortedRows.length} रिकॉर्ड · कॉलम हेडर पर क्लिक करके क्रमबद्ध करें`}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}