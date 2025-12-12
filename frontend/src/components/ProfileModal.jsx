import { useState } from 'react';
import { X, User, Mail, Lock, Save, LogOut, ShieldCheck, Eye, EyeOff } from 'lucide-react'; // ✅ Added Eye, EyeOff
import api from '../api/axios';
import toast from 'react-hot-toast';

const ProfileModal = ({ user, onClose, onLogout, onUpdateUser }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);

  // ✅ Toggle State for Passwords
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);

  // Profile Form State
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });

  // Password Form State
  const [passData, setPassData] = useState({
    currentPassword: '',
    newPassword: '',
  });

  const isDarkMode = document.documentElement.classList.contains('dark');
  
  const inputClass = `w-full p-3 pl-10 text-sm sm:text-base rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
    isDarkMode 
      ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500 [&:-webkit-autofill]:bg-slate-800 [&:-webkit-autofill]:text-white [&:-webkit-autofill]:shadow-[0_0_0px_1000px_#1e293b_inset] [&:-webkit-autofill]:-webkit-text-fill-color-white" 
      : "bg-white border-gray-200 text-gray-900 placeholder-gray-400"
  }`;

  const labelClass = `text-xs font-bold uppercase opacity-60 mb-1.5 block ml-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`;

  // --- HANDLERS ---

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { data } = await api.put('/auth/profile', profileData);
      const updatedUser = { ...user, ...data };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      onUpdateUser(updatedUser);
      toast.success("Profile updated successfully!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (passData.newPassword.length < 6) {
      return toast.error("New password must be at least 6 characters");
    }
    
    setIsLoading(true);
    try {
      await api.put('/auth/password', passData);
      toast.success("Password changed successfully!");
      setPassData({ currentPassword: '', newPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] backdrop-blur-sm p-4" 
      onClick={onClose}
    >
      <div 
        className={`w-[95%] sm:w-full max-w-md rounded-3xl shadow-2xl overflow-hidden transform transition-all scale-100 flex flex-col max-h-[85vh] sm:max-h-[90vh]
          ${isDarkMode ? 'bg-slate-900 text-slate-100 border border-slate-800' : 'bg-white text-slate-800'}`}
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className={`p-5 sm:p-6 border-b flex-shrink-0 ${isDarkMode ? 'border-slate-800' : 'border-gray-100'} flex justify-between items-center`}>
          <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
            <UserCogIcon isDark={isDarkMode} /> Account Settings
          </h2>
          <button onClick={onClose} className={`p-2 rounded-full transition ${isDarkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-gray-100 text-gray-500'}`}>
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className={`flex p-2 gap-2 border-b flex-shrink-0 ${isDarkMode ? 'border-slate-800' : 'border-gray-100'}`}>
          <button 
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition ${activeTab === 'profile' 
              ? (isDarkMode ? 'bg-slate-800 text-white' : 'bg-blue-50 text-blue-600') 
              : 'opacity-60 hover:opacity-100'}`}
          >
            Profile Details
          </button>
          <button 
            onClick={() => setActiveTab('security')}
            className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition ${activeTab === 'security' 
              ? (isDarkMode ? 'bg-slate-800 text-white' : 'bg-blue-50 text-blue-600') 
              : 'opacity-60 hover:opacity-100'}`}
          >
            Security
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar flex-1">
          
          {activeTab === 'profile' ? (
            <form onSubmit={handleProfileUpdate} className="space-y-4 sm:space-y-5">
              
              <div className="flex flex-col items-center mb-4 sm:mb-6">
                <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-2xl sm:text-3xl font-bold mb-3 shadow-lg
                  ${isDarkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-600'}`}>
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <p className="text-[10px] sm:text-xs opacity-60 uppercase tracking-widest font-bold">Personal Account</p>
              </div>

              <div>
                <label className={labelClass}>Full Name</label>
                <div className="relative">
                  <User className={`absolute left-3 top-3.5 w-5 h-5 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                  <input 
                    value={profileData.name}
                    onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                    className={inputClass}
                    placeholder="Your Name"
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Email Address</label>
                <div className="relative">
                  <Mail className={`absolute left-3 top-3.5 w-5 h-5 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                  <input 
                    value={profileData.email}
                    onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                    className={inputClass}
                    placeholder="email@example.com"
                  />
                </div>
              </div>

              <button 
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 mt-4 transition shadow-lg shadow-blue-500/20 text-sm sm:text-base active:scale-95"
              >
                {isLoading ? 'Saving...' : <><Save size={18} /> Save Profile</>}
              </button>
            </form>
          ) : (
            <form onSubmit={handlePasswordUpdate} className="space-y-4 sm:space-y-5">
              <div className={`p-3 sm:p-4 rounded-xl mb-4 text-xs sm:text-sm flex items-start gap-3
                ${isDarkMode ? 'bg-amber-900/20 text-amber-200 border border-amber-800' : 'bg-amber-50 text-amber-700 border border-amber-100'}`}>
                <ShieldCheck className="shrink-0" size={18} />
                <p>For your security, you must enter your current password to make changes.</p>
              </div>

              {/* Current Password Field */}
              <div>
                <label className={labelClass}>Current Password</label>
                <div className="relative">
                  <Lock className={`absolute left-3 top-3.5 w-5 h-5 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                  <input 
                    type={showCurrentPass ? "text" : "password"}
                    value={passData.currentPassword}
                    onChange={(e) => setPassData({...passData, currentPassword: e.target.value})}
                    className={`${inputClass} pr-10`} // Extra padding for eye icon
                    placeholder="••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className={`absolute right-3 top-3.5 transition hover:opacity-80 focus:outline-none ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}
                  >
                    {showCurrentPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* New Password Field */}
              <div>
                <label className={labelClass}>New Password</label>
                <div className="relative">
                  <Lock className={`absolute left-3 top-3.5 w-5 h-5 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} />
                  <input 
                    type={showNewPass ? "text" : "password"}
                    value={passData.newPassword}
                    onChange={(e) => setPassData({...passData, newPassword: e.target.value})}
                    className={`${inputClass} pr-10`} // Extra padding for eye icon
                    placeholder="New secure password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className={`absolute right-3 top-3.5 transition hover:opacity-80 focus:outline-none ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}
                  >
                    {showNewPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button 
                disabled={isLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 mt-4 transition shadow-lg shadow-blue-500/20 text-sm sm:text-base active:scale-95"
              >
                {isLoading ? 'Updating...' : <><Save size={18} /> Update Password</>}
              </button>
            </form>
          )}

        </div>

        {/* Footer (Logout) */}
        <div className={`p-4 border-t flex-shrink-0 ${isDarkMode ? 'border-slate-800 bg-slate-800/50' : 'border-gray-100 bg-gray-50'}`}>
          <button 
            onClick={onLogout}
            className={`w-full py-2.5 sm:py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition text-sm sm:text-base active:scale-95
              ${isDarkMode ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50' : 'bg-white border border-gray-200 text-red-600 hover:bg-red-50'}`}
          >
            <LogOut size={18} /> Logout
          </button>
        </div>

      </div>
    </div>
  );
};

// Simple Icon Component for Header
const UserCogIcon = ({ isDark }) => (
  <div className={`p-1.5 rounded-lg ${isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
    <User size={20} />
  </div>
);

export default ProfileModal;