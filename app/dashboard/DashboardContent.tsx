'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Violation } from '@/types/violation';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useInView } from 'react-intersection-observer';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { CgSpinner } from 'react-icons/cg';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toImageSrc(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const s = raw.trim();
  if (s.startsWith('data:')) return s;
  const mime = s.startsWith('iVBOR') ? 'image/png' : 'image/jpeg';
  return `data:${mime};base64,${s}`;
}

// ---------------------------------------------------------------------------
// LazyImage
// ---------------------------------------------------------------------------
function LazyImage({
  src,
  alt,
  style,
  className,
}: {
  src: string;
  alt: string;
  style?: React.CSSProperties;
  className?: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const { ref, inView } = useInView({ triggerOnce: true, rootMargin: '200px' });

  return (
    <div ref={ref} style={style} className="relative bg-slate-100 overflow-hidden">
      {(!inView || !loaded) && (
        <div
          className="absolute inset-0 bg-linear-to-r from-slate-100 via-slate-200 to-slate-100 animate-[shimmer_1.4s_infinite]"
          style={style}
        />
      )}
      {inView && (
        <img
          src={src}
          alt={alt}
          style={{ ...style, display: 'block', opacity: loaded ? 1 : 0, transition: 'opacity 0.3s ease' }}
          className={className}
          onLoad={() => setLoaded(true)}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton row
// ---------------------------------------------------------------------------
function SkeletonRow() {
  return (
    <tr className="border-b border-blue-50/50">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
        <td key={i} className="px-6 py-5">
          <div
            className="h-3 bg-linear-to-r from-slate-100 via-slate-200 to-slate-100 animate-[shimmer_1.4s_infinite] rounded-sm"
            style={{ width: `${60 + (i * 13) % 40}%` }}
          />
        </td>
      ))}
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Translations
// ---------------------------------------------------------------------------
const TRANSLATIONS: Record<string, any> = {
  en: {
    title: 'Traffic Control System',
    subtitle: 'Enforcement Console',
    signOut: 'Sign Out',
    stats: {
      pending: 'Pending Action',
      accepted: 'Validated',
      declined: 'Flagged / Denied',
    },
    activeRecords: 'Active Records',
    noRecords: 'No records found',
    source: 'Source',
    table: {
      vehicleNumber: 'Vehicle Number',
      detectionTime: 'Detection Time',
      location: 'Location',
      violationType: 'Violation Type',
      evidence: 'Evidence',
      action: 'Action',
    },
    search: {
      filterType: 'Filter By',
      placeholder: 'Search...',
      button: 'Search',
      types: {
        id: 'ID',
        track_id: 'Track ID',
        vehicle_number: 'Vehicle Number',
        location: 'Location',
        status: 'Status',
      },
    },
    status: {
      pending: 'PENDING',
      approved: 'ACCEPTED',
      rejected: 'DECLINED',
      approve: 'ACCEPT',
      reject: 'DECLINE',
    },
    rejection: {
      title: 'Rejection Reason',
      subtitle: 'Select justification for record denial',
      reasons: [
        'No violation visible',
        'Image too blurry or unclear',
        'Incorrect vehicle number',
        'Emergency / exempt vehicle',
        'False positive detection',
        'System entry / test',
      ],
      cancel: 'Cancel',
      confirm: 'Confirm',
      processing: 'Processing...',
    },
    pagination: {
      showing: 'Showing',
      to: 'to',
      of: 'of',
      records: 'records',
      previous: 'Previous',
      next: 'Next',
    },
    modal: {
      title: 'Violation Details',
      copyId: 'Copy ID',
      trackId: 'Track ID',
      vehicleNumber: 'Vehicle Number',
      detectionTime: 'Detection Time',
      location: 'Location',
      dateFolder: 'Date Folder',
      violationType: 'Violation Type',
      status: 'Status',
      reason: 'Reason',
      images: {
        complete: 'Full Scene',
        plate: 'License Plate',
      },
      close: 'Close',
    },
  },
  hi: {
    title: 'यातायात नियंत्रण प्रणाली',
    signOut: 'साइन आउट',
    stats: {
      pending: 'लंबित कार्रवाई',
      accepted: 'मान्य',
      declined: 'चिह्नित / अस्वीकृत',
    },
    activeRecords: 'सक्रिय रिकॉर्ड',
    noRecords: 'कोई रिकॉर्ड नहीं मिला',
    source: 'स्रोत',
    table: {
      vehicleNumber: 'वाहन संख्या',
      detectionTime: 'पहचान का समय',
      location: 'स्थान',
      violationType: 'उल्लंघन का प्रकार',
      evidence: 'साक्ष्य',
      action: 'कार्रवाई',
    },
    search: {
      filterType: 'फ़िल्टर प्रकार',
      placeholder: 'खोजें...',
      button: 'खोजें',
      types: {
        id: 'आईडी',
        track_id: 'ट्रैक आईडी',
        vehicle_number: 'वाहन संख्या',
        location: 'स्थान',
        status: 'स्थिति',
      },
    },
    status: {
      pending: 'लंबित (PENDING)',
      approved: 'स्वीकृत (ACCEPTED)',
      rejected: 'अस्वीकृत (DECLINED)',
      approve: 'स्वीकार करें',
      reject: 'अस्वीकार करें',
    },
    rejection: {
      title: 'अस्वीकृति कारण',
      subtitle: 'रिकॉर्ड अस्वीकृति के लिए औचित्य चुनें',
      reasons: [
        'कोई उल्लंघन दिखाई नहीं दे रहा',
        'छवि बहुत धुंधली या अस्पष्ट है',
        'गलत वाहन संख्या',
        'आपातकालीन / छूट प्राप्त वाहन',
        'गलत सकारात्मक पहचान',
        'सिस्टम एंट्री / टेस्ट',
      ],
      cancel: 'रद्द करें',
      confirm: 'पुष्टि करें',
      processing: 'प्रगति पर है...',
    },
    pagination: {
      showing: 'दिखा रहा है',
      to: 'से',
      of: 'का',
      records: 'रिकॉर्ड',
      previous: 'पिछला',
      next: 'अगला',
    },
    modal: {
      title: 'उल्लंघन विवरण',
      copyId: 'आईडी कॉपी करें',
      trackId: 'ट्रैक आईडी',
      vehicleNumber: 'वाहन संख्या',
      detectionTime: 'पहचान का समय',
      location: 'स्थान',
      dateFolder: 'डेट फोल्डर',
      violationType: 'उल्लंघन का प्रकार',
      status: 'स्थिति',
      reason: 'कारण',
      images: {
        complete: 'पूर्ण दृश्य',
        plate: 'लाइसेंस प्लेट',
      },
      close: 'बंद करें',
    },
  },
};

// ---------------------------------------------------------------------------
// StatusBadge — with INLINE rejection popover (no center modal)
// ---------------------------------------------------------------------------
function StatusBadge({
  violation,
  onOpenDecline,
  onAccept,
  updatingId,
  t,
}: {
  violation: Violation;
  onOpenDecline: (id: string) => void;
  onAccept: (id: string) => void;
  updatingId: string | null;
  t: any;
}) {
  const [open, setOpen] = useState(false);
  const [showRejectPanel, setShowRejectPanel] = useState(false);
  const [selectedReason, setSelectedReason] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const isUpdating = updatingId === violation.id;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setShowRejectPanel(false);
        setSelectedReason('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const baseClass =
    'inline-flex items-center gap-1.5 px-2.5 py-1 text-[13px] font-semibold uppercase tracking-widest border transition-colors';

  if (isUpdating) {
    return (
      <span className={`${baseClass} bg-blue-50 text-blue-600 border-blue-200 cursor-wait`}>
        <AiOutlineLoading3Quarters className="w-3.5 h-3.5 animate-spin" />
        <span className="ml-1">{t.rejection.processing}</span>
      </span>
    );
  }

  if (violation.status === 'ACCEPTED') {
    return (
      <span className={`${baseClass} bg-emerald-50 text-emerald-600 border-emerald-200 cursor-default`}>
        ✓ {t.status.approved}
      </span>
    );
  }

  if (violation.status === 'DECLINED') {
    return (
      <div className="flex flex-col gap-1 items-end">
        <span className={`${baseClass} bg-rose-50 text-rose-600 border-rose-200 cursor-default`}>
          ✕ {t.status.rejected}
        </span>
        {violation.reason && (
          <p className="text-[9px] text-slate-400 text-right max-w-[120px]">{violation.reason}</p>
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={ref} onClick={(e) => e.stopPropagation()}>
      {/* PENDING toggle button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
          setShowRejectPanel(false);
          setSelectedReason('');
        }}
        className={`${baseClass} bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100/50 cursor-pointer`}
      >
        {t.status.pending}
      </button>

      {/* Accept / Decline dropdown */}
      {open && !showRejectPanel && (
        <div className="absolute right-0 mt-1 bg-white border border-blue-100 shadow-lg w-40 z-50">
          <button
            onClick={() => {
              onAccept(violation.id);
              setOpen(false);
            }}
            className="w-full text-left px-4 py-3 text-[13px] font-semibold text-blue-600 hover:bg-blue-50 uppercase tracking-widest transition-colors"
          >
            {t.status.approve}
          </button>
          <button
            onClick={() => {
              setShowRejectPanel(true);
            }}
            className="w-full text-left px-4 py-3 text-[13px] font-semibold text-slate-600 hover:bg-blue-50 uppercase tracking-widest transition-colors"
          >
            {t.status.reject}
          </button>
        </div>
      )}

      {/* INLINE rejection reason panel — replaces center modal */}
      {open && showRejectPanel && (
        <div className="absolute right-0 mt-1 bg-white border border-blue-200 shadow-2xl z-50 w-64 rounded-sm">
          {/* Header */}
          <div className="px-4 py-3 border-b border-blue-50 bg-slate-50/80 flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              {t.rejection.title}
            </span>
            <button
              onClick={() => { setShowRejectPanel(false); setSelectedReason(''); }}
              className="text-slate-300 hover:text-slate-500 text-lg leading-none"
            >
              ×
            </button>
          </div>

          {/* Reason list */}
          <div className="p-2 space-y-1">
            {t.rejection.reasons.map((r: string) => (
              <button
                key={r}
                onClick={() => setSelectedReason(r)}
                className={`w-full text-left px-3 py-2 text-[11px] font-semibold uppercase tracking-wide border transition-all rounded-sm ${
                  selectedReason === r
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-500 border-slate-100 hover:border-blue-300 hover:bg-blue-50/50'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Confirm / Cancel */}
          <div className="flex gap-2 px-3 pb-3 pt-1">
            <button
              onClick={() => { setShowRejectPanel(false); setOpen(false); setSelectedReason(''); }}
              className="flex-1 py-2 border border-slate-200 text-slate-400 text-[11px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-colors rounded-sm"
            >
              {t.rejection.cancel}
            </button>
            <button
              disabled={!selectedReason || !!updatingId}
              onClick={() => {
                onOpenDecline(violation.id);
                // pass reason up via a custom event trick — easier: call directly
                // We'll handle this via a different callback pattern below
                setOpen(false);
                setShowRejectPanel(false);
              }}
              className="flex-1 py-2 bg-blue-600 text-white text-[11px] font-bold uppercase tracking-widest hover:bg-blue-700 disabled:opacity-40 transition-all rounded-sm"
            >
              {t.rejection.confirm}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// StatusBadge V2 — passes reason directly via onDeclineWithReason
// ---------------------------------------------------------------------------
function StatusBadgeV2({
  violation,
  onDeclineWithReason,
  onAccept,
  updatingId,
  t,
}: {
  violation: Violation;
  onDeclineWithReason: (id: string, reason: string) => void;
  onAccept: (id: string) => void;
  updatingId: string | null;
  t: any;
}) {
  const [open, setOpen] = useState(false);
  const [showRejectPanel, setShowRejectPanel] = useState(false);
  const [selectedReason, setSelectedReason] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  const isUpdating = updatingId === violation.id;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setShowRejectPanel(false);
        setSelectedReason('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const baseClass =
    'inline-flex items-center gap-1.5 px-2.5 py-1 text-[13px] font-semibold uppercase tracking-widest border transition-colors';

  if (isUpdating) {
    return (
      <span className={`${baseClass} bg-blue-50 text-blue-600 border-blue-200 cursor-wait`}>
        <AiOutlineLoading3Quarters className="w-3.5 h-3.5 animate-spin" />
        <span className="ml-1">{t.rejection.processing}</span>
      </span>
    );
  }

  if (violation.status === 'ACCEPTED') {
    return (
      <span className={`${baseClass} bg-emerald-50 text-emerald-600 border-emerald-200 cursor-default`}>
        ✓ {t.status.approved}
      </span>
    );
  }

  if (violation.status === 'DECLINED') {
    return (
      <div className="flex flex-col gap-1 items-end">
        <span className={`${baseClass} bg-rose-50 text-rose-600 border-rose-200 cursor-default`}>
          ✕ {t.status.rejected}
        </span>
        {violation.reason && (
          <p className="text-[9px] text-slate-400 text-right max-w-[120px]">{violation.reason}</p>
        )}
      </div>
    );
  }

  // PENDING state
  return (
    <div className="relative" ref={ref} onClick={(e) => e.stopPropagation()}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
          setShowRejectPanel(false);
          setSelectedReason('');
        }}
        className={`${baseClass} bg-orange-50 text-orange-600 border-orange-200 hover:bg-orange-100/50 cursor-pointer`}
      >
        {t.status.pending}
      </button>

      {/* Accept / Decline choice */}
      {open && !showRejectPanel && (
        <div className="absolute right-0 mt-1 bg-white border border-blue-100 shadow-lg w-40 z-50">
          <button
            onClick={() => {
              onAccept(violation.id);
              setOpen(false);
            }}
            className="w-full text-left px-4 py-3 text-[13px] font-semibold text-blue-600 hover:bg-blue-50 uppercase tracking-widest transition-colors"
          >
            {t.status.approve}
          </button>
          <button
            onClick={() => setShowRejectPanel(true)}
            className="w-full text-left px-4 py-3 text-[13px] font-semibold text-slate-600 hover:bg-blue-50 uppercase tracking-widest transition-colors"
          >
            {t.status.reject}
          </button>
        </div>
      )}

      {/* ── INLINE rejection reason panel ── */}
      {open && showRejectPanel && (
        <div className="absolute right-0 mt-1 bg-white border border-blue-200 shadow-2xl z-[60] w-64">
          <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              {t.rejection.title}
            </span>
            <button
              onClick={() => { setShowRejectPanel(false); setSelectedReason(''); }}
              className="text-slate-300 hover:text-slate-500 text-lg leading-none"
            >
              ×
            </button>
          </div>

          <div className="p-2 space-y-1 max-h-52 overflow-y-auto">
            {t.rejection.reasons.map((r: string) => (
              <button
                key={r}
                onClick={() => setSelectedReason(r)}
                className={`w-full text-left px-3 py-2 text-[11px] font-semibold border transition-all ${
                  selectedReason === r
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-slate-500 border-slate-100 hover:border-blue-300 hover:bg-blue-50/60'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <div className="flex gap-2 p-2 border-t border-slate-100">
            <button
              onClick={() => { setShowRejectPanel(false); setOpen(false); setSelectedReason(''); }}
              className="flex-1 py-2 border border-slate-200 text-slate-400 text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50"
            >
              {t.rejection.cancel}
            </button>
            <button
              disabled={!selectedReason || !!updatingId}
              onClick={() => {
                if (!selectedReason) return;
                onDeclineWithReason(violation.id, selectedReason);
                setOpen(false);
                setShowRejectPanel(false);
                setSelectedReason('');
              }}
              className="flex-1 py-2 bg-blue-600 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-blue-700 disabled:opacity-40 transition-all flex items-center justify-center gap-1"
            >
              {updatingId ? (
                <AiOutlineLoading3Quarters className="w-3 h-3 animate-spin" />
              ) : null}
              {t.rejection.confirm}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// EditableVehicleNumber — shown in the last column after Action
// ---------------------------------------------------------------------------
function EditableVehicleNumber({
  violation,
  onSave,
  language,
}: {
  violation: Violation;
  onSave: (id: string, newNumber: string) => Promise<void>;
  language: string;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(violation.vehicle_number || '');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isAccepted = violation.status === 'ACCEPTED';
  const isEmpty = !violation.vehicle_number?.trim();

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus();
  }, [editing]);

  // Read-only for non-accepted rows
  if (!isAccepted) {
    return (
      <span className="font-mono text-xs text-blue-700 font-bold bg-blue-50 px-2 py-1 border border-blue-100">
        {violation.vehicle_number || '—'}
      </span>
    );
  }

  // Accepted + empty → amber warning pill
  if (!editing) {
    return (
      <button
        onClick={(e) => { e.stopPropagation(); setEditing(true); }}
        title={language === 'en' ? 'Click to edit vehicle number' : 'वाहन संख्या संपादित करें'}
        className={`font-mono text-xs font-bold px-2 py-1 border transition-all group ${
          isEmpty
            ? 'bg-amber-50 text-amber-600 border-amber-300 border-dashed animate-pulse hover:animate-none hover:bg-amber-100'
            : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
        }`}
      >
        {isEmpty ? (
          <span className="flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            {language === 'en' ? 'ADD NUMBER' : 'संख्या जोड़ें'}
          </span>
        ) : (
          <span className="flex items-center gap-1">
            {violation.vehicle_number}
            <svg className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </span>
        )}
      </button>
    );
  }

  // Edit mode
  return (
    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value.toUpperCase())}
        onKeyDown={async (e) => {
          if (e.key === 'Enter') {
            setSaving(true);
            await onSave(violation.id, value);
            setSaving(false);
            setEditing(false);
          }
          if (e.key === 'Escape') {
            setValue(violation.vehicle_number || '');
            setEditing(false);
          }
        }}
        placeholder="MH12AB1234"
        className="font-mono text-xs font-bold text-blue-700 border border-blue-400 px-2 py-1 w-28 focus:outline-none focus:ring-1 focus:ring-blue-500 uppercase bg-blue-50"
      />
      <button
        disabled={saving}
        onClick={async (e) => {
          e.stopPropagation();
          setSaving(true);
          await onSave(violation.id, value);
          setSaving(false);
          setEditing(false);
        }}
        className="p-1 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
        title="Save"
      >
        {saving
          ? <AiOutlineLoading3Quarters className="w-3 h-3 animate-spin" />
          : <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
        }
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); setValue(violation.vehicle_number || ''); setEditing(false); }}
        className="p-1 text-slate-400 hover:text-slate-600"
        title="Cancel"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ViolationRow — columns: Detection Time | Location | Violation Type | Track ID | Scene | Plate | Action | Vehicle Number
// ---------------------------------------------------------------------------
const ViolationRow = React.memo(({
  violation,
  language,
  t,
  onSelect,
  onAccept,
  onDeclineWithReason,
  onSaveVehicleNumber,
  updatingId,
}: {
  violation: Violation;
  language: string;
  t: any;
  onSelect: (v: Violation) => void;
  onAccept: (id: string) => void;
  onDeclineWithReason: (id: string, reason: string) => void;
  onSaveVehicleNumber: (id: string, newNumber: string) => Promise<void>;
  updatingId: string | null;
}) => {
  return (
    <tr
      onClick={() => onSelect(violation)}
      className="hover:bg-blue-50/40 transition-colors cursor-pointer group"
    >
      <td className="px-6 py-4 text-[11px] text-slate-500 whitespace-nowrap">
        {violation.detected_at
          ? new Date(violation.detected_at).toLocaleString(
              language === 'en' ? 'en-IN' : 'hi-IN',
              { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }
            )
          : '—'}
      </td>

      <td className="px-6 py-4 text-[13px] text-slate-500 font-medium uppercase tracking-tight">
        {violation.location}
      </td>

      <td className="px-6 py-4">
        <span className="text-blue-600 text-[13px] font-bold uppercase tracking-widest">
          {violation.helmet_status || (language === 'en' ? 'DETECTION' : 'पहचान')}
        </span>
      </td>

      <td className="px-6 py-4 text-[11px] text-slate-500 font-medium uppercase">{violation.track_id}</td>

      <td className="px-3 py-3">
        {toImageSrc(violation.complete_image_b64) ? (
          <div className="group/thumb relative overflow-hidden border border-blue-100 inline-block w-full max-w-[200px]">
            <LazyImage
              src={toImageSrc(violation.complete_image_b64)!}
              alt="Full scene"
              style={{ width: '100%', height: 'auto' }}
              className="transition-transform duration-300 group-hover/thumb:scale-105"
            />
          </div>
        ) : (
          <span className="text-[10px] text-slate-300 uppercase tracking-widest">—</span>
        )}
      </td>

      <td className="px-3 py-3">
        {toImageSrc(violation.plate_image_b64) ? (
          <div className="group/plate relative overflow-hidden border border-blue-100 inline-block w-full max-w-[200px]">
            <LazyImage
              src={toImageSrc(violation.plate_image_b64)!}
              alt="Plate"
              style={{ width: '100%', height: 'auto' }}
              className="transition-transform duration-300 group-hover/plate:scale-105"
            />
          </div>
        ) : (
          <span className="text-[10px] text-slate-300 uppercase tracking-widest">—</span>
        )}
      </td>

      {/* ACTION column */}
      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
        <StatusBadgeV2
          violation={violation}
          onAccept={onAccept}
          onDeclineWithReason={onDeclineWithReason}
          updatingId={updatingId}
          t={t}
        />
      </td>

      {/* VEHICLE NUMBER — editable when ACCEPTED, moved here after Action */}
      <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
        <EditableVehicleNumber
          violation={violation}
          onSave={onSaveVehicleNumber}
          language={language}
        />
      </td>
    </tr>
  );
});

ViolationRow.displayName = 'ViolationRow';

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
interface DashboardContentProps {
  initialViolations: Violation[];
  initialTotal: number;
  initialPage: number;
  initialLimit: number;
  initialStats: { pending: number; accepted: number; declined: number };
}

export default function DashboardContent({
  initialViolations,
  initialTotal,
  initialPage,
  initialLimit,
  initialStats,
}: DashboardContentProps) {
  const [violations, setViolations] = useState<Violation[]>(initialViolations);
  const [totalCount, setTotalCount] = useState(initialTotal);
  const [page, setPage] = useState(initialPage);
  const limit = initialLimit;
  const [stats, setStats] = useState(initialStats);
  const [filterType, setFilterType] = useState('vehicle_number');
  const [filterValue, setFilterValue] = useState('');
  const [language, setLanguage] = useState<'en' | 'hi'>('en');

  const [selectedViolation, setSelectedViolation] = useState<Violation | null>(null);

  // Loading states
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [loadingImages, setLoadingImages] = useState(false);

  // Batch rendering 25+25
  const [showSecondBatch, setShowSecondBatch] = useState(false);
  const { ref: batchRef, inView: batchInView } = useInView({ rootMargin: '100px' });

  useEffect(() => { setShowSecondBatch(false); }, [violations, page]);
  useEffect(() => {
    if (batchInView && !showSecondBatch && violations.length > 25) setShowSecondBatch(true);
  }, [batchInView, showSecondBatch, violations.length]);

  const isInitialMount = useRef(true);
  const router = useRouter();
  const t = TRANSLATIONS[language];

  // Language persistence
  useEffect(() => {
    const saved = localStorage.getItem('dash_lang');
    if (saved === 'hi' || saved === 'en') setLanguage(saved);
  }, []);
  useEffect(() => { localStorage.setItem('dash_lang', language); }, [language]);

  // Modal images
  const [extraImages, setExtraImages] = useState<{
    complete_image: string | null;
    plate_image: string | null;
  } | null>(null);

  useEffect(() => {
    if (!selectedViolation) { setExtraImages(null); return; }
    if (selectedViolation.complete_image_b64 !== undefined) {
      setExtraImages({
        complete_image: selectedViolation.complete_image_b64 ?? null,
        plate_image: selectedViolation.plate_image_b64 ?? null,
      });
      return;
    }
    setLoadingImages(true);
    setExtraImages(null);
    axios.get(`/api/violations/${selectedViolation.id}`)
      .then((res) => {
        const d = res.data.data;
        setExtraImages({ complete_image: d?.complete_image_b64 ?? null, plate_image: d?.plate_image_b64 ?? null });
      })
      .catch((error: any) => {
        const msg = error.response?.data?.error || error.response?.data?.message || (language === 'en' ? 'Failed to load images' : 'छवियाँ लोड नहीं हो सकीं');
        toast.error(msg);
        setExtraImages({ complete_image: null, plate_image: null });
      })
      .finally(() => setLoadingImages(false));
  }, [selectedViolation?.id]);

  const modalImages = extraImages;

  // Fetch violations
  const fetchViolations = useCallback(async (showLoading = false) => {
    if (showLoading) setIsLoadingData(true);
    try {
      const response = await axios.get('/api/violations', {
        params: { page, limit: initialLimit, filterType, filterValue },
      });
      if (response.status === 200) {
        setViolations(response.data.data);
        setTotalCount(response.data.count);
        setStats(response.data.stats);
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        router.push('/signin');
      } else {
        const msg = error.response?.data?.error || error.response?.data?.message || (language === 'en' ? 'Failed to fetch records.' : 'रिकॉर्ड प्राप्त करने में विफल।');
        toast.error(msg);
      }
    } finally {
      if (showLoading) setIsLoadingData(false);
    }
  }, [page, initialLimit, filterType, filterValue, language, router]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      if (violations.length === 0) fetchViolations(true);
      return;
    }
    fetchViolations(true);
  }, [page]); // eslint-disable-line

  useEffect(() => {
    const interval = setInterval(() => fetchViolations(false), 30_000);
    return () => clearInterval(interval);
  }, [fetchViolations]);

  // Status update
  async function handleUpdateStatus(id: string, status: string, reason?: string) {
    setUpdatingId(id);
    const toastId = toast.loading(language === 'en' ? 'Updating status…' : 'स्थिति अपडेट हो रही है…');
    try {
      const uppercaseStatus = status.toUpperCase();
      const response = await axios.patch(`/api/violations/${id}`, { status: uppercaseStatus, reason });
      if (response.status === 200) {
        setViolations((prev) =>
          prev.map((v) => v.id === id ? { ...v, status: uppercaseStatus, reason: reason || null } : v)
        );
        setStats((prev) => {
          const s = { ...prev };
          if (uppercaseStatus === 'ACCEPTED') { s.accepted++; s.pending--; }
          else if (uppercaseStatus === 'DECLINED') { s.declined++; s.pending--; }
          return s;
        });
        if (selectedViolation?.id === id) {
          setSelectedViolation((v) => v ? { ...v, status: uppercaseStatus, reason: reason || null } : v);
        }
        toast.success(
          uppercaseStatus === 'ACCEPTED'
            ? (language === 'en' ? 'Violation accepted ✓' : 'उल्लंघन स्वीकृत ✓')
            : (language === 'en' ? 'Violation declined ✕' : 'उल्लंघन अस्वीकृत ✕'),
          { id: toastId }
        );
      }
    } catch (error: any) {
      if (error.response?.status === 401) { toast.dismiss(toastId); router.push('/signin'); }
      else {
        const msg = error.response?.data?.error || error.response?.data?.message || (language === 'en' ? 'Failed to update.' : 'अपडेट विफल।');
        toast.error(msg, { id: toastId });
      }
    } finally {
      setUpdatingId(null);
    }
  }

  // Save vehicle number
  async function handleSaveVehicleNumber(id: string, newNumber: string) {
    const toastId = toast.loading(language === 'en' ? 'Saving vehicle number…' : 'वाहन संख्या सहेजी जा रही है…');
    try {
      const response = await axios.patch(`/api/violations/${id}`, { vehicle_number: newNumber });
      if (response.status === 200) {
        setViolations((prev) =>
          prev.map((v) => v.id === id ? { ...v, vehicle_number: newNumber } : v)
        );
        if (selectedViolation?.id === id) {
          setSelectedViolation((v) => v ? { ...v, vehicle_number: newNumber } : v);
        }
        toast.success(language === 'en' ? 'Vehicle number updated ✓' : 'वाहन संख्या अपडेट हुई ✓', { id: toastId });
      }
    } catch (error: any) {
      const msg = error.response?.data?.error || error.response?.data?.message || (language === 'en' ? 'Failed to save.' : 'सहेजना विफल।');
      toast.error(msg, { id: toastId });
    }
  }

  // Logout
  const handleLogout = async () => {
    const toastId = toast.loading(language === 'en' ? 'Signing out…' : 'साइन आउट हो रहा है…');
    try {
      await axios.post('/api/auth/logout');
      toast.success(language === 'en' ? 'Signed out' : 'साइन आउट हो गए', { id: toastId });
      router.replace('/signin');
    } catch (error: any) {
      const msg = error.response?.data?.error || error.response?.data?.message || (language === 'en' ? 'Sign out failed' : 'साइन आउट विफल');
      toast.error(msg, { id: toastId });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(language === 'en' ? 'ID copied to clipboard' : 'आईडी कॉपी हो गई');
  };

  const totalPages = Math.ceil(totalCount / limit);
  const SKELETON_COUNT = 6;

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0% { background-position: -400px 0; }
          100% { background-position: 400px 0; }
        }
        .animate-\\[shimmer_1\\.4s_infinite\\] {
          background-size: 800px 100%;
          animation: shimmer 1.4s infinite linear;
        }
      `}</style>

      <div className="min-h-screen bg-slate-50 text-slate-800 font-sans">

        {/* HEADER */}
        <header className="bg-blue-600 border-b border-blue-700 sticky top-0 z-40 shadow-sm">
          <div className="px-6 py-4 flex justify-between items-center">
            <h1 className="text-sm font-bold text-white uppercase">{t.title}</h1>
            <div className="flex items-center gap-6">
              <button
                onClick={() => setLanguage((l) => (l === 'en' ? 'hi' : 'en'))}
                className="text-[13px] font-bold text-blue-200 hover:text-white uppercase tracking-widest px-3 py-1 border border-blue-400 hover:border-white transition-all"
              >
                {language === 'en' ? 'हिन्दी' : 'English'}
              </button>
              <button
                onClick={handleLogout}
                className="text-[13px] text-blue-100 hover:text-white uppercase tracking-widest flex items-center gap-2 transition-all hover:gap-3"
              >
                {t.signOut} <span className="text-xs">→</span>
              </button>
            </div>
          </div>
        </header>

        <main className="px-6 py-8">

          {/* STATS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[
              { label: t.stats.pending, count: stats.pending, color: 'text-orange-600', border: 'border-l-4 border-l-orange-400' },
              { label: t.stats.accepted, count: stats.accepted, color: 'text-emerald-600', border: 'border-l-4 border-l-emerald-400' },
              { label: t.stats.declined, count: stats.declined, color: 'text-rose-600', border: 'border-l-4 border-l-rose-400' },
            ].map((stat) => (
              <div key={stat.label} className={`bg-white border border-blue-100 p-6 flex justify-between items-center shadow-sm hover:shadow-md transition-shadow ${stat.border}`}>
                <span className="text-[13px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</span>
                <span className={`text-3xl font-bold ${stat.color}`}>{stat.count}</span>
              </div>
            ))}
          </div>

          {/* SEARCH */}
          <div className="flex flex-col lg:flex-row justify-between items-end lg:items-center mb-6 gap-4 bg-white p-4 border border-blue-100 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
              <h2 className="text-[13px] font-bold text-slate-400 uppercase tracking-widest">
                {t.activeRecords}{totalCount > 0 && ` (${totalCount})`}
              </h2>
            </div>
            <div className="flex flex-col md:flex-row items-center gap-3 w-full lg:w-auto">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full md:w-48 border border-blue-100 px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest bg-slate-50/50 focus:outline-none focus:border-blue-600 transition-all cursor-pointer"
              >
                {Object.entries(t.search.types).map(([key, label]: [string, any]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              <div className="relative w-full md:w-64">
                <input
                  value={filterValue}
                  onChange={(e) => setFilterValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      if (page === 1) fetchViolations(true); else setPage(1);
                    }
                  }}
                  placeholder={t.search.placeholder}
                  className="w-full border border-blue-100 px-4 py-2.5 text-[11px] focus:outline-none focus:border-blue-600 bg-white transition-all placeholder:text-slate-300 font-medium"
                />
              </div>
              <button
                disabled={isLoadingData}
                onClick={() => { if (page === 1) fetchViolations(true); else setPage(1); }}
                className="w-full md:w-auto px-8 py-2.5 bg-blue-600 text-white text-[11px] font-bold uppercase tracking-widest hover:bg-blue-700 transition-all shadow-md active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoadingData ? (
                  <><AiOutlineLoading3Quarters className="w-3.5 h-3.5 animate-spin" />{language === 'en' ? 'Searching…' : 'खोज रहे हैं…'}</>
                ) : t.search.button}
              </button>
            </div>
          </div>

          {/* PAGINATION TOP */}
          {totalPages > 1 && (
            <div className="mt-4 bg-white border border-blue-100 px-6 py-4 flex items-center justify-between">
              <p className="text-[13px] font-bold text-slate-400 uppercase tracking-widest">
                {t.pagination.showing} {((page - 1) * limit) + 1}–{Math.min(page * limit, totalCount)} {t.pagination.of} {totalCount} {t.pagination.records}
              </p>
              <div className="flex items-center gap-2">
                <button disabled={page === 1 || isLoadingData} onClick={() => setPage((p) => p - 1)}
                  className="px-4 py-2 border border-blue-100 text-[13px] font-bold uppercase tracking-widest bg-white hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2">
                  {isLoadingData && page > 1 ? <AiOutlineLoading3Quarters className="w-3 h-3 animate-spin text-blue-600" /> : '←'}
                  {t.pagination.previous}
                </button>
                <span className="px-4 py-2 text-[13px] font-bold text-blue-600 border border-blue-200 bg-blue-50">{page} / {totalPages}</span>
                <button disabled={page === totalPages || isLoadingData} onClick={() => setPage((p) => p + 1)}
                  className="px-4 py-2 border border-blue-100 text-[13px] font-bold uppercase tracking-widest bg-white hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2">
                  {t.pagination.next}
                  {isLoadingData && page < totalPages ? <AiOutlineLoading3Quarters className="w-3 h-3 animate-spin text-blue-600" /> : '→'}
                </button>
              </div>
            </div>
          )}

          {/* TABLE */}
          <div className="bg-white border border-blue-100 shadow-xl overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-blue-100">
                  <th className="px-6 py-5 text-[13px] font-bold text-slate-500 uppercase tracking-widest">{t.table.detectionTime}</th>
                  <th className="px-6 py-5 text-[13px] font-bold text-slate-500 uppercase tracking-widest">{t.table.location}</th>
                  <th className="px-6 py-5 text-[13px] font-bold text-slate-500 uppercase tracking-widest">{t.table.violationType}</th>
                  <th className="px-6 py-5 text-[13px] font-bold text-slate-500 uppercase tracking-widest">{language === 'en' ? 'Track ID' : 'ट्रैक आईडी'}</th>
                  <th className="px-6 py-5 text-[13px] font-bold text-slate-500 uppercase tracking-widest">{language === 'en' ? 'Scene' : 'दृश्य'}</th>
                  <th className="px-6 py-5 text-[13px] font-bold text-slate-500 uppercase tracking-widest">{language === 'en' ? 'Plate' : 'प्लेट'}</th>
                  <th className="px-6 py-5 text-[13px] font-bold text-slate-500 uppercase tracking-widest text-right">{t.table.action}</th>
                  {/* Vehicle Number is NOW the last column */}
                  <th className="px-4 py-5 text-[13px] font-bold text-slate-500 uppercase tracking-widest">{t.table.vehicleNumber}</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-blue-50/50">
                {isLoadingData ? (
                  Array.from({ length: SKELETON_COUNT }).map((_, i) => <SkeletonRow key={i} />)
                ) : (
                  <>
                    {violations.slice(0, 25).map((v) => (
                      <ViolationRow
                        key={v.id}
                        violation={v}
                        language={language}
                        t={t}
                        onSelect={setSelectedViolation}
                        onAccept={(id) => handleUpdateStatus(id, 'accepted')}
                        onDeclineWithReason={(id, reason) => handleUpdateStatus(id, 'declined', reason)}
                        onSaveVehicleNumber={handleSaveVehicleNumber}
                        updatingId={updatingId}
                      />
                    ))}

                    {violations.length > 25 && !showSecondBatch && (
                      <tr ref={batchRef}>
                        <td colSpan={9} className="py-8 text-center bg-slate-50/30">
                          <div className="flex items-center justify-center gap-2 text-slate-400 text-[11px] font-bold uppercase tracking-widest">
                            <AiOutlineLoading3Quarters className="w-4 h-4 animate-spin text-blue-600" />
                            Loading more records...
                          </div>
                        </td>
                      </tr>
                    )}

                    {showSecondBatch && violations.slice(25, 50).map((v) => (
                      <ViolationRow
                        key={v.id}
                        violation={v}
                        language={language}
                        t={t}
                        onSelect={setSelectedViolation}
                        onAccept={(id) => handleUpdateStatus(id, 'accepted')}
                        onDeclineWithReason={(id, reason) => handleUpdateStatus(id, 'declined', reason)}
                        onSaveVehicleNumber={handleSaveVehicleNumber}
                        updatingId={updatingId}
                      />
                    ))}
                  </>
                )}
              </tbody>
            </table>

            {!isLoadingData && violations.length === 0 && (
              <div className="py-24 text-center flex flex-col items-center gap-3">
                <svg className="w-10 h-10 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-xs text-slate-400 uppercase tracking-widest">{t.noRecords}</p>
              </div>
            )}
          </div>
        </main>

        {/* DETAIL MODAL */}
        {selectedViolation && (
          <div
            className="fixed inset-0 flex items-center justify-center bg-slate-900/60 backdrop-blur-md z-50 p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setSelectedViolation(null); }}
          >
            <div className="bg-white border border-blue-100 w-full max-w-4xl max-h-[90vh] shadow-2xl flex flex-col animate-in fade-in zoom-in duration-200 overflow-hidden">

              <div className="px-8 py-6 border-b border-blue-50 flex justify-between items-center bg-slate-50/50 shrink-0">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-[0.2em]">{t.modal.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[11px] font-mono text-slate-400">{selectedViolation.id}</span>
                    <button onClick={() => copyToClipboard(selectedViolation.id)} className="p-1 hover:bg-blue-100 rounded transition-colors" title={t.modal.copyId}>
                      <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
                <button onClick={() => setSelectedViolation(null)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-200/50 text-slate-400 hover:text-slate-600 transition-all">
                  <span className="text-2xl font-light">×</span>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  <div className="space-y-8">
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.modal.images.complete}</h4>
                      {loadingImages ? (
                        <div className="w-full h-48 bg-linear-to-r from-slate-100 via-slate-200 to-slate-100 animate-[shimmer_1.4s_infinite] border border-blue-50" />
                      ) : toImageSrc(modalImages?.complete_image) ? (
                        <div className="border border-blue-50 overflow-hidden group">
                          <LazyImage src={toImageSrc(modalImages!.complete_image)!} alt="Violation Scene" style={{ width: '100%', height: 'auto' }} className="transition-transform duration-500 group-hover:scale-105" />
                        </div>
                      ) : (
                        <div className="w-full py-10 flex flex-col items-center justify-center gap-2 bg-slate-50 border border-dashed border-slate-200 text-[10px] text-slate-400 uppercase tracking-widest">
                          <svg className="w-6 h-6 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          No Image
                        </div>
                      )}
                    </div>
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.modal.images.plate}</h4>
                      {loadingImages ? (
                        <div className="w-full h-20 bg-linear-to-r from-slate-100 via-slate-200 to-slate-100 animate-[shimmer_1.4s_infinite] border border-blue-50" />
                      ) : toImageSrc(modalImages?.plate_image) ? (
                        <div className="border border-blue-50 overflow-hidden group">
                          <LazyImage src={toImageSrc(modalImages!.plate_image)!} alt="Plate Detail" style={{ width: '100%', height: 'auto' }} className="transition-transform duration-500 group-hover:scale-110" />
                        </div>
                      ) : (
                        <div className="w-full py-6 flex items-center justify-center gap-2 bg-slate-50 border border-dashed border-slate-200 text-[10px] text-slate-400 uppercase tracking-widest">No Plate Image</div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-10">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-8">
                      <div>
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{t.modal.trackId}</h4>
                        <p className="text-[13px] font-semibold text-slate-900 font-mono">{selectedViolation.track_id}</p>
                      </div>
                      <div>
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{t.modal.vehicleNumber}</h4>
                        <p className="text-[13px] font-bold text-blue-700 bg-blue-50/50 inline-block px-2 py-0.5 border border-blue-100 font-mono">
                          {selectedViolation.vehicle_number}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{t.modal.detectionTime}</h4>
                        <p className="text-[13px] font-semibold text-slate-700">
                          {selectedViolation.detected_at
                            ? new Date(selectedViolation.detected_at).toLocaleString(language === 'en' ? 'en-IN' : 'hi-IN', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })
                            : '—'}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{t.modal.location}</h4>
                        <p className="text-[13px] font-semibold text-slate-700 uppercase">{selectedViolation.location}</p>
                      </div>
                      <div>
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{t.modal.dateFolder}</h4>
                        <p className="text-[13px] font-semibold text-slate-700 font-mono break-all">{selectedViolation.date_folder}</p>
                      </div>
                      <div>
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{t.modal.violationType}</h4>
                        <span className="text-[12px] font-bold text-blue-600 uppercase tracking-wider">
                          {selectedViolation.helmet_status || (language === 'en' ? 'DETECTION' : 'पहचान')}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{t.modal.status}</h4>
                        <span className={`text-[12px] font-bold uppercase tracking-wider px-2 py-1 border ${selectedViolation.status === 'ACCEPTED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : selectedViolation.status === 'DECLINED' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
                          {selectedViolation.status === 'ACCEPTED' ? t.status.approved : selectedViolation.status === 'DECLINED' ? t.status.rejected : t.status.pending}
                        </span>
                      </div>
                      {selectedViolation.reason && (
                        <div className="col-span-2">
                          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{t.modal.reason}</h4>
                          <p className="text-[13px] font-semibold text-slate-600 italic bg-slate-50 p-4 border-l-2 border-slate-200">"{selectedViolation.reason}"</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-8 py-6 border-t border-blue-50 bg-slate-50/50 flex justify-end shrink-0">
                <button onClick={() => setSelectedViolation(null)} className="px-8 py-3 bg-white border border-slate-200 text-slate-600 text-[12px] font-bold uppercase tracking-widest hover:bg-slate-100 hover:border-slate-300 transition-all shadow-sm">
                  {t.modal.close}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}