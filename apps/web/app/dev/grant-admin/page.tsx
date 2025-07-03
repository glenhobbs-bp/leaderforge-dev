/**
 * File: apps/web/app/dev/grant-admin/page.tsx
 * Purpose: Development page to grant admin access
 * Owner: Engineering Team
 * Tags: #dev #admin #ui
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function GrantAdminPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const router = useRouter();

  const grantAdminAccess = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/dev/grant-admin-access', {
        method: 'POST',
      });

      const data = await response.json();
      setResult(data);

      if (data.success) {
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      }
    } catch (error) {
      setResult({ error: 'Failed to call endpoint' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-4">Grant Admin Access</h1>

        <button
          onClick={grantAdminAccess}
          disabled={loading}
          className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Grant Admin Access to Current User'}
        </button>

        {result && (
          <div className={`mt-4 p-4 rounded ${result.error ? 'bg-red-50' : 'bg-green-50'}`}>
            <pre className="text-sm whitespace-pre-wrap">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}