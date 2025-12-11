import { useState, useEffect } from 'react';
import { Copy, X, Trash2, UserCog, Shield, Search, UserPlus } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const ShareModal = ({ treeId, onClose }) => {
  const [shareUrl, setShareUrl] = useState('');
  const [collaborators, setCollaborators] = useState([]);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);

  // --- SEARCH STATE ---
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    fetchCollaborators();
  }, [treeId]);

  // Debounce Search logic
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.length > 2) {
        handleSearch();
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const fetchCollaborators = async () => {
    try {
      const { data } = await api.get(`/trees/${treeId}/collaborators`);
      setCollaborators(data.collaborators);
      setIsOwner(data.isOwner);
      const baseUrl = window.location.origin;
      setShareUrl(`${baseUrl}/join/${data.shareToken}`);
    } catch (error) {
      toast.error("Failed to load sharing details");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      setIsSearching(true);
      const { data } = await api.get(`/auth/search?query=${searchQuery}`);
      const existingIds = new Set(collaborators.map(c => c.user._id));
      const filtered = data.filter(u => !existingIds.has(u._id));
      setSearchResults(filtered);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleDirectAdd = async (user) => {
    try {
        await api.put(`/trees/${treeId}/role`, { 
            userId: user._id, 
            action: 'add',
            role: 'viewer'
        });

        toast.success(`${user.name} added!`);
        setSearchResults(prev => prev.filter(u => u._id !== user._id));
        fetchCollaborators();
    } catch (error) {
        toast.error("Failed to add user");
    }
  };

  const handleRemoveUser = async (userId) => {
    if (!window.confirm("Remove this user?")) return;
    try {
      await api.put(`/trees/${treeId}/role`, { userId, action: 'remove' });
      setCollaborators(prev => prev.filter(c => c.user._id !== userId));
      toast.success("User removed");
    } catch {
      toast.error("Failed to remove user");
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.put(`/trees/${treeId}/role`, { userId, action: 'update', role: newRole });
      setCollaborators(prev => prev.map(c => 
        c.user._id === userId ? { ...c, role: newRole } : c
      ));
      toast.success("Role updated");
    } catch {
      toast.error("Failed to update role");
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    toast.success("Link copied!");
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] backdrop-blur-sm" onClick={onClose}>
      <div 
        className={`p-8 rounded-3xl w-full max-w-lg shadow-2xl m-4 h-[80vh] flex flex-col transform transition-all scale-100
          ${document.documentElement.classList.contains('dark') 
            ? "bg-slate-900 text-slate-100 border border-slate-800" 
            : "bg-white text-slate-800"}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <UserCog className="text-green-600 dark:text-green-400" /> Share & Access
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition">
            <X size={24} className="text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-slate-500 animate-pulse">Loading...</div>
        ) : (
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-8">
            
            {/* 1. DIRECT INVITE SECTION (Only Owner) */}
            {isOwner && (
                <div className={`p-5 rounded-2xl border transition
                  ${document.documentElement.classList.contains('dark') 
                    ? "bg-slate-800/50 border-slate-700" 
                    : "bg-green-50/50 border-green-100"}`}>
                    <label className={`text-xs font-bold uppercase mb-3 block tracking-wider
                      ${document.documentElement.classList.contains('dark') ? "text-green-400" : "text-green-700"}`}>
                        Direct Invite
                    </label>
                    <div className="relative">
                        <input 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by name or email..."
                            className={`w-full pl-10 pr-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-green-500 transition
                              ${document.documentElement.classList.contains('dark') 
                                ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500" 
                                : "bg-white border-gray-200 placeholder-slate-400"}`}
                        />
                        <Search className={`absolute left-3 top-3.5 ${document.documentElement.classList.contains('dark') ? "text-slate-500" : "text-slate-400"}`} size={18} />
                    </div>

                    {/* Search Results */}
                    {searchResults.length > 0 && (
                        <div className={`mt-3 rounded-xl shadow-lg border overflow-hidden
                          ${document.documentElement.classList.contains('dark') ? "bg-slate-800 border-slate-700" : "bg-white border-gray-100"}`}>
                            {searchResults.map(user => (
                                <div key={user._id} className={`flex justify-between items-center p-3 transition
                                  ${document.documentElement.classList.contains('dark') ? "hover:bg-slate-750" : "hover:bg-slate-50"}`}>
                                    <div>
                                        <p className="text-sm font-bold">{user.name}</p>
                                        <p className={`text-xs ${document.documentElement.classList.contains('dark') ? "text-slate-400" : "text-slate-500"}`}>{user.email}</p>
                                    </div>
                                    <button 
                                        onClick={() => handleDirectAdd(user)}
                                        className="bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition flex items-center gap-1 text-xs font-bold shadow-sm">
                                        <UserPlus size={14} /> Add
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                    {searchQuery.length > 2 && searchResults.length === 0 && !isSearching && (
                        <p className={`text-xs mt-2 text-center ${document.documentElement.classList.contains('dark') ? "text-slate-500" : "text-slate-400"}`}>No users found.</p>
                    )}
                </div>
            )}

            {/* 2. COPY LINK SECTION */}
            <div className={`p-5 rounded-2xl border transition
              ${document.documentElement.classList.contains('dark') 
                ? "bg-slate-800/50 border-slate-700" 
                : "bg-white border-gray-200"}`}>
              <label className={`text-xs font-bold uppercase mb-3 block tracking-wider
                ${document.documentElement.classList.contains('dark') ? "text-slate-400" : "text-slate-500"}`}>
                Public Link
              </label>
              <div className="flex gap-2">
                <input 
                  readOnly 
                  value={shareUrl} 
                  className={`w-full rounded-xl px-3 py-3 text-sm focus:outline-none border transition
                    ${document.documentElement.classList.contains('dark') 
                      ? "bg-slate-800 border-slate-700 text-slate-300" 
                      : "bg-slate-50 border-gray-200 text-slate-600"}`}
                />
                <button 
                  onClick={copyToClipboard}
                  className={`p-3 rounded-xl transition flex-shrink-0 border
                    ${document.documentElement.classList.contains('dark') 
                      ? "bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300" 
                      : "bg-slate-100 hover:bg-slate-200 border-gray-200 text-slate-600"}`}
                  title="Copy Link"
                >
                  <Copy size={20} />
                </button>
              </div>
            </div>

            {/* 3. MANAGE ACCESS SECTION */}
            <div>
              <h3 className="font-bold text-lg mb-5">Current Members</h3>
              
              <div className={`flex items-center justify-between p-4 mb-3 rounded-2xl border transition
                ${document.documentElement.classList.contains('dark') 
                  ? "bg-green-900/20 border-green-800/50" 
                  : "bg-green-50 border-green-100"}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-sm
                    ${document.documentElement.classList.contains('dark') ? "bg-green-800 text-green-200" : "bg-green-100 text-green-600"}`}>
                    <Shield size={24} />
                  </div>
                  <div>
                    <p className="font-bold text-sm">Tree Owner</p>
                    <p className={`text-xs ${document.documentElement.classList.contains('dark') ? "text-slate-400" : "text-slate-500"}`}>Admin privileges</p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border
                  ${document.documentElement.classList.contains('dark') ? "bg-green-900/30 text-green-400 border-green-800" : "bg-green-100 text-green-700 border-green-200"}`}>
                  Owner
                </span>
              </div>

              <div className="space-y-3">
                {collaborators.length === 0 && (
                  <p className={`text-center text-sm italic py-6 ${document.documentElement.classList.contains('dark') ? "text-slate-500" : "text-slate-400"}`}>No other members yet.</p>
                )}

                {collaborators.map((collab) => (
                  <div key={collab.user._id} className={`flex items-center justify-between p-4 rounded-2xl border transition
                    ${document.documentElement.classList.contains('dark') 
                      ? "bg-slate-800/40 border-slate-700 hover:bg-slate-800/70" 
                      : "bg-white border-gray-200 hover:bg-slate-50/80"}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm
                        ${document.documentElement.classList.contains('dark') ? "bg-slate-700 text-slate-300" : "bg-slate-100 text-slate-600"}`}>
                        {collab.user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="overflow-hidden">
                        <p className="font-bold text-sm truncate w-[120px] sm:w-auto">
                          {collab.user.name}
                        </p>
                        <p className={`text-xs truncate w-[120px] sm:w-auto ${document.documentElement.classList.contains('dark') ? "text-slate-400" : "text-slate-500"}`}>
                          {collab.user.email}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isOwner ? (
                        <>
                          <select 
                            value={collab.role}
                            onChange={(e) => handleRoleChange(collab.user._id, e.target.value)}
                            className={`text-xs rounded-lg px-2.5 py-1.5 font-medium border cursor-pointer outline-none transition
                              ${document.documentElement.classList.contains('dark') 
                                ? "bg-slate-800 border-slate-600 text-slate-300 focus:border-slate-500" 
                                : "bg-white border-gray-300 text-slate-600 focus:border-blue-400"}`}
                          >
                            <option value="viewer">Viewer</option>
                            <option value="editor">Editor</option>
                          </select>

                          <button 
                            onClick={() => handleRemoveUser(collab.user._id)}
                            className={`p-2 rounded-lg transition border
                              ${document.documentElement.classList.contains('dark') 
                                ? "text-red-400 hover:bg-red-900/20 border-transparent hover:border-red-900/50" 
                                : "text-red-500 hover:bg-red-50 border-transparent hover:border-red-100"}`}
                            title="Remove User"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      ) : (
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border
                          ${collab.role === 'editor' 
                            ? (document.documentElement.classList.contains('dark') ? 'bg-blue-900/30 text-blue-400 border-blue-800' : 'bg-blue-100 text-blue-700 border-blue-200') 
                            : (document.documentElement.classList.contains('dark') ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-200')}`}>
                          {collab.role}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default ShareModal;