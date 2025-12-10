import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { getInitialTheme } from "../utils/theme";

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
        toast.success("Joined tree!");
        navigate(`/tree/${data.treeId}`);
      } catch (error) {
        toast.error(error.response?.data?.message || "Join failed");
        navigate('/dashboard');
      }
    };
    join();
  }, [token, navigate]);

  return (
    <div
      className={`h-screen flex items-center justify-center transition-colors duration-300
        ${isDarkMode ? "bg-[#0e0e0e] text-gray-100" : "bg-gray-100 text-gray-800"}
      `}
    >
      <div className="text-xl font-bold animate-pulse">
        Joining Tree...
      </div>
    </div>
  );
};

export default JoinTree;
