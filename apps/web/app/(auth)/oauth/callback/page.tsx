'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { authStore } from '@/store/auth.store';
import { useEffect, useRef } from 'react';
import { CgSpinner } from 'react-icons/cg';

export default function OAuthCallbackPage() {
  const params = useSearchParams();
  const router = useRouter();
  
  // Use a ref to ensure this only runs once to avoid double-processing
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    const accessToken = params.get('accessToken');
    const refreshToken = params.get('refreshToken');

    if (accessToken && refreshToken) {
      // 1. Success: Store tokens and redirect to app
      authStore.getState().setTokens(accessToken, refreshToken);
      router.push('/tree');
    } else {
      // 2. Failure: No tokens found, send back to login
      router.push('/login?error=oauth_failed');
    }
  }, [params, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg border border-gray-100 text-center">
        
        <div className="flex justify-center">
          <CgSpinner className="animate-spin h-12 w-12 text-indigo-600" />
        </div>

        <div>
          <h2 className="mt-4 text-2xl font-bold text-gray-900">
            Signing you in...
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Please wait while we verify your credentials and set up your session.
          </p>
        </div>

      </div>
    </div>
  );
}