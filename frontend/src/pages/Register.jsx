import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { User, Mail, Lock, ArrowRight, Moon, Sun, TreePine, Eye, EyeOff } from 'lucide-react';
import { getInitialTheme, toggleTheme } from '../utils/theme';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(getInitialTheme);
  const navigate = useNavigate();

  // Apply theme to html tag
  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data } = await api.post('/auth/register', formData);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data));
      toast.success(`Account created! Welcome, ${data.name || 'Friend'}.`);
      navigate('/dashboard');
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ FIXED: Added Autofill styles + Text colors for Dark Mode consistency
  const inputClass = `w-full pl-10 pr-4 py-3 text-sm sm:text-base rounded-xl border outline-none focus:ring-2 focus:ring-green-500 transition-all 
    ${isDarkMode 
      ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500 [&:-webkit-autofill]:bg-slate-800 [&:-webkit-autofill]:text-white [&:-webkit-autofill]:shadow-[0_0_0px_1000px_#1e293b_inset] [&:-webkit-autofill]:-webkit-text-fill-color-white" 
      : "bg-white border-gray-200 text-slate-800 placeholder-slate-400"
    }`;

  return (
    // ✅ FIXED: Added 'bg-slate-900' fallback
    <div className={`min-h-screen flex items-center justify-center px-4 sm:px-6 py-4 transition-all duration-500 ease-in-out relative
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

      <div className={`p-6 sm:p-10 rounded-3xl shadow-2xl w-full max-w-sm sm:max-w-md border backdrop-blur-xl transition-all relative overflow-hidden
        ${isDarkMode ? "bg-slate-900/60 border-slate-700" : "bg-white/70 border-white/50"}`}>
        
        {/* Decorational Blur */}
        <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl pointer-events-none 
          ${isDarkMode ? 'bg-green-500/10' : 'bg-green-400/20'}`}></div>

        <div className="text-center mb-8 relative z-10">
          <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-lg
            ${isDarkMode ? "bg-blue-900/30 text-blue-400 border border-blue-800" : "bg-blue-100 text-blue-600 border border-blue-200"}`}>
            <TreePine size={32} />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Create Account</h1>
          <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Start building your family legacy</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 relative z-10">
          
          {/* Name Input */}
          <div className="relative group">
            <User className={`absolute left-3 top-3.5 h-5 w-5 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleChange}
              className={inputClass}
              required
            />
          </div>

          {/* Email Input */}
          <div className="relative group">
            <Mail className={`absolute left-3 top-3.5 h-5 w-5 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleChange}
              className={inputClass}
              required
            />
          </div>

          {/* Password Input */}
          <div className="relative group">
            <Lock className={`absolute left-3 top-3.5 h-5 w-5 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
            <input
              type={showPassword ? "text" : "password"} // ✅ Toggles type
              name="password"
              placeholder="Choose a Password"
              value={formData.password}
              onChange={handleChange}
              className={`${inputClass} pr-12`} // ✅ Added extra right padding so text doesn't hit icon
              required
              minLength={6}
            />
            
            {/* ✅ Toggle Button */}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={`absolute right-3 top-3.5 hover:opacity-80 transition-opacity focus:outline-none
                ${isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-[0.98] text-sm sm:text-base"
          >
            {isLoading ? (
              <span className="animate-pulse">Creating Account...</span>
            ) : (
              <>
                Get Started <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Footer Link */}
        <div className={`mt-8 text-center text-sm relative z-10 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          <p>
            Already have an account?{' '}
            <Link 
              to="/" 
              className="text-blue-500 hover:text-blue-600 font-bold transition-colors"
            >
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;