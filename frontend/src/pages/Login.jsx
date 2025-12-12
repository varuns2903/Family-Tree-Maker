import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast'; 
import { Lock, Mail, Moon, Sun, TreePine } from 'lucide-react'; 
import { getInitialTheme, toggleTheme } from '../utils/theme';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isDarkMode, setIsDarkMode] = useState(getInitialTheme); // Theme state
  const navigate = useNavigate();

  // Apply theme class to html tag whenever isDarkMode changes
  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.post('/auth/login', formData);      
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data));
      toast.success(`Welcome back, ${data.email}!`);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    }
  };

  // ✅ FIXED: Added Autofill styles to prevent white background on browser autocomplete
  // ✅ FIXED: Added specific text colors
  const inputClass = `w-full pl-10 pr-4 py-3 text-sm sm:text-base rounded-xl border outline-none focus:ring-2 focus:ring-green-500 transition-all 
    ${isDarkMode 
      ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500 [&:-webkit-autofill]:bg-slate-800 [&:-webkit-autofill]:text-white [&:-webkit-autofill]:shadow-[0_0_0px_1000px_#1e293b_inset] [&:-webkit-autofill]:-webkit-text-fill-color-white" 
      : "bg-white border-gray-200 text-slate-800 placeholder-slate-400"
    }`;

  return (
    // ✅ FIXED: Added 'bg-slate-900' fallback to prevent white flash
    <div className={`min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 transition-all duration-500 ease-in-out relative
      ${isDarkMode 
        ? "bg-slate-900 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-[#0f172a] to-[#062c26] text-slate-100" 
        : "bg-stone-50 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-stone-50 via-white to-green-50 text-slate-800"
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

      {/* Card Container */}
      <div className={`p-6 sm:p-10 rounded-3xl shadow-2xl w-full max-w-sm sm:max-w-md border backdrop-blur-xl transition-all
        ${isDarkMode ? "bg-slate-900/60 border-slate-700" : "bg-white/70 border-white/50"}`}>
        
        <div className="text-center mb-8">
          <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-lg
            ${isDarkMode ? "bg-green-900/30 text-green-400 border border-green-800" : "bg-green-100 text-green-600 border border-green-200"}`}>
            <TreePine size={32} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Welcome Back</h1>
          <p className={`text-sm sm:text-base ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Sign in to manage your lineage
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
          {/* Email Input */}
          <div className="relative">
            <Mail className={`absolute left-3 top-3.5 h-5 w-5 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              onChange={handleChange}
              className={inputClass}
              required
            />
          </div>

          {/* Password Input */}
          <div className="relative">
            <Lock className={`absolute left-3 top-3.5 h-5 w-5 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
            <input
              type="password"
              name="password"
              placeholder="Password"
              onChange={handleChange}
              className={inputClass}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-xl transition-all duration-300 shadow-lg shadow-green-500/30 text-sm sm:text-base active:scale-95"
          >
            Sign In
          </button>
        </form>

        <div className={`mt-8 text-center text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          Don't have an account?{' '}
          <Link to="/register" className="text-green-500 hover:text-green-600 font-bold transition-colors">
            Create one
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;