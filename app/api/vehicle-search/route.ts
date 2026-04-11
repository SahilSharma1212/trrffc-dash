// app/api/vehicle-search/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// ── Supabase client for toll DB ─────────────────────────────────────────────
// Use a separate env variable set so this doesn't clash with the
// violations Supabase project (vknemthgkkbseucxgmyc.supabase.co)
const TOLL_SUPABASE_URL  = process.env.TOLL_SUPABASE_URL  ?? '';
const TOLL_SUPABASE_KEY  = process.env.TOLL_SUPABASE_KEY  ?? '';

const tollSupabase = createClient(
  TOLL_SUPABASE_URL,
  TOLL_SUPABASE_KEY,
  {
    db: { schema: 'Toll' }
  }
);


// ── Helpers ─────────────────────────────────────────────────────────────────
function cleanVehicleNo(value: string): string {
  return value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
}

async function queryToll(searchValue: string, exact: boolean, limit = 200) {
  let query = tollSupabase.from('toll_all').select('*').limit(limit);

  if (exact) {
    query = query.eq('Vehicle No', searchValue);
  } else {
    query = query.ilike('Vehicle No', `%${searchValue}`);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

async function performSearch(rawValue: string) {
  const value = cleanVehicleNo(rawValue);
  if (!value) return [];

  const last4 = value.length >= 4 ? value.slice(-4) : value;
  const last3 = value.length >= 3 ? value.slice(-3) : value;

  if (value.length >= 10) {
    // 1) Exact full match
    let rows = await queryToll(value, true);
    if (rows.length) return rows;

    // 2) Suffix last-4 fallback
    rows = await queryToll(last4, false);
    if (rows.length) return rows;

    // 3) Suffix last-3 fallback
    rows = await queryToll(last3, false);
    return rows;
  }

  // Short input — suffix partial search
  return queryToll(value, false);
}

// ── Route handler ────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim() ?? '';

  if (!q) {
    return NextResponse.json({ error: 'Query parameter q is required' }, { status: 400 });
  }

  if (!TOLL_SUPABASE_URL || !TOLL_SUPABASE_KEY) {
    return NextResponse.json(
      { error: 'Toll database not configured. Set TOLL_SUPABASE_URL and TOLL_SUPABASE_KEY.' },
      { status: 503 }
    );
  }

  try {
    const results = await performSearch(q);
    return NextResponse.json({ data: results, count: results.length });
  } catch (err: any) {
    console.error('[vehicle-search]', err);
    return NextResponse.json({ error: err.message ?? 'Internal server error' }, { status: 500 });
  }
}