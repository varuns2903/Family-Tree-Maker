// frontend/src/pages/ResetPassword.jsx
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Lock, Loader2, CheckCircle } from 'lucide-react';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { token } = useParams();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(password !== confirmPassword) return toast.error("Passwords do not match");
    if(password.length < 6) return toast.error("Password too short");

    setLoading(true);
    try {
      await api.put(`/auth/reset-password/${token}`, { password });
      toast.success("Password reset successful! Please login.");
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || "Reset failed or token expired");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-900 transition-colors">
      <div className="w-full max-w-md p-8 rounded-3xl shadow-xl bg-white dark:bg-slate-800 dark:text-white border dark:border-slate-700">
        <h2 className="text-2xl font-bold mb-2">New Password</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Create a new secure password.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-xl border bg-gray-50 dark:bg-slate-900 dark:border-slate-700">
            <Lock size={20} className="text-slate-400" />
            <input 
              type="password"
              placeholder="New Password" 
              className="bg-transparent outline-none w-full"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl border bg-gray-50 dark:bg-slate-900 dark:border-slate-700">
            <Lock size={20} className="text-slate-400" />
            <input 
              type="password"
              placeholder="Confirm Password" 
              className="bg-transparent outline-none w-full"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button disabled={loading} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition flex justify-center gap-2">
            {loading ? <Loader2 className="animate-spin" /> : <>Reset Password <CheckCircle size={18}/></>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;