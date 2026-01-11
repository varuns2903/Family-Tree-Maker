'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthService } from '@/services/auth.service';
import { authStore } from '@/store/auth.store';

// Icons
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineUser } from 'react-icons/hi';

// Components
import { AuthWrapper } from '@/components/auth/AuthWrapper';
import { AuthInput } from '@/components/auth/AuthInput';
import { AuthButton } from '@/components/auth/AuthButton';
import { AuthSocials } from '@/components/auth/AuthSocials';

export default function RegisterPage() {
  const router = useRouter();
  
  const [form, setForm] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    confirmPassword: '' 
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // 1. Client-side Validation
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      setIsLoading(false);
      return;
    }

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      setIsLoading(false);
      return;
    }

    try {
      // 2. API Call
      await AuthService.register({
        name: form.name,
        email: form.email,
        password: form.password,
        confirmPassword: form.confirmPassword,
      });

      // 3. Store temporary data for the OTP step
      authStore.getState().setPendingRegistration({
        name: form.name,
        email: form.email,
        password: form.password,
      });

      // 4. Navigate
      router.push('/verify-otp');
      
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthWrapper
      title="Create an account"
      subtitle="Start building your family tree today"
      footerText="Already have an account?"
      footerLink="/login"
      footerLinkText="Sign in"
    >
      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="space-y-4">
          
          {/* Name */}
          <AuthInput
            icon={HiOutlineUser}
            type="text"
            placeholder="Full Name"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          {/* Email */}
          <AuthInput
            icon={HiOutlineMail}
            type="email"
            placeholder="Email address"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />

          {/* Password */}
          <AuthInput
            icon={HiOutlineLockClosed}
            type="password"
            placeholder="Password"
            required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />

          {/* Confirm Password */}
          <AuthInput
            icon={HiOutlineLockClosed}
            type="password"
            placeholder="Confirm Password"
            required
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
          />
        </div>

        {/* Error Message Display */}
        {error && (
          <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-md border border-red-100">
            {error}
          </div>
        )}

        <AuthButton 
          type="submit" 
          isLoading={isLoading} 
          text="Create Account" 
        />
      </form>

      {/* Social Login (Optional - remove if you only want social on login) */}
      <AuthSocials />
    </AuthWrapper>
  );
}