import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast'; 
import { Lock, Mail, Moon, Sun, TreePine, Eye, EyeOff } from 'lucide-react'; 
import { getInitialTheme, toggleTheme } from '../utils/theme';

// --- CUSTOM ICONS ---

const GoogleIcon = ({ className }) => (
  <svg 
    className={className} 
    viewBox="0 0 24 24" 
    width="24" 
    height="24" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const GithubIcon = ({ className }) => (
  <svg 
    className={className} 
    viewBox="0 0 24 24" 
    width="24" 
    height="24" 
    fill="currentColor" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.285 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
  </svg>
);

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(getInitialTheme);
  const navigate = useNavigate();

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
      const { data } = await api.post('/auth/login', formData);      
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data));
      toast.success(`Welcome back, ${data.name || data.email}!`);
      navigate('/dashboard', { replace: true });
    } catch (error) {
      const msg = error.response?.data?.message || 'Login failed';
      
      if (msg.includes('not verified')) {
        toast.error(
          <span>
            Account not verified. <br/> 
            <Link to="/register" className="underline font-bold">Click here to Register again</Link> 
            {" "} to get a new code.
          </span>,
          { duration: 6000 }
        );
      } else {
        toast.error(msg);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = (provider) => {
    window.location.href = `http://localhost:5000/api/auth/${provider}`; 
  };

  const inputClass = `w-full pl-10 pr-4 py-3 text-sm sm:text-base rounded-xl border outline-none focus:ring-2 focus:ring-green-500 transition-all 
    ${isDarkMode 
      ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500 [&:-webkit-autofill]:bg-slate-800 [&:-webkit-autofill]:text-white [&:-webkit-autofill]:shadow-[0_0_0px_1000px_#1e293b_inset] [&:-webkit-autofill]:-webkit-text-fill-color-white" 
      : "bg-white border-gray-200 text-slate-800 placeholder-slate-400"
    }`;

  return (
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
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Welcome Back</h1>
          <p className={`text-sm ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Sign in to manage your lineage
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          <div className="relative group">
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

          <div className="relative group">
            <Lock className={`absolute left-3 top-3.5 h-5 w-5 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
            <input 
              type={showPassword ? "text" : "password"} 
              name="password" 
              placeholder="Password" 
              onChange={handleChange} 
              className={`${inputClass} pr-12`} 
              required 
            />
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)} 
              className={`absolute right-3 top-3.5 hover:opacity-80 transition-opacity focus:outline-none 
                ${isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {/* Forgot Password Link */}
          <div className="text-right">
             <Link 
               to="/forgot-password" 
               className={`text-sm font-medium hover:underline transition-colors
                 ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
             >
                Forgot Password?
             </Link>
          </div>

          <button 
            type="submit" 
            disabled={isLoading} 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-[0.98]"
          >
            {isLoading ? <span className="animate-pulse">Signing in...</span> : "Sign In"}
          </button>
        </form>

        {/* Social Login Divider */}
        <div className="relative my-6 relative z-10">
            <div className="absolute inset-0 flex items-center">
                <div className={`w-full border-t ${isDarkMode ? 'border-slate-700' : 'border-gray-200'}`}></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
                <span className={`px-3 py-1 rounded-full font-bold ${isDarkMode ? 'bg-slate-900/80 text-slate-400' : 'bg-white/80 text-slate-500'}`}>
                  Or continue with
                </span>
            </div>
        </div>

        {/* Social Login Buttons */}
        <div className="grid grid-cols-2 gap-3 relative z-10">
            {/* GOOGLE LOGIN */}
            <button 
              onClick={() => handleSocialLogin('google')} 
              className={`flex items-center justify-center gap-2 py-3 rounded-xl border font-bold transition-all text-sm group
                ${isDarkMode 
                  ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-white hover:border-slate-600' 
                  : 'bg-white border-gray-200 hover:bg-gray-50 text-slate-700'}`}
            >
                <GoogleIcon className="w-5 h-5 group-hover:scale-110 transition-transform" /> 
                Google
            </button>

            {/* GITHUB LOGIN */}
            <button 
              onClick={() => handleSocialLogin('github')} 
              className={`flex items-center justify-center gap-2 py-3 rounded-xl border font-bold transition-all text-sm group
                ${isDarkMode 
                  ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-white hover:border-slate-600' 
                  : 'bg-white border-gray-200 hover:bg-gray-50 text-slate-700'}`}
            >
                <GithubIcon className="w-5 h-5 group-hover:scale-110 transition-transform" /> 
                GitHub
            </button>
        </div>

        {/* Footer Link */}
        <div className={`mt-8 text-center text-sm relative z-10 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          <p>
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-500 hover:text-blue-600 font-bold transition-colors">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;