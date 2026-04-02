import axios from 'axios';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import DashboardContent from './DashboardContent';
import { Violation } from '@/types/violation';
import { cookies } from 'next/headers';

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect('/signin');
  }

  // In a real production app, we would use a shared utility or environment variable for the base URL.
  // For this local environment, we'll use a fallback or the standard dev port.
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  let initialData = { 
    data: [] as Violation[], 
    count: 0, 
    page: 1, 
    limit: 40,
    stats: { pending: 0, accepted: 0, declined: 0 }
  };
  
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get('auth_token')?.value;

    const response = await axios.get(`${baseUrl}/api/violations?page=1&limit=40`, {
      headers: {
        Cookie: `auth_token=${cookie}`
      }
    });
    
    initialData = response.data;
  } catch (error) {
    console.error('Axios fetch error in Server Component:', error);
  }

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