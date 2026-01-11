// components/auth/AuthWrapper.tsx
import Link from 'next/link';

interface AuthWrapperProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footerText: string;
  footerLink: string;
  footerLinkText: string;
}

export function AuthWrapper({
  title,
  subtitle,
  children,
  footerText,
  footerLink,
  footerLinkText,
}: AuthWrapperProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">{title}</h2>
          <p className="mt-2 text-sm text-gray-600">{subtitle}</p>
        </div>

        {children}

        <div className="text-center mt-4">
          <p className="text-sm text-gray-600">
            {footerText}{' '}
            <Link
              href={footerLink}
              className="font-medium text-indigo-600 hover:text-indigo-500 transition duration-150"
            >
              {footerLinkText}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}