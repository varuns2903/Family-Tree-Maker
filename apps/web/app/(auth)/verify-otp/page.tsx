'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AuthService } from '@/services/auth.service';
import { authStore } from '@/store/auth.store';

// Components
import { AuthWrapper } from '@/components/auth/AuthWrapper';
import { AuthButton } from '@/components/auth/AuthButton';

export default function VerifyOtpPage() {
  const router = useRouter();
  
  // CHANGED: State is now an array of 6 strings
  const [otp, setOtp] = useState<string[]>(new Array(6).fill(''));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // NEW: Refs to manage focus for each input
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const pending = authStore((state) => state.pendingRegistration);
  const isAuthenticated = authStore((state) => state.isAuthenticated);

  useEffect(() => {
    if (isAuthenticated) return;
    if (!pending) {
      router.replace('/register');
    }
  }, [pending, isAuthenticated, router]);

  // NEW: Focus the first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // Safety check
  if (!pending && !isAuthenticated) return null;

  // --- HANDLERS ---

  const handleChange = (index: number, value: string) => {
    // Ensure only numbers are entered
    if (isNaN(Number(value))) return;

    const newOtp = [...otp];
    // Allow only the last character entered (in case user types fast or inputs replace existing)
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);

    // Move to next input if value is entered
    if (value && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0 && inputRefs.current[index - 1]) {
        // If current is empty, move to previous and delete that one
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6); // Get max 6 chars
    
    // Check if pasted data is numeric
    if (!/^\d+$/.test(pastedData)) return;

    const digits = pastedData.split('');
    const newOtp = [...otp];

    // Fill the array
    digits.forEach((digit, index) => {
      if (index < 6) newOtp[index] = digit;
    });

    setOtp(newOtp);

    // Focus the box after the last pasted digit
    const nextFocusIndex = Math.min(digits.length, 5);
    if (inputRefs.current[nextFocusIndex]) {
      inputRefs.current[nextFocusIndex]?.focus();
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // CHANGED: Join array back to string
    const otpString = otp.join('');
    
    if (otpString.length !== 6) {
      setError('Please enter the full 6-digit code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await AuthService.verifyOtp({
        email: pending!.email,
        otp: otpString, // Send string
        name: pending!.name,
        password: pending!.password,
      });

      authStore.getState().setAuth(
        res.data.user,
        res.data.accessToken,
        res.data.refreshToken,
      );

      router.push('/tree');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthWrapper
      title="Check your email"
      subtitle={`We sent a verification code to ${pending?.email || ''}`}
      footerText="Wrong email address?"
      footerLink="/register"
      footerLinkText="Register again"
    >
      <form className="space-y-6" onSubmit={handleVerify}>
        
        {/* OTP INPUTS CONTAINER */}
        <div className="flex justify-center gap-2 sm:gap-4">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => { inputRefs.current[index] = el }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              className="w-10 h-10 sm:w-12 sm:h-12 text-center text-xl font-semibold border border-gray-300 rounded-lg focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-gray-800 bg-white"
            />
          ))}
        </div>

        {error && (
          <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-md border border-red-100">
            {error}
          </div>
        )}

        <AuthButton 
          type="submit" 
          isLoading={isLoading} 
          text="Verify Account" 
        />
      </form>
    </AuthWrapper>
  );
}