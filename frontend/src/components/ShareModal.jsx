import { useState, useEffect } from 'react';
import { 
  X, Copy, Check, UserPlus, Mail, Shield, Users, Eye, 
  Globe, Link as LinkIcon, Trash2, Download, Search
} from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const ShareModal = ({ treeId, onClose }) => {
  const [activeTab, setActiveTab] = useState('invite'); // 'invite' or 'link'
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('viewer');
  const [loading, setLoading] = useState(false);
  const [collaborators, setCollaborators] = useState([]); 
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Theme Detection
  const isDarkMode = document.documentElement.classList.contains('dark');

  useEffect(() => {
    if (treeId) {
      fetchCollaborators();
    }
  }, [treeId]);

  // Search Debounce
  useEffect(() => {
    const delay = setTimeout(() => {
      if (searchQuery.length > 2) handleSearch();
      else setSearchResults([]);
    }, 500);
    return () => clearTimeout(delay);
  }, [searchQuery]);

  const fetchCollaborators = async () => {
    try {
      const { data } = await api.get(`/trees/${treeId}/collaborators`);
      
      // 1. Handle Collaborators List
      if (Array.isArray(data)) {
        setCollaborators(data);
      } else if (data.collaborators && Array.isArray(data.collaborators)) {
        setCollaborators(data.collaborators);
      } else {
        setCollaborators([]);
      }

      // 2. ✅ FIX: Generate Link using shareToken from backend
      // If shareToken exists, use it. Otherwise fallback to treeId (though backend should provide token)
      const token = data.shareToken || treeId;
      setInviteLink(`${window.location.origin}/join/${token}`);

    } catch (error) {
      console.error("Error fetching collaborators:", error);
      setCollaborators([]); 
    }
  };

  const handleSearch = async () => {
    try {
      setIsSearching(true);
      const { data } = await api.get(`/auth/search?query=${searchQuery}`);
      
      const currentList = Array.isArray(collaborators) ? collaborators : [];
      const existingIds = new Set(currentList.map(c => c.user._id));
      
      const results = Array.isArray(data) ? data : [];
      setSearchResults(results.filter(u => !existingIds.has(u._id)));
    } catch (error) {
      console.error(error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleInvite = async (e) => {
    e?.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await api.post(`/trees/${treeId}/invite`, { email, role });
      toast.success("Invitation sent!");
      setEmail('');
      setSearchResults([]);
      setSearchQuery('');
      fetchCollaborators();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to invite");
    } finally {
      setLoading(false);
    }
  };

  const handleDirectAdd = (user) => {
    setEmail(user.email);
    setSearchResults([]);
    setSearchQuery('');
  };

  const handleRemove = async (userId) => {
    if (!window.confirm("Remove this collaborator?")) return;
    try {
      await api.delete(`/trees/${treeId}/collaborators/${userId}`);
      setCollaborators(prev => prev.filter(c => c.user._id !== userId));
      toast.success("Removed successfully");
    } catch (error) {
      toast.error("Failed to remove");
      fetchCollaborators(); 
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Link copied!");
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const response = await api.get(`/gedcom/export/${treeId}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      const contentDisposition = response.headers['content-disposition'];
      let fileName = 'family_tree.ged';
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?(.+)"?/);
        if (match && match.length === 2) fileName = match[1];
      }
      
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("GEDCOM file downloaded!");
    } catch (error) {
      toast.error("Export failed");
    } finally {
      setIsExporting(false);
    }
  };

  // --- STYLES ---
  const inputClass = `w-full p-3 rounded-xl border outline-none focus:ring-2 focus:ring-green-500 transition-all ${
    isDarkMode 
      ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500" 
      : "bg-white border-gray-200 text-gray-900 placeholder-gray-400"
  }`;

  const labelClass = `text-xs font-bold uppercase opacity-60 mb-1.5 block ml-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`;

  return (
    <div 
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] backdrop-blur-sm p-4" 
      onClick={onClose}
    >
      <div 
        className={`w-[95%] sm:w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden transform transition-all scale-100 flex flex-col max-h-[85vh]
          ${isDarkMode ? 'bg-slate-900 text-slate-100 border border-slate-800' : 'bg-white text-slate-800'}`}
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className={`p-5 sm:p-6 border-b flex-shrink-0 ${isDarkMode ? 'border-slate-800' : 'border-gray-100'} flex justify-between items-center`}>
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <UserPlus size={24} className="text-green-500"/> Share Tree
            </h2>
            <p className={`text-sm mt-1 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Invite family to view or edit
            </p>
          </div>
          <button onClick={onClose} className={`p-2 rounded-full transition ${isDarkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-gray-100 text-gray-500'}`}>
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className={`flex p-2 gap-2 border-b flex-shrink-0 ${isDarkMode ? 'border-slate-800' : 'border-gray-100'}`}>
          <button 
            onClick={() => setActiveTab('invite')}
            className={`flex-1 py-2 text-sm font-bold rounded-xl transition flex items-center justify-center gap-2 ${activeTab === 'invite' 
              ? (isDarkMode ? 'bg-slate-800 text-white shadow-sm' : 'bg-green-50 text-green-700 shadow-sm') 
              : 'opacity-60 hover:opacity-100'}`}
          >
            <Mail size={16} /> Email Invite
          </button>
          <button 
            onClick={() => setActiveTab('link')}
            className={`flex-1 py-2 text-sm font-bold rounded-xl transition flex items-center justify-center gap-2 ${activeTab === 'link' 
              ? (isDarkMode ? 'bg-slate-800 text-white shadow-sm' : 'bg-blue-50 text-blue-700 shadow-sm') 
              : 'opacity-60 hover:opacity-100'}`}
          >
            <LinkIcon size={16} /> Copy Link
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar flex-1">
          
          {activeTab === 'invite' ? (
            <div className="space-y-6">
              
              {/* --- SEARCH / EMAIL FORM --- */}
              <div className="space-y-4">
                <div className="relative">
                  <label className={labelClass}>Search Users</label>
                  <div className="relative">
                    <input 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Name or Email..."
                      className={`${inputClass} pl-10`}
                    />
                    <Search className={`absolute left-3 top-3.5 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} size={18} />
                  </div>
                  
                  {/* Search Dropdown */}
                  {searchResults.length > 0 && (
                    <div className={`absolute top-full left-0 right-0 mt-2 rounded-xl shadow-xl z-10 border max-h-40 overflow-y-auto
                      ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
                      {searchResults.map(user => (
                        <div key={user._id} 
                           onClick={() => handleDirectAdd(user)}
                           className={`p-3 flex justify-between items-center cursor-pointer border-b last:border-0 
                             ${isDarkMode ? 'hover:bg-slate-700 border-slate-700' : 'hover:bg-gray-50 border-gray-100'}`}>
                           <div>
                             <p className="font-bold text-sm">{user.name}</p>
                             <p className="text-xs opacity-60">{user.email}</p>
                           </div>
                           <UserPlus size={16} className="text-green-500"/>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <form onSubmit={handleInvite} className="space-y-4 pt-2 border-t border-dashed border-gray-200 dark:border-slate-700">
                  <div>
                    <label className={labelClass}>Email Address</label>
                    <input 
                      type="email" 
                      placeholder="relative@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={inputClass}
                      required
                    />
                  </div>

                  <div>
                    <label className={labelClass}>Access Level</label>
                    <div className={`grid grid-cols-2 gap-3 p-1 rounded-xl border ${isDarkMode ? 'border-slate-700 bg-slate-800/50' : 'border-gray-200 bg-gray-50'}`}>
                      <label className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition ${role === 'viewer' ? (isDarkMode ? 'bg-slate-700' : 'bg-white shadow-sm') : 'opacity-50'}`}>
                        <input type="radio" name="role" value="viewer" checked={role === 'viewer'} onChange={() => setRole('viewer')} className="hidden" />
                        <div className={`p-1.5 rounded-md ${isDarkMode ? 'bg-slate-600' : 'bg-gray-100'}`}><Eye size={16}/></div>
                        <span className="text-sm font-bold">Viewer</span>
                      </label>
                      
                      <label className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition ${role === 'editor' ? (isDarkMode ? 'bg-slate-700' : 'bg-white shadow-sm') : 'opacity-50'}`}>
                        <input type="radio" name="role" value="editor" checked={role === 'editor'} onChange={() => setRole('editor')} className="hidden" />
                        <div className={`p-1.5 rounded-md ${isDarkMode ? 'bg-blue-900/50 text-blue-400' : 'bg-blue-100 text-blue-600'}`}><Users size={16}/></div>
                        <span className="text-sm font-bold">Editor</span>
                      </label>
                    </div>
                  </div>

                  <button 
                    disabled={loading}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-green-500/20 active:scale-95"
                  >
                    {loading ? 'Sending...' : <>Send Invite <Mail size={18} /></>}
                  </button>
                </form>
              </div>

              {/* Collaborators List */}
              <div className={`pt-6 border-t ${isDarkMode ? 'border-slate-800' : 'border-gray-100'}`}>
                <h3 className={`text-xs font-bold uppercase tracking-wider mb-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>Current Members</h3>
                <div className="space-y-3">
                  {(!collaborators || collaborators.length === 0) && (
                    <p className="text-sm opacity-50 italic text-center">No collaborators yet.</p>
                  )}
                  
                  {Array.isArray(collaborators) && collaborators.map((c) => (
                    <div key={c.user._id} className={`flex items-center justify-between p-3 rounded-xl border ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-gray-50 border-gray-100'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isDarkMode ? 'bg-slate-700' : 'bg-white border'}`}>
                           {c.user.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold leading-none">{c.user.name}</p>
                          <p className="text-xs opacity-60 mt-1 flex items-center gap-1">
                            {c.role === 'editor' ? <Users size={10} className="text-blue-500"/> : <Eye size={10}/>} {c.role}
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleRemove(c.user._id)}
                        className={`p-2 rounded-lg transition ${isDarkMode ? 'hover:bg-red-900/30 text-slate-500 hover:text-red-400' : 'hover:bg-red-50 text-gray-400 hover:text-red-600'}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center py-4">
                 <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isDarkMode ? 'bg-blue-900/20 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                    <Globe size={32} />
                 </div>
                 <h3 className="text-lg font-bold mb-2">Public Link</h3>
                 <p className={`text-sm max-w-xs mx-auto ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                   Anyone with this link can request to join this tree.
                 </p>
              </div>

              <div>
                <label className={labelClass}>Link URL</label>
                <div className="flex gap-2">
                  <input 
                    readOnly 
                    value={inviteLink} 
                    className={`${inputClass} text-opacity-70`}
                  />
                  <button 
                    onClick={copyToClipboard}
                    className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl transition shadow-lg shadow-blue-500/20 active:scale-95"
                  >
                    {copied ? <Check size={20} /> : <Copy size={20} />}
                  </button>
                </div>
              </div>
              
              <div className={`p-4 rounded-xl text-xs leading-relaxed border flex gap-3 ${isDarkMode ? 'bg-amber-900/10 border-amber-900/30 text-amber-400' : 'bg-amber-50 border-amber-100 text-amber-700'}`}>
                 <Shield size={24} className="shrink-0" />
                 <p>For security, users joining via link will be added as <b>Viewers</b> by default. You can upgrade them to Editors later.</p>
              </div>

              {/* EXPORT BUTTON */}
              <div className={`pt-6 border-t ${isDarkMode ? 'border-slate-800' : 'border-gray-100'}`}>
                <label className={labelClass}>Backup Data</label>
                <div className={`p-4 rounded-xl border flex items-center justify-between ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
                    <div>
                        <p className="font-bold text-sm">Export GEDCOM</p>
                        <p className="text-xs opacity-60">Standard genealogy file format</p>
                    </div>
                    <button 
                        onClick={handleExport}
                        disabled={isExporting}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition disabled:opacity-50"
                    >
                        {isExporting ? <span className="animate-pulse">Saving...</span> : <><Download size={16} /> Download</>}
                    </button>
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShareModal;