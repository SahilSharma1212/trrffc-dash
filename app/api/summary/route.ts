// app/api/summary/route.ts
// Returns date-wise counts: total detections, challans issued, accepted, declined
// Uses the same auth + supabase pattern as the rest of the dashboard API
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Calls the `get_daily_summary` Postgres function (see migration SQL below).
    // Returns rows: { day, total, challans, accepted, declined }
    const { data, error } = await supabase.rpc('get_daily_summary');

    if (error) {
      console.error('[/api/summary]', error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const summary = (data ?? []).map((r: {
      day: string;
      total: number | string;
      challans: number | string;
      accepted: number | string;
      declined: number | string;
    }) => ({
      day:      r.day,
      total:    Number(r.total),
      challans: Number(r.challans),
      accepted: Number(r.accepted),
      declined: Number(r.declined),
    }));

    return NextResponse.json({ summary });
  } catch (err: unknown) {
    console.error('[/api/summary]', err);
    return NextResponse.json({ error: 'Failed to load summary' }, { status: 500 });
  }
}