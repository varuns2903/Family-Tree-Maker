import { useState, useEffect } from 'react';
import { Copy, X, Trash2, UserCog, Shield } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const ShareModal = ({ treeId, onClose }) => {
  const [shareUrl, setShareUrl] = useState('');
  const [collaborators, setCollaborators] = useState([]);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCollaborators();
  }, [treeId]);

  const fetchCollaborators = async () => {
    try {
      const { data } = await api.get(`/trees/${treeId}/collaborators`);
      setCollaborators(data.collaborators);
      setIsOwner(data.isOwner); // Backend flag
      
      // Construct share URL
      const baseUrl = window.location.origin;
      setShareUrl(`${baseUrl}/join/${data.shareToken}`);
    } catch (error) {
      toast.error("Failed to load sharing details");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    toast.success("Link copied!");
  };

  const handleRemoveUser = async (userId) => {
    if (!window.confirm("Remove this user? They will lose access immediately.")) return;
    try {
      // Re-uses the existing Manage Role endpoint
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

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-white dark:bg-gray-800 p-6 rounded-2xl w-full max-w-lg shadow-2xl m-4" 
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
          <div className="text-center py-8 text-gray-500">Loading access details...</div>
        ) : (
          <div className="space-y-6">
            
            {/* 1. SHARE LINK SECTION */}
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl border dark:border-gray-600">
              <label className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400 mb-2 block">
                Invite via Link
              </label>
              <div className="flex gap-2">
                <input 
                  readOnly 
                  value={shareUrl} 
                  className="w-full bg-white dark:bg-gray-800 border dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-600 dark:text-gray-300 focus:outline-none"
                />
                <button 
                  onClick={copyToClipboard}
                  className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition"
                  title="Copy Link"
                >
                  <Copy size={18} />
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Anyone with this link can view the tree and request edit access.
              </p>
            </div>

            <hr className="dark:border-gray-700" />

            {/* 2. MANAGE ACCESS SECTION */}
            <div>
              <h3 className="font-bold text-lg dark:text-white mb-4">Who has access</h3>
              
              {/* Owner Badge */}
              <div className="flex items-center justify-between p-3 mb-2 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                    <Shield size={20} />
                  </div>
                  <div>
                    <p className="font-bold dark:text-gray-200">Tree Owner</p>
                    <p className="text-xs text-gray-500">Admin privileges</p>
                  </div>
                </div>
                <span className="text-xs font-bold px-2 py-1 bg-amber-100 text-amber-700 rounded">OWNER</span>
              </div>

              {/* Collaborators List */}
              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
                {collaborators.length === 0 && (
                  <p className="text-center text-sm text-gray-400 italic py-2">No other members yet.</p>
                )}

                {collaborators.map((collab) => (
                  <div key={collab.user._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg border dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center font-bold text-sm">
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
                      {/* Role Toggle (Only Owner can see) */}
                      {isOwner ? (
                        <>
                          <select 
                            value={collab.role}
                            onChange={(e) => handleRoleChange(collab.user._id, e.target.value)}
                            className="text-xs bg-white dark:bg-gray-800 border dark:border-gray-600 rounded px-2 py-1 focus:outline-none dark:text-gray-300 cursor-pointer"
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
                        // View for non-owners
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