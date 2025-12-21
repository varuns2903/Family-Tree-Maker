// frontend/src/pages/OAuthSuccess.jsx
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const OAuthSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    const userStr = searchParams.get('user');

    if (token && userStr) {
      try {
        const user = JSON.parse(decodeURIComponent(userStr));
        
        // Save to LocalStorage
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify({ ...user, token }));
        
        toast.success(`Welcome back, ${user.name}!`);
        navigate('/dashboard');
      } catch (error) {
        console.error("OAuth Parse Error", error);
        toast.error("Login failed. Please try again.");
        navigate('/login');
      }
    } else {
      navigate('/login');
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
      <div className="flex flex-col items-center gap-4">
        <Loader2 size={48} className="animate-spin text-blue-500" />
        <h2 className="text-xl font-bold">Completing secure login...</h2>
      </div>
    </div>
  );
};

export default OAuthSuccess;