import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { getInitialTheme, toggleTheme } from "../utils/theme";
import { 
  Plus, Trash2, TreePine, Moon, Sun, Bell, Check, X, 
  Shield, Users, Eye, Share2, AlertTriangle, User, LogOut 
} from "lucide-react"; 
import ShareModal from "../components/ShareModal";
import toast from "react-hot-toast";

const Dashboard = () => {
  const [isDarkMode, setIsDarkMode] = useState(getInitialTheme());
  const [trees, setTrees] = useState([]);
  const [filteredTrees, setFilteredTrees] = useState([]);
  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState("latest");
  const [user, setUser] = useState(null);

  // --- Modal States ---
  const [showModal, setShowModal] = useState(false);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false); // ✅ Profile Menu State
  const [sharingTreeId, setSharingTreeId] = useState(null);
  const [deleteTargetTree, setDeleteTargetTree] = useState(null);

  // --- Tree Editing States ---
  const [editingTree, setEditingTree] = useState(null);
  const [newTreeName, setNewTreeName] = useState("");
  const [newTreeDescription, setNewTreeDescription] = useState("");
  const [editTreeName, setEditTreeName] = useState("");
  const [editTreeDescription, setEditTreeDescription] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    fetchUser();
    fetchTrees();
  }, []);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [isDarkMode]);

  useEffect(() => {
    filterAndSortTrees();
  }, [trees, search, sortMode]);

  const pendingRequests = trees.flatMap(tree =>
    (tree.collaborators || [])
      .filter(c => c.requestedEdit)
      .map(c => ({ ...c, treeId: tree._id, treeName: tree.name }))
  );

  const fetchUser = async () => {
    try {
      const { data } = await api.get("/auth/me");
      setUser(data);
    } catch { }
  };

  const fetchTrees = async () => {
    try {
      const { data } = await api.get("/trees");
      setTrees(data);
    } catch {
      toast.error("Failed to load trees");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success("Logged out successfully");
    navigate('/');
  };

  const filterAndSortTrees = () => {
    let result = trees.filter((t) =>
      t.name.toLowerCase().includes(search.toLowerCase())
    );

    if (sortMode === "latest")
      result.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
    else if (sortMode === "az")
      result.sort((a, b) => a.name.localeCompare(b.name));
    else result.sort((a, b) => b.name.localeCompare(a.name));

    setFilteredTrees(result);
  };

  const createTree = async (e) => {
    e.preventDefault();
    try {
      await api.post("/trees", {
        name: newTreeName,
        description: newTreeDescription,
      });
      resetModal();
      fetchTrees();
      toast.success("Family Tree Created!");
    } catch {
      toast.error("Failed creating tree");
    }
  };

  const updateTree = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/trees/${editingTree._id}`, {
        name: editTreeName,
        description: editTreeDescription,
      });
      resetModal();
      fetchTrees();
      toast.success("Tree updated!");
    } catch {
      toast.error("Error updating tree");
    }
  };

  const initiateDeleteTree = (tree, e) => {
    e.stopPropagation();
    setDeleteTargetTree(tree);
  };

  const confirmDeleteTree = async () => {
    if (!deleteTargetTree) return;
    try {
      await api.delete(`/trees/${deleteTargetTree._id}`);
      setTrees(trees.filter((t) => t._id !== deleteTargetTree._id));
      toast.success("Tree deleted");
    } catch {
      toast.error("Could not delete tree");
    } finally {
      setDeleteTargetTree(null);
    }
  };

  const handleManageRequest = async (treeId, userId, approve) => {
    try {
      await api.put(`/trees/${treeId}/role`, {
        userId,
        action: 'update',
        role: approve ? 'editor' : 'viewer'
      });
      toast.success(approve ? "Access Granted" : "Request Denied");
      fetchTrees();
      if (pendingRequests.length === 1) setShowNotifModal(false);
    } catch (error) {
      toast.error("Action failed");
    }
  };

  const resetModal = () => {
    setShowModal(false);
    setEditingTree(null);
    setNewTreeName("");
    setNewTreeDescription("");
    setEditTreeName("");
    setEditTreeDescription("");
  };

  const getRoleBadge = (role) => {
    if (role === 'owner') return (
      <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded bg-amber-100 text-amber-700 border border-amber-200">
        <Shield size={12} /> Owner
      </span>
    );
    if (role === 'editor') return (
      <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded bg-blue-100 text-blue-700 border border-blue-200">
        <Users size={12} /> Editor
      </span>
    );
    return (
      <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded bg-gray-100 text-gray-600 border border-gray-200">
        <Eye size={12} /> Viewer
      </span>
    );
  };

  return (
    <div className={`min-h-screen p-4 sm:p-8 transition-colors ${
      isDarkMode ? "bg-gray-900 text-white" : "bg-gradient-to-b from-green-50 to-gray-100 text-gray-900"
    }`} onClick={() => setShowProfileMenu(false)}>
      
      <div className="max-w-7xl mx-auto">

        {/* --- HEADER SECTION --- */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 sm:mb-10 gap-6 md:gap-0">
          
          {/* Title Area */}
          <div className="text-center md:text-left w-full md:w-auto">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <TreePine className="w-8 h-8 sm:w-10 sm:h-10 text-green-500" />
              <h1 className="text-3xl sm:text-4xl font-extrabold">Legacy Builder</h1>
            </div>
            <p className="mt-2 text-sm sm:text-base opacity-80">
              Welcome{user ? `, ${user.name}` : ""}! Craft and explore your family history.
            </p>
          </div>

          {/* Controls Area */}
          <div className="flex w-full md:w-auto justify-between md:justify-end items-center gap-3">
            
            {/* 1. New Tree Button (Left on Mobile) */}
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 sm:px-6 py-3 rounded-xl shadow-md transition text-sm sm:text-base font-medium"
            >
              <Plus size={20} /> <span className="hidden sm:inline">New Tree</span> <span className="sm:hidden">New</span>
            </button>

            {/* Right Group: Notification -> Theme -> Profile */}
            <div className="flex gap-2 sm:gap-3">
              
              {/* 2. Notification Bell */}
              <button
                onClick={() => setShowNotifModal(true)}
                className={`relative p-3 rounded-xl shadow-md transition ${
                  isDarkMode ? "bg-gray-700 text-white" : "bg-white text-gray-700"
                }`}
              >
                <Bell size={20} />
                {pendingRequests.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full animate-bounce">
                    {pendingRequests.length}
                  </span>
                )}
              </button>

              {/* 3. Theme Toggle */}
              <button
                onClick={() => toggleTheme(isDarkMode, setIsDarkMode)}
                className={`p-3 rounded-xl shadow-md transition ${
                  isDarkMode ? "bg-gray-700 text-white" : "bg-white text-gray-700"
                }`}
              >
                {isDarkMode ? <Moon size={20} /> : <Sun size={20} className="text-yellow-500" />}
              </button>

              {/* 4. Profile Menu (New) */}
              <div className="relative">
                <button
                  onClick={(e) => { e.stopPropagation(); setShowProfileMenu(!showProfileMenu); }}
                  className={`p-3 rounded-xl shadow-md transition ${
                    isDarkMode ? "bg-gray-700 text-white" : "bg-white text-gray-700"
                  }`}
                >
                  <User size={20} />
                </button>

                {/* Profile Popover */}
                {showProfileMenu && (
                  <div className={`absolute right-0 top-14 w-48 rounded-xl shadow-2xl border p-2 z-50 animate-fade-in
                    ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    
                    <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700 mb-2">
                      <p className="text-sm font-bold truncate">{user?.name || 'User'}</p>
                      <p className="text-xs opacity-60 truncate">{user?.email}</p>
                    </div>

                    <button 
                      onClick={handleLogout}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition
                        ${isDarkMode ? 'hover:bg-red-900/30 text-red-400' : 'hover:bg-red-50 text-red-600'}`}
                    >
                      <LogOut size={16} /> Logout
                    </button>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>

        {/* --- SEARCH SECTION --- */}
        <div className="flex flex-row gap-2 sm:gap-4 mb-8">
          <input
            type="text"
            placeholder="Search trees..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`flex-1 p-3 w-full rounded-lg border outline-none focus:ring-2 focus:ring-green-500 transition text-sm sm:text-base ${
              isDarkMode ? "bg-gray-800 text-white border-gray-600" : "bg-white"
            }`}
          />
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value)}
            className={`w-auto p-3 rounded-lg border outline-none focus:ring-2 focus:ring-green-500 transition text-sm sm:text-base ${
              isDarkMode ? "bg-gray-800 text-white border-gray-600" : "bg-white"
            }`}
          >
            <option value="latest" className={isDarkMode ? "bg-gray-800" : ""}>Latest</option>
            <option value="az" className={isDarkMode ? "bg-gray-800" : ""}>A → Z</option>
            <option value="za" className={isDarkMode ? "bg-gray-800" : ""}>Z → A</option>
          </select>
        </div>

        {/* Empty State */}
        {!filteredTrees.length && (
          <div className="text-center mt-10 sm:mt-20 opacity-70">
            <TreePine className="w-16 h-16 sm:w-20 sm:h-20 mx-auto" />
            <p className="text-lg mt-4">No family trees yet. Create one or ask for an invite!</p>
          </div>
        )}

        {/* Trees Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTrees.map((tree) => (
            <div
              key={tree._id}
              onClick={() => navigate(`/tree/${tree._id}`)}
              className={`group relative p-6 rounded-2xl shadow-md hover:shadow-xl hover:-translate-y-1 border transition cursor-pointer ${
                isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white"
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-bold truncate max-w-[70%]">{tree.name}</h3>

                <div className="flex gap-2 items-center">
                  {/* Role Badge */}
                  {getRoleBadge(tree.currentUserRole)}

                  {/* Share Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSharingTreeId(tree._id);
                    }}
                    className="text-gray-400 hover:text-green-500 transition cursor-pointer ml-1 p-1"
                    title="Share Tree"
                  >
                    <Share2 size={18} />
                  </button>

                  {/* Edit */}
                  {(tree.currentUserRole === 'owner' || tree.currentUserRole === 'editor') && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingTree(tree);
                        setEditTreeName(tree.name);
                        setEditTreeDescription(tree.description || "");
                        setShowModal(true);
                      }}
                      className="text-gray-400 hover:text-blue-500 transition cursor-pointer ml-1 p-1"
                    >
                      ✏️
                    </button>
                  )}

                  {/* Delete */}
                  {tree.currentUserRole === 'owner' && (
                    <button
                      onClick={(e) => initiateDeleteTree(tree, e)}
                      className="text-gray-400 hover:text-red-500 transition cursor-pointer ml-1 p-1"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>

              {tree.currentUserRole !== 'owner' && tree.ownerId && (
                <p className="text-xs text-gray-500 mb-2">
                  Owned by: <span className="font-semibold">{tree.ownerId.name}</span>
                </p>
              )}

              <p className="text-sm mb-3 opacity-90 line-clamp-2 min-h-[40px]">
                {tree.description || "No description available"}
              </p>

              <div className="text-xs opacity-80 pt-3 border-t border-gray-200 dark:border-gray-700 mt-2 flex justify-between items-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation(); 
                    navigate(`/tree/${tree._id}/list`);
                  }}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded transition
                    ${isDarkMode ? 'hover:bg-gray-700 text-blue-400' : 'hover:bg-blue-50 text-blue-600'}`}
                  title="View All Members List"
                >
                  <Users size={14} />
                  <span className="font-semibold">{tree.membersCount} Members</span>
                </button>

                <span>Updated: {new Date(tree.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>

        {/* --- MODAL (Edit/Create) --- */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className={`p-6 sm:p-8 rounded-2xl w-full max-w-md shadow-lg ${
              isDarkMode ? "bg-gray-800 text-white" : "bg-white"
            }`}>
              <h2 className="text-2xl font-bold mb-6">
                {editingTree ? "Edit Tree" : "New Tree"}
              </h2>

              <form onSubmit={editingTree ? updateTree : createTree}>
                <input
                  type="text"
                  placeholder="Tree Name"
                  value={editingTree ? editTreeName : newTreeName}
                  onChange={(e) =>
                    editingTree
                      ? setEditTreeName(e.target.value)
                      : setNewTreeName(e.target.value)
                  }
                  className={`w-full border p-3 rounded-lg mb-3 outline-none focus:ring-2 focus:ring-green-500 ${
                    isDarkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : ""
                  }`}
                  required
                />
                <textarea
                  placeholder="Short description"
                  rows="3"
                  value={editingTree ? editTreeDescription : newTreeDescription}
                  onChange={(e) =>
                    editingTree
                      ? setEditTreeDescription(e.target.value)
                      : setNewTreeDescription(e.target.value)
                  }
                  className={`w-full border p-3 rounded-lg mb-6 outline-none focus:ring-2 focus:ring-green-500 ${
                    isDarkMode ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400" : ""
                  }`}
                />
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={resetModal} className={`px-4 py-2 rounded-lg transition ${
                      isDarkMode ? "bg-gray-600 hover:bg-gray-500 text-white" : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                    }`}>
                    Cancel
                  </button>
                  <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold">
                    {editingTree ? "Save" : "Create"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* --- NOTIFICATIONS MODAL --- */}
        {showNotifModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowNotifModal(false)}>
            <div 
              className={`p-6 rounded-2xl w-full max-w-lg shadow-2xl relative max-h-[80vh] flex flex-col ${isDarkMode ? "bg-gray-800 text-white" : "bg-white"}`}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Access Requests</h2>
                <button onClick={() => setShowNotifModal(false)}><X size={24} /></button>
              </div>

              {pendingRequests.length === 0 ? (
                <div className="text-center py-8 opacity-60">
                  <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No pending requests.</p>
                </div>
              ) : (
                <div className="space-y-4 overflow-y-auto custom-scrollbar pr-2">
                  {pendingRequests.map((req, idx) => (
                    <div key={idx} className={`p-4 rounded-lg border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 ${isDarkMode ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-200"}`}>
                      <div>
                        <p className="font-bold text-sm sm:text-base">{req.user?.name || "Unknown User"}</p>
                        <p className="text-xs opacity-70 mb-1">{req.user?.email}</p>
                        <p className="text-xs flex items-center gap-1">
                          wants to edit <TreePine size={12} className="text-green-500"/> <span className="font-semibold">{req.treeName}</span>
                        </p>
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto justify-end">
                        <button 
                          onClick={() => handleManageRequest(req.treeId, req.user._id, true)}
                          className="p-2 bg-green-100 text-green-700 rounded-full hover:bg-green-200" title="Approve">
                          <Check size={18} />
                        </button>
                        <button 
                          onClick={() => handleManageRequest(req.treeId, req.user._id, false)}
                          className="p-2 bg-red-100 text-red-700 rounded-full hover:bg-red-200" title="Deny">
                          <X size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- SHARE MODAL --- */}
        {sharingTreeId && (
          <ShareModal 
            treeId={sharingTreeId} 
            onClose={() => setSharingTreeId(null)} 
          />
        )}

        {/* --- DELETE CONFIRMATION MODAL --- */}
        {deleteTargetTree && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] backdrop-blur-sm p-4" onClick={() => setDeleteTargetTree(null)}>
            <div 
              className={`p-8 rounded-3xl w-full max-w-sm shadow-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-gray-100'}`}
              onClick={e => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="w-14 h-14 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-5">
                  <AlertTriangle size={28} />
                </div>
                <h3 className="text-xl font-bold mb-2">Delete Tree?</h3>
                <p className={`text-sm mb-8 leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Are you sure you want to delete <b className={isDarkMode ? 'text-white' : 'text-slate-900'}>{deleteTargetTree.name}</b>? <br/>
                  This action <b>cannot</b> be undone. All members and data will be lost.
                </p>
                
                <div className="flex gap-3">
                  <button 
                    onClick={() => setDeleteTargetTree(null)}
                    className={`flex-1 py-3 rounded-xl font-medium transition ${isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={confirmDeleteTree}
                    className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition shadow-lg shadow-red-500/30"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Dashboard;