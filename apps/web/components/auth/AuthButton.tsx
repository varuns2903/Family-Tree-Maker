// components/auth/AuthButton.tsx
import { CgSpinner } from 'react-icons/cg';

interface AuthButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading: boolean;
  text: string;
}

export function AuthButton({ isLoading, text, ...props }: AuthButtonProps) {
  return (
    <button
      disabled={isLoading}
      className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed transition duration-200 shadow-md hover:shadow-lg"
      {...props}
    >
      {isLoading ? <CgSpinner className="animate-spin h-5 w-5" /> : text}
    </button>
  );
}