'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import axios from 'axios';

export default function SignInPage() {
  const [id, setId] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !password) {
      toast.error('Please enter both ID and password');
      return;
    }
    setLoading(true);

    try {
      const response = await axios.post('/api/auth/login', { id, password });

      if (response.data.success) {
        toast.success('Signed in successfully');
        router.push('/dashboard');
        router.refresh();
      } else {
        toast.error(response.data.message || 'Invalid credentials');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Something went wrong. Please try again.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='bg-slate-50 min-h-screen w-full flex items-center justify-center p-4'>
      <div className='bg-white p-8 shadow-xl w-full max-w-[400px] border border-blue-100'>
        <div className="flex flex-col items-center mb-8">
          <h1 className='text-xl text-blue-600 font-bold tracking-[0.2em] uppercase'>Traffic Dash</h1>
          <p className="text-[13px] text-slate-400 uppercase tracking-widest mt-1">Control Console Access</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className='block text-[13px] font-bold text-slate-400 uppercase tracking-widest mb-2'>Officer ID</label>
            <input
              type='text'
              placeholder='0000000000'
              value={id}
              onChange={(e) => setId(e.target.value)}
              className='w-full px-4 py-3 border border-slate-200 text-sm focus:outline-none focus:border-blue-600 transition-colors'
            />
          </div>
          <div>
            <label className='block text-[13px] font-bold text-slate-400 uppercase tracking-widest mb-2'>Access Key</label>
            <input
              type='password'
              placeholder='********'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className='w-full px-4 py-3 border border-slate-200 text-sm focus:outline-none focus:border-blue-600 transition-colors'
            />
          </div>
          <button
            type='submit'
            disabled={loading}
            className='w-full bg-blue-600 text-white py-3 text-xs font-bold uppercase tracking-[0.2em] hover:bg-blue-700 disabled:bg-slate-300 transition-all shadow-lg hover:shadow-blue-200'
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
