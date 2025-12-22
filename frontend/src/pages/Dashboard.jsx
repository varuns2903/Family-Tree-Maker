import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { getInitialTheme, toggleTheme } from "../utils/theme";
import {
  Plus, Trash2, TreePine, Moon, Sun, Bell, Check, X,
  Shield, Users, Eye, Share2, AlertTriangle, User, UploadCloud, FileText, Mail, UserPlus
} from "lucide-react";
import ShareModal from "../components/ShareModal";
import ProfileModal from "../components/ProfileModal";
import toast from "react-hot-toast";

const Dashboard = () => {
  const [isDarkMode, setIsDarkMode] = useState(getInitialTheme());
  const [trees, setTrees] = useState([]);
  const [filteredTrees, setFilteredTrees] = useState([]);
  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState("latest");
  const [user, setUser] = useState(null);
  const [invitations, setInvitations] = useState([]);

  // --- Modal States ---
  const [showModal, setShowModal] = useState(false);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  
  // Share Modal State
  const [sharingData, setSharingData] = useState(null); 
  
  const [deleteTargetTree, setDeleteTargetTree] = useState(null);

  // --- Tree Editing States ---
  const [editingTree, setEditingTree] = useState(null);
  const [newTreeName, setNewTreeName] = useState("");
  const [newTreeDescription, setNewTreeDescription] = useState("");
  const [editTreeName, setEditTreeName] = useState("");
  const [editTreeDescription, setEditTreeDescription] = useState("");

  const [importFile, setImportFile] = useState(null);
  const [modalTab, setModalTab] = useState('create'); 
  const [isImporting, setIsImporting] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    fetchUser();
    fetchTrees();
    fetchInvitations();
  }, []);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [isDarkMode]);

  useEffect(() => {
    filterAndSortTrees();
  }, [trees, search, sortMode]);

  // Filter logic: Only show requests if the CURRENT user is an Owner or Editor
  const pendingRequests = trees.flatMap(tree => {
    if (tree.currentUserRole !== 'owner' && tree.currentUserRole !== 'editor') {
      return [];
    }
    return (tree.collaborators || [])
      .filter(c => c.requestedEdit)
      .map(c => ({ ...c, treeId: tree._id, treeName: tree.name }));
  });

  // Calculate Total Notifications
  const totalNotifications = pendingRequests.length + invitations.length;

  // ✅ AUTO-CLOSE NOTIFICATION MODAL
  useEffect(() => {
    if (showNotifModal && totalNotifications === 0) {
      const timer = setTimeout(() => {
        setShowNotifModal(false);
      }, 400); // 400ms delay for smooth UX
      return () => clearTimeout(timer);
    }
  }, [showNotifModal, totalNotifications]);

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

  const fetchInvitations = async () => {
    try {
      const { data } = await api.get("/auth/invitations"); 
      setInvitations(data);
    } catch (error) {
      console.error("Failed to fetch invitations");
    }
  };

  const handleRespondInvite = async (treeId, accept) => {
    try {
      await api.put(`/trees/${treeId}/invite/respond`, { accept });
      toast.success(accept ? "Joined Tree!" : "Invitation Declined");
      fetchInvitations(); 
      if (accept) fetchTrees(); 
    } catch (error) {
      toast.error("Action failed");
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
    } catch (error) {
      toast.error("Action failed");
    }
  };

  const handleImport = async (e) => {
    e.preventDefault();
    if (!importFile) return toast.error("Please select a file");

    const formData = new FormData();
    formData.append('file', importFile);
    formData.append('treeName', newTreeName || "Imported Tree");

    setIsImporting(true);
    try {
      const { data } = await api.post('/gedcom/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success("Tree imported successfully!");
      resetModal();
      fetchTrees();
    } catch (error) {
      toast.error("Import failed: " + (error.response?.data?.message || error.message));
    } finally {
      setIsImporting(false);
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
    <div className={`min-h-screen p-4 sm:p-8 transition-colors ${isDarkMode ? "bg-gray-900 text-white" : "bg-gradient-to-b from-green-50 to-gray-100 text-gray-900"}`}>

      <div className="max-w-7xl mx-auto">

        {/* --- HEADER --- */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 sm:mb-10 gap-6 md:gap-0">
          <div className="text-center md:text-left w-full md:w-auto">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <TreePine className="w-8 h-8 sm:w-10 sm:h-10 text-green-500" />
              <h1 className="text-3xl sm:text-4xl font-extrabold">Legacy Builder</h1>
            </div>
            <p className="mt-2 text-sm sm:text-base opacity-80">
              Welcome{user ? `, ${user.name}` : ""}! Craft and explore your family history.
            </p>
          </div>

          <div className="flex w-full md:w-auto justify-end items-center gap-2 sm:gap-3">
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-2 sm:px-5 sm:py-3 rounded-xl shadow-md transition text-sm sm:text-base font-medium cursor-pointer"
            >
              <Plus size={20} />
              <span className="hidden sm:inline">New Tree</span>
              <span className="sm:hidden">New</span>
            </button>

            <button
              onClick={() => setShowNotifModal(true)}
              className={`relative p-3 rounded-xl shadow-md transition cursor-pointer ${isDarkMode ? "bg-gray-700 text-white" : "bg-white text-gray-700"}`}
            >
              <Bell size={20} />
              {totalNotifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full animate-bounce">
                  {totalNotifications}
                </span>
              )}
            </button>

            <button
              onClick={() => toggleTheme(isDarkMode, setIsDarkMode)}
              className={`p-3 rounded-xl shadow-md transition cursor-pointer ${isDarkMode ? "bg-gray-700 text-white" : "bg-white text-gray-700"}`}
            >
              {isDarkMode ? <Moon size={18} /> : <Sun size={18} className="text-yellow-500" />}
            </button>

            <button
              onClick={() => setShowProfileModal(true)}
              className={`p-3 rounded-xl shadow-md transition cursor-pointer ${isDarkMode ? "bg-gray-700 text-white" : "bg-white text-gray-700"}`}
            >
              <User size={20} />
            </button>
          </div>
        </div>

        {/* --- SEARCH --- */}
        <div className="flex flex-row gap-2 sm:gap-4 mb-8">
          <input
            type="text"
            placeholder="Search trees..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`flex-1 p-3 w-full rounded-lg border outline-none focus:ring-2 focus:ring-green-500 transition text-sm sm:text-base ${isDarkMode ? "bg-gray-800 text-white border-gray-600" : "bg-white"}`}
          />
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value)}
            className={`w-auto p-3 rounded-lg border outline-none focus:ring-2 focus:ring-green-500 transition text-sm sm:text-base ${isDarkMode ? "bg-gray-800 text-white border-gray-600" : "bg-white"}`}
          >
            <option value="latest" className={isDarkMode ? "bg-gray-800" : ""}>Latest</option>
            <option value="az" className={isDarkMode ? "bg-gray-800" : ""}>A → Z</option>
            <option value="za" className={isDarkMode ? "bg-gray-800" : ""}>Z → A</option>
          </select>
        </div>

        {/* --- EMPTY STATE --- */}
        {!filteredTrees.length && (
          <div className="text-center mt-10 sm:mt-20 opacity-70">
            <TreePine className="w-16 h-16 sm:w-20 sm:h-20 mx-auto" />
            <p className="text-lg mt-4">No family trees yet. Create one or ask for an invite!</p>
          </div>
        )}

        {/* --- TREES GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTrees.map((tree) => {
            const canEdit = tree.currentUserRole === 'owner' || tree.currentUserRole === 'editor';
            const isOwner = tree.currentUserRole === 'owner';

            return (
              <div
                key={tree._id}
                onClick={() => navigate(`/tree/${tree._id}`)}
                className={`group relative p-6 rounded-2xl shadow-md hover:shadow-xl hover:-translate-y-1 border transition cursor-pointer ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white"}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold truncate max-w-[70%]">{tree.name}</h3>

                  <div className="flex gap-2 items-center">
                    {getRoleBadge(tree.currentUserRole)}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSharingData({ id: tree._id, role: tree.currentUserRole });
                      }}
                      className="text-gray-400 hover:text-green-500 transition cursor-pointer ml-1 p-1"
                      title="Share Tree"
                    >
                      <Share2 size={18} />
                    </button>

                    {canEdit && (
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

                    {isOwner && (
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
            );
          })}
        </div>

        {/* --- MODAL (Edit/Create Tree) --- */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className={`p-6 sm:p-8 rounded-2xl w-full max-w-md shadow-lg ${isDarkMode ? "bg-gray-800 text-white" : "bg-white"}`}>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">New Family Tree</h2>
                <div className={`flex rounded-lg p-1 ${isDarkMode ? "bg-gray-700" : "bg-gray-100"}`}>
                  <button
                    onClick={() => setModalTab('create')}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition ${modalTab === 'create' ? (isDarkMode ? 'bg-gray-600 text-white shadow' : 'bg-white text-black shadow') : 'opacity-60'}`}>
                    Create
                  </button>
                  <button
                    onClick={() => setModalTab('import')}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition ${modalTab === 'import' ? (isDarkMode ? 'bg-gray-600 text-white shadow' : 'bg-white text-black shadow') : 'opacity-60'}`}>
                    Import
                  </button>
                </div>
              </div>

              {modalTab === 'create' ? (
                <form onSubmit={editingTree ? updateTree : createTree}>
                  <input
                    type="text"
                    placeholder="Tree Name"
                    value={editingTree ? editTreeName : newTreeName}
                    onChange={(e) => editingTree ? setEditTreeName(e.target.value) : setNewTreeName(e.target.value)}
                    className={`w-full border p-3 rounded-lg mb-3 outline-none focus:ring-2 focus:ring-green-500 ${isDarkMode ? "bg-gray-700 border-gray-600 text-white" : ""}`}
                    required
                  />
                  <textarea
                    placeholder="Short description"
                    rows="3"
                    value={editingTree ? editTreeDescription : newTreeDescription}
                    onChange={(e) => editingTree ? setEditTreeDescription(e.target.value) : setNewTreeDescription(e.target.value)}
                    className={`w-full border p-3 rounded-lg mb-6 outline-none focus:ring-2 focus:ring-green-500 ${isDarkMode ? "bg-gray-700 border-gray-600 text-white" : ""}`}
                  />
                  <div className="flex justify-end gap-3">
                    <button type="button" onClick={resetModal} className={`px-4 py-2 rounded-lg transition ${isDarkMode ? "bg-gray-600 hover:bg-gray-500 text-white" : "bg-gray-200 hover:bg-gray-300 text-gray-800"}`}>Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold">{editingTree ? "Save" : "Create"}</button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleImport}>
                  <input
                    type="text"
                    placeholder="Tree Name (Optional)"
                    value={newTreeName}
                    onChange={(e) => setNewTreeName(e.target.value)}
                    className={`w-full border p-3 rounded-lg mb-4 outline-none focus:ring-2 focus:ring-green-500 ${isDarkMode ? "bg-gray-700 border-gray-600 text-white" : ""}`}
                  />

                  <div className={`border-2 border-dashed rounded-xl p-8 mb-6 text-center cursor-pointer transition hover:bg-opacity-50 flex flex-col items-center justify-center gap-2 relative
            ${isDarkMode ? "border-gray-600 hover:bg-gray-700" : "border-gray-300 hover:bg-gray-50"}`}>
                    <input
                      type="file"
                      accept=".ged"
                      onChange={(e) => setImportFile(e.target.files[0])}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <UploadCloud size={32} className={isDarkMode ? "text-gray-400" : "text-gray-500"} />
                    <p className="text-sm font-medium">{importFile ? importFile.name : "Click to upload .ged file"}</p>
                    <p className="text-xs opacity-50">Standard GEDCOM format supported</p>
                  </div>

                  <div className="flex justify-end gap-3">
                    <button type="button" onClick={resetModal} className={`px-4 py-2 rounded-lg transition ${isDarkMode ? "bg-gray-600 hover:bg-gray-500 text-white" : "bg-gray-200 hover:bg-gray-300 text-gray-800"}`}>Cancel</button>
                    <button type="submit" disabled={isImporting} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50 flex items-center gap-2">
                      {isImporting ? "Importing..." : <><FileText size={18} /> Import</>}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* --- NOTIFICATIONS MODAL (COMBINED) --- */}
        {showNotifModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowNotifModal(false)}>
            <div className={`p-6 rounded-2xl w-full max-w-lg shadow-2xl relative max-h-[85vh] flex flex-col ${isDarkMode ? "bg-gray-800 text-white" : "bg-white"}`} onClick={e => e.stopPropagation()}>
              
              <div className="flex justify-between items-center mb-6 border-b pb-4 dark:border-gray-700">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Bell size={24} className="text-blue-500" /> Notifications
                </h2>
                <button onClick={() => setShowNotifModal(false)} className={`p-2 rounded-full transition ${isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"}`}><X size={20} /></button>
              </div>

              {totalNotifications === 0 ? (
                <div className="text-center py-12 opacity-60 flex flex-col items-center">
                  <div className={`p-4 rounded-full mb-3 ${isDarkMode ? "bg-gray-700" : "bg-gray-100"}`}>
                    <Bell className="w-8 h-8 opacity-50" />
                  </div>
                  <p>No new notifications.</p>
                </div>
              ) : (
                <div className="space-y-6 overflow-y-auto custom-scrollbar pr-2 flex-1">
                  
                  {/* SECTION 1: INVITATIONS (I am invited) */}
                  {invitations.length > 0 && (
                    <div className="space-y-3">
                      <h3 className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Tree Invitations</h3>
                      {invitations.map((invite) => (
                        <div key={invite.tree._id} className={`p-4 rounded-xl border flex flex-col gap-3 ${isDarkMode ? "bg-slate-700/50 border-slate-600" : "bg-blue-50 border-blue-100"}`}>
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-full ${isDarkMode ? "bg-blue-900/50 text-blue-300" : "bg-blue-100 text-blue-600"}`}>
                                <Mail size={18} />
                              </div>
                              <div>
                                <p className="font-bold text-sm">{invite.tree.name}</p>
                                <p className="text-xs opacity-70">Invited by {invite.sender?.name || "Owner"}</p>
                              </div>
                            </div>
                            {getRoleBadge(invite.role)}
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => handleRespondInvite(invite.tree._id, true)} className="flex-1 bg-blue-600 text-white py-1.5 rounded-lg text-sm font-bold hover:bg-blue-700 transition">Accept</button>
                            <button onClick={() => handleRespondInvite(invite.tree._id, false)} className={`flex-1 border py-1.5 rounded-lg text-sm font-bold transition ${isDarkMode ? "border-gray-600 hover:bg-gray-600" : "border-gray-300 hover:bg-gray-100"}`}>Decline</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* SECTION 2: EDIT REQUESTS (Others requesting me) */}
                  {pendingRequests.length > 0 && (
                    <div className="space-y-3">
                      <h3 className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Edit Requests</h3>
                      {pendingRequests.map((req, idx) => (
                        <div key={idx} className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${isDarkMode ? "bg-gray-700/50 border-gray-600" : "bg-gray-50 border-gray-200"}`}>
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${isDarkMode ? "bg-amber-900/50 text-amber-300" : "bg-amber-100 text-amber-600"}`}>
                              <UserPlus size={18} />
                            </div>
                            <div>
                              <p className="font-bold text-sm">{req.user?.name}</p>
                              <p className="text-xs opacity-70">wants to edit <span className="font-semibold">{req.treeName}</span></p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => handleManageRequest(req.treeId, req.user._id, true)} className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition"><Check size={16} /></button>
                            <button onClick={() => handleManageRequest(req.treeId, req.user._id, false)} className="p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition"><X size={16} /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              )}
            </div>
          </div>
        )}

        {/* --- SHARE MODAL --- */}
        {sharingData && (
          <ShareModal
            treeId={sharingData.id}
            currentUserRole={sharingData.role}
            onClose={() => setSharingData(null)}
          />
        )}

        {/* --- PROFILE MODAL --- */}
        {showProfileModal && user && (
          <ProfileModal
            user={user}
            onClose={() => setShowProfileModal(false)}
            onLogout={handleLogout}
            onUpdateUser={setUser}
          />
        )}

        {/* --- DELETE CONFIRMATION MODAL --- */}
        {deleteTargetTree && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] backdrop-blur-sm p-4" onClick={() => setDeleteTargetTree(null)}>
            <div className={`p-8 rounded-3xl w-full max-w-sm shadow-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-gray-100'}`} onClick={e => e.stopPropagation()}>
              <div className="text-center">
                <div className="w-14 h-14 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-5">
                  <AlertTriangle size={28} />
                </div>
                <h3 className="text-xl font-bold mb-2">Delete Tree?</h3>
                <p className={`text-sm mb-8 leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Are you sure you want to delete <b className={isDarkMode ? 'text-white' : 'text-slate-900'}>{deleteTargetTree.name}</b>? <br />
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