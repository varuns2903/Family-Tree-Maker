// components/auth/AuthSocials.tsx
import { FaGithub, FaGoogle } from 'react-icons/fa';

export function AuthSocials() {
  return (
    <div className="mt-6">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or continue with</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-6">
        <a
          href={`${process.env.NEXT_PUBLIC_API_URL}/auth/google`}
          className="flex items-center justify-center w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition duration-200"
        >
          <FaGoogle className="h-5 w-5 text-red-500 mr-2" />
          <span className="sr-only">Google</span>
          Google
        </a>

        <a
          href={`${process.env.NEXT_PUBLIC_API_URL}/auth/github`}
          className="flex items-center justify-center w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition duration-200"
        >
          <FaGithub className="h-5 w-5 text-gray-900 mr-2" />
          <span className="sr-only">GitHub</span>
          GitHub
        </a>
      </div>
    </div>
  );
}