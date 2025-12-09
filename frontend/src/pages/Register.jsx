import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { User, Mail, Lock, ArrowRight } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 1. Register the user
      const { data } = await api.post('/auth/register', formData);

      // 2. Save token (Auto-login)
      localStorage.setItem('user', JSON.stringify(data));
      
      // 3. Success Feedback
      toast.success(`Account created! Welcome, ${data.name || 'Friend'}.`);
      
      // 4. Redirect to Dashboard
      navigate('/dashboard');
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      {/* Glass Card */}
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-2xl shadow-2xl w-full max-w-md relative overflow-hidden">
        
        {/* Decorational Element */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/30 rounded-full blur-2xl"></div>

        <div className="text-center mb-8 relative z-10">
          <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
          <p className="text-blue-200 text-sm">Start building your family legacy today</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          
          {/* Name Input */}
          <div className="relative group">
            <User className="absolute left-3 top-3.5 text-blue-300 h-5 w-5 group-focus-within:text-white transition-colors" />
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleChange}
              className="w-full bg-slate-800/60 text-white pl-10 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none border border-slate-700 focus:border-transparent transition-all placeholder-slate-400"
              required
            />
          </div>

          {/* Email Input */}
          <div className="relative group">
            <Mail className="absolute left-3 top-3.5 text-blue-300 h-5 w-5 group-focus-within:text-white transition-colors" />
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleChange}
              className="w-full bg-slate-800/60 text-white pl-10 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none border border-slate-700 focus:border-transparent transition-all placeholder-slate-400"
              required
            />
          </div>

          {/* Password Input */}
          <div className="relative group">
            <Lock className="absolute left-3 top-3.5 text-blue-300 h-5 w-5 group-focus-within:text-white transition-colors" />
            <input
              type="password"
              name="password"
              placeholder="Choose a Password"
              value={formData.password}
              onChange={handleChange}
              className="w-full bg-slate-800/60 text-white pl-10 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none border border-slate-700 focus:border-transparent transition-all placeholder-slate-400"
              required
              minLength={6}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-3.5 rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-[0.98]"
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
        <div className="mt-8 text-center relative z-10">
          <p className="text-slate-400 text-sm">
            Already have an account?{' '}
            <Link 
              to="/" 
              className="text-blue-300 hover:text-white font-semibold transition-colors border-b border-transparent hover:border-blue-300 pb-0.5"
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