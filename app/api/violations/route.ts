// app/api/violations/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/auth';

// Shape returned by the Postgres function (each row is a plain JSON object)
interface ViolationRow {
  id: unknown;
  track_id: string | null;
  vehicle_number: string | null;
  challan: boolean | null;
  detected_at: string | null;
  location: string | null;
  helmet_status: string | null;
  date_folder: string | null;
  status: string | null;
  reason: string | null;
  created_at: string | null;
  complete_image_url: string | null;
  plate_image_url: string | null;
  prior_challan_count: number;
  same_day_count: number;
  total_count: number; // window-function column — stripped before response
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page        = parseInt(searchParams.get('page')        || '1');
    const limit       = parseInt(searchParams.get('limit')       || '50');
    const filterType  = searchParams.get('filterType')           || 'vehicle_number';
    const filterValue = searchParams.get('filterValue')          || '';
    const offset      = (page - 1) * limit;

    // ── Main paginated query with repeat-offender counts ─────────────────────
    // The function returns SETOF json so each element in `data` is already a
    // plain JS object — no extra parsing needed.
    const { data, error } = await supabase.rpc(
      'get_violations_with_repeat_info',
      {
        p_page_size:    limit,
        p_offset:       offset,
        p_filter_type:  filterType  || null,
        p_filter_value: filterValue || null,
      }
    );

    if (error) {
      console.error('[/api/violations] rpc error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const rows = (data ?? []) as ViolationRow[];

    // total_count is the same on every row (window function) — read once, strip
    const count: number = rows[0]?.total_count ?? 0;
    const violations = rows.map(({ total_count: _drop, ...rest }) => rest);

    if (violations.length > 0) {
      console.log('DEBUG: First violation record:', JSON.stringify(violations[0], null, 2));
    }

    // ── Global stats ─────────────────────────────────────────────────────────
    const [
      { count: pendingCount },
      { count: acceptedCount },
      { count: declinedCount },
    ] = await Promise.all([
      supabase
        .from('helmet_violations')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'PENDING'),
      supabase
        .from('helmet_violations')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'ACCEPTED'),
      supabase
        .from('helmet_violations')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'DECLINED'),
    ]);

    return NextResponse.json({
      data:  violations,
      count: count,
      page,
      limit,
      stats: {
        pending:  pendingCount  ?? 0,
        accepted: acceptedCount ?? 0,
        declined: declinedCount ?? 0,
      },
    });
  } catch (error) {
    console.error('[/api/violations]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}