import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { Mail, ArrowLeft, Loader2, Send, Moon, Sun, KeyRound } from 'lucide-react';
import { getInitialTheme, toggleTheme } from '../utils/theme';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(getInitialTheme);
  const navigate = useNavigate();

  // Apply Theme Effect
  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      toast.success("Reset link sent! Check your inbox.");
      // Optional: Navigate back or stay to let them read the toast
      setTimeout(() => navigate('/login'), 2000);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send link");
    } finally {
      setLoading(false);
    }
  };

  // Standardized Input Style (Matches Login/Register but with Blue focus ring)
  const inputClass = `w-full pl-10 pr-4 py-3 text-sm sm:text-base rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 transition-all 
    ${isDarkMode 
      ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500 [&:-webkit-autofill]:bg-slate-800 [&:-webkit-autofill]:text-white [&:-webkit-autofill]:shadow-[0_0_0px_1000px_#1e293b_inset] [&:-webkit-autofill]:-webkit-text-fill-color-white" 
      : "bg-white border-gray-200 text-slate-800 placeholder-slate-400"
    }`;

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 sm:px-6 py-4 transition-all duration-500 ease-in-out relative
      ${isDarkMode 
        ? "bg-slate-900 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-[#0f172a] to-[#1e1b4b] text-slate-100" 
        : "bg-stone-50 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-stone-50 via-white to-blue-50 text-slate-800"
      }`}>

      {/* Theme Toggle */}
      <button
        onClick={() => toggleTheme(isDarkMode, setIsDarkMode)}
        className={`absolute top-6 right-6 p-3 rounded-2xl shadow-sm border transition ${
          isDarkMode ? 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700' : 'bg-white border-gray-100 text-slate-700 hover:bg-gray-50'
        }`}
      >
        {isDarkMode ? <Moon size={20} className="text-blue-300" /> : <Sun size={20} className="text-amber-500" />}
      </button>

      <div className={`w-full max-w-md p-8 rounded-3xl shadow-2xl border backdrop-blur-xl transition-all relative overflow-hidden
        ${isDarkMode ? "bg-slate-900/60 border-slate-700" : "bg-white/70 border-white/50"}`}>
        
        {/* Decorational Blur (Blue for Reset Flow) */}
        <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl pointer-events-none 
          ${isDarkMode ? 'bg-blue-500/10' : 'bg-blue-400/20'}`}></div>

        {/* Back Button */}
        <button 
          onClick={() => navigate('/login')} 
          className={`mb-8 flex items-center gap-2 text-sm font-bold transition-colors relative z-10
            ${isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'}`}
        >
          <ArrowLeft size={18} /> Back to Login
        </button>
        
        <div className="text-center mb-8 relative z-10">
          <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-lg
            ${isDarkMode ? "bg-blue-900/30 text-blue-400 border border-blue-800" : "bg-blue-100 text-blue-600 border border-blue-200"}`}>
            <KeyRound size={32} />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">Reset Password</h2>
          <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Enter your email to receive a secure link
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
          <div className="relative group">
            <Mail className={`absolute left-3 top-3.5 h-5 w-5 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
            <input 
              type="email"
              placeholder="Enter your email" 
              className={inputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <button 
            disabled={loading} 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-[0.98]"
          >
            {loading ? <Loader2 className="animate-spin" /> : <>Send Link <Send size={18}/></>}
          </button>
        </form>

      </div>
    </div>
  );
};

export default ForgotPassword;