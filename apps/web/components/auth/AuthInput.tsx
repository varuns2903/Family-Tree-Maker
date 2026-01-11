'use client';

import { useState } from 'react';
import { IconType } from 'react-icons';
// Import the Eye icons
import { HiEye, HiEyeOff } from 'react-icons/hi';

interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon: IconType;
}

export function AuthInput({ icon: Icon, type = 'text', className = '', ...props }: AuthInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  // Check if the original intent was a password field
  const isPassword = type === 'password';

  // Toggle between 'text' and 'password' based on state
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="relative">
      {/* Left Icon (Mail/Lock) */}
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Icon className="h-5 w-5 text-gray-400" />
      </div>

      <input
        {...props}
        type={inputType}
        // Add right padding (pr-10) if it's a password field so text doesn't hit the eye icon
        className={`appearance-none relative block w-full px-3 py-3 pl-10 ${
          isPassword ? 'pr-10' : ''
        } border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm transition duration-200 ${className}`}
      />

      {/* The Toggle Button - Only shows for password fields */}
      {isPassword && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none cursor-pointer z-10"
        >
          {showPassword ? (
            <HiEyeOff className="h-5 w-5" aria-hidden="true" />
          ) : (
            <HiEye className="h-5 w-5" aria-hidden="true" />
          )}
        </button>
      )}
    </div>
  );
}