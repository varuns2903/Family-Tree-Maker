import { useState, useEffect } from 'react';
import { Copy, X, Trash2, UserCog, Shield, Search, UserPlus } from 'lucide-react'; // ✅ Added Icons
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
    }, 500); // Wait 500ms after typing stops

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
      // Filter out users who are already collaborators
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
        // Reuse the 'manageRole' endpoint with action='update' to add/update
        // Or if your backend logic for 'add' is strict, you might need to use 
        // a specific logic. However, previously 'manageRole' handled 'update'.
        // To ADD a new person, we technically need to PUSH to the array.
        // Let's use the /role endpoint but treat it as an "add" or "invite"
        
        // NOTE: Ensure your backend manageRole logic handles adding new users 
        // if they don't exist in the array. 
        // If your current backend only UPDATES existing, we might need a tweak.
        // Assuming we update the backend to handle "add" via the same endpoint or a new one.
        // Let's assume we use a specific action 'add' for clarity.
        
        await api.put(`/trees/${treeId}/role`, { 
            userId: user._id, 
            action: 'add', // We will update backend to handle this
            role: 'viewer' // Default role
        });

        toast.success(`${user.name} added!`);
        setSearchResults(prev => prev.filter(u => u._id !== user._id)); // Remove from search
        fetchCollaborators(); // Refresh list
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
        className="bg-white dark:bg-gray-800 p-6 rounded-2xl w-full max-w-lg shadow-2xl m-4 h-[80vh] flex flex-col" 
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold dark:text-white flex items-center gap-2">
            <UserCog className="text-blue-500" /> Share & Access
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition">
            <X size={24} className="dark:text-gray-400" />
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : (
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-6">
            
            {/* 1. DIRECT INVITE SECTION (Only Owner) */}
            {isOwner && (
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                    <label className="text-xs font-bold uppercase text-blue-600 dark:text-blue-400 mb-2 block">
                        Direct Invite
                    </label>
                    <div className="relative">
                        <input 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by name or email..."
                            className="w-full pl-10 pr-4 py-2 rounded-lg border dark:border-gray-600 dark:bg-gray-800 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                    </div>

                    {/* Search Results */}
                    {searchResults.length > 0 && (
                        <div className="mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 overflow-hidden">
                            {searchResults.map(user => (
                                <div key={user._id} className="flex justify-between items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                                    <div>
                                        <p className="text-sm font-bold dark:text-gray-200">{user.name}</p>
                                        <p className="text-xs text-gray-500">{user.email}</p>
                                    </div>
                                    <button 
                                        onClick={() => handleDirectAdd(user)}
                                        className="bg-blue-600 text-white p-1.5 rounded-lg hover:bg-blue-700 transition flex items-center gap-1 text-xs font-medium">
                                        <UserPlus size={14} /> Add
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                    {searchQuery.length > 2 && searchResults.length === 0 && !isSearching && (
                        <p className="text-xs text-gray-500 mt-2 text-center">No users found.</p>
                    )}
                </div>
            )}

            {/* 2. COPY LINK SECTION */}
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border dark:border-gray-600">
              <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-2 block">
                Public Link
              </label>
              <div className="flex gap-2">
                <input 
                  readOnly 
                  value={shareUrl} 
                  className="w-full bg-white dark:bg-gray-800 border dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-600 dark:text-gray-300 focus:outline-none"
                />
                <button 
                  onClick={copyToClipboard}
                  className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 p-2 rounded-lg transition"
                  title="Copy Link"
                >
                  <Copy size={18} />
                </button>
              </div>
            </div>

            {/* 3. MANAGE ACCESS SECTION */}
            <div>
              <h3 className="font-bold text-lg dark:text-white mb-4">Current Members</h3>
              
              <div className="flex items-center justify-between p-3 mb-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                    <Shield size={20} />
                  </div>
                  <div>
                    <p className="font-bold dark:text-gray-200 text-sm">Tree Owner</p>
                    <p className="text-xs text-gray-500">Admin privileges</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-1 bg-amber-100 text-amber-700 rounded uppercase">Owner</span>
              </div>

              <div className="space-y-2">
                {collaborators.length === 0 && (
                  <p className="text-center text-sm text-gray-400 italic py-4">No other members yet.</p>
                )}

                {collaborators.map((collab) => (
                  <div key={collab.user._id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-700/30 rounded-lg border dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold text-sm">
                        {collab.user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="overflow-hidden">
                        <p className="font-medium text-sm dark:text-gray-200 truncate w-[120px] sm:w-auto">
                          {collab.user.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate w-[120px] sm:w-auto">
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
                            className="text-xs bg-gray-50 dark:bg-gray-800 border dark:border-gray-600 rounded px-2 py-1 focus:outline-none dark:text-gray-300 cursor-pointer"
                          >
                            <option value="viewer">Viewer</option>
                            <option value="editor">Editor</option>
                          </select>

                          <button 
                            onClick={() => handleRemoveUser(collab.user._id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition"
                            title="Remove User"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      ) : (
                        <span className={`text-xs font-bold px-2 py-1 rounded capitalize
                          ${collab.role === 'editor' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-600'}`}>
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