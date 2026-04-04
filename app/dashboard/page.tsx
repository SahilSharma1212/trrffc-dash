import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import DashboardContent from './DashboardContent';
import { Violation } from '@/types/violation';

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect('/signin');
  }

  // Shifted data fetching to client-side for faster redirection
  const initialData = {
    data: [] as Violation[],
    count: 0,
    page: 1,
    limit: 50,
    stats: { pending: 0, accepted: 0, declined: 0 }
  };

  return (
    <DashboardContent
      initialViolations={initialData.data}
      initialTotal={initialData.count}
      initialPage={initialData.page}
      initialLimit={initialData.limit}
      initialStats={initialData.stats}
    />
  );
}