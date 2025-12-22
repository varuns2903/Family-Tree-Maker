import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Lock, Loader2, CheckCircle, Eye, EyeOff } from 'lucide-react';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // ✅ Visibility States
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
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
          
          {/* New Password Field */}
          <div className="flex items-center gap-3 p-3 rounded-xl border bg-gray-50 dark:bg-slate-900 dark:border-slate-700 focus-within:ring-2 focus-within:ring-green-500 transition-all">
            <Lock size={20} className="text-slate-400" />
            <input 
              type={showPassword ? "text" : "password"}
              placeholder="New Password" 
              className="bg-transparent outline-none flex-1 dark:text-white"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button 
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {/* Confirm Password Field */}
          <div className="flex items-center gap-3 p-3 rounded-xl border bg-gray-50 dark:bg-slate-900 dark:border-slate-700 focus-within:ring-2 focus-within:ring-green-500 transition-all">
            <Lock size={20} className="text-slate-400" />
            <input 
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm Password" 
              className="bg-transparent outline-none flex-1 dark:text-white"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <button 
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
            >
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <button disabled={loading} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition flex justify-center items-center gap-2 shadow-lg shadow-green-500/20 active:scale-95">
            {loading ? <Loader2 className="animate-spin" /> : <>Reset Password <CheckCircle size={18}/></>}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;