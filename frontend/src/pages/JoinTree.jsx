import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { getInitialTheme } from "../utils/theme";
import { Loader2, TreePine } from 'lucide-react';

const JoinTree = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  // THEME STATE
  const [isDarkMode, setIsDarkMode] = useState(getInitialTheme);

  useEffect(() => {
    // Apply theme to <html>
    if (isDarkMode) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [isDarkMode]);

  useEffect(() => {
    const join = async () => {
      try {
        const { data } = await api.post(`/trees/join/${token}`);
        toast.success("Successfully joined the family tree!");
        
        // Small delay for better UX (so they see the success state briefly)
        setTimeout(() => {
            navigate(`/tree/${data.treeId}`);
        }, 1500);
        
      } catch (error) {
        toast.error(error.response?.data?.message || "Invalid or expired link");
        navigate('/dashboard');
      }
    };

    if(token) join();
  }, [token, navigate]);

  return (
    <div className={`min-h-screen flex items-center justify-center px-4 transition-all duration-500 ease-in-out relative overflow-hidden
      ${isDarkMode 
        ? "bg-slate-900 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-[#0f172a] to-[#062c26] text-slate-100" 
        : "bg-stone-50 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-stone-50 via-white to-green-50 text-slate-800"
      }`}>
      
      {/* Container Card */}
      <div className={`relative p-8 sm:p-12 rounded-3xl shadow-2xl max-w-sm w-full text-center border backdrop-blur-xl transition-all duration-300
        ${isDarkMode 
          ? "bg-slate-900/60 border-slate-700 shadow-slate-900/50" 
          : "bg-white/70 border-white/50 shadow-xl shadow-green-900/5"}`}>
        
        {/* Decorative Blur (Behind content, matching Login/Register) */}
        <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl pointer-events-none 
          ${isDarkMode ? 'bg-green-500/10' : 'bg-green-400/20'}`}></div>

        {/* Icon Animation */}
        <div className={`relative z-10 mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-lg animate-pulse ring-4 ring-offset-2 transition-all
          ${isDarkMode 
            ? "bg-green-900/30 text-green-400 border border-green-800 ring-offset-slate-900 ring-green-900/20" 
            : "bg-green-100 text-green-600 border border-green-200 ring-offset-white ring-green-100"}`}>
          <TreePine size={40} />
        </div>

        <h2 className="relative z-10 text-2xl font-bold mb-3 tracking-tight">Joining Tree...</h2>
        
        <p className={`relative z-10 text-sm mb-8 font-medium leading-relaxed ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
          Verifying your invitation token. <br/> Please wait a moment while we set things up.
        </p>

        <div className="relative z-10 flex justify-center">
          <Loader2 className={`animate-spin ${isDarkMode ? "text-green-400" : "text-green-600"}`} size={36} />
        </div>

      </div>
    </div>
  );
};

export default JoinTree;