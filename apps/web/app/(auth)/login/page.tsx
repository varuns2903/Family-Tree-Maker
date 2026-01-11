'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthService } from '@/services/auth.service';
import { authStore } from '@/store/auth.store';

// Icons
import { HiOutlineMail, HiOutlineLockClosed } from 'react-icons/hi';

// Components
import { AuthWrapper } from '@/components/auth/AuthWrapper';
import { AuthInput } from '@/components/auth/AuthInput';
import { AuthButton } from '@/components/auth/AuthButton';
import { AuthSocials } from '@/components/auth/AuthSocials';

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await AuthService.login(form);
      authStore.getState().setAuth(res.data.user, res.data.accessToken, res.data.refreshToken);
      router.push('/tree');
    } catch (err) {
      setError('Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthWrapper
      title="Welcome back"
      subtitle="Sign in to access your family tree"
      footerText="Don't have an account?"
      footerLink="/register"
      footerLinkText="Sign up now"
    >
      <form className="space-y-6" onSubmit={handleLogin}>
        <div className="space-y-4">
          <AuthInput
            icon={HiOutlineMail}
            type="email"
            placeholder="Email address"
            required
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <AuthInput
            icon={HiOutlineLockClosed}
            type="password"
            placeholder="Password"
            required
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </div>

        {error && (
          <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-md border border-red-100">
            {error}
          </div>
        )}

        <AuthButton type="submit" isLoading={isLoading} text="Sign in" />
      </form>

      <AuthSocials />
    </AuthWrapper>
  );
}