import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { getInitialTheme, toggleTheme } from "../utils/theme";
import { Plus, Trash2, TreePine, Moon, Sun, Bell, Check, X, Shield, Users, Eye } from "lucide-react"; 
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

  // Flatten pending requests from owned trees
  const pendingRequests = trees.flatMap(tree => 
    (tree.collaborators || [])
      .filter(c => c.requestedEdit)
      .map(c => ({ ...c, treeId: tree._id, treeName: tree.name }))
  );

  const fetchUser = async () => {
    try {
      const { data } = await api.get("/auth/me");
      setUser(data);
    } catch {}
  };

  const fetchTrees = async () => {
    try {
      const { data } = await api.get("/trees");
      setTrees(data);
    } catch {
      toast.error("Failed to load trees");
    }
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

  const deleteTree = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Delete this tree and all members?")) return;
    try {
      await api.delete(`/trees/${id}`);
      setTrees(trees.filter((t) => t._id !== id));
      toast.success("Tree deleted");
    } catch {
      toast.error("Could not delete tree");
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
      if(pendingRequests.length === 1) setShowNotifModal(false);
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

  // --- HELPER: Role Badge Logic ---
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
    <div className={`min-h-screen p-8 transition-colors ${
      isDarkMode ? "bg-gray-900 text-white" : "bg-gradient-to-b from-green-50 to-gray-100 text-gray-900"
    }`}>
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-10">
          <div>
            <div className="flex items-center gap-2">
              <TreePine className="w-10 h-10 text-green-500" />
              <h1 className="text-4xl font-extrabold">Legacy Builder</h1>
            </div>
            <p className="mt-2">
              Welcome{user ? `, ${user.name}` : ""}! Craft and explore your family history.
            </p>
          </div>

          <div className="flex gap-3">
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

            <button
              onClick={() => toggleTheme(isDarkMode, setIsDarkMode)}
              className={`p-3 rounded-xl shadow-md transition ${
                isDarkMode ? "bg-gray-700 text-white" : "bg-white text-gray-700"
              }`}
            >
              {isDarkMode ? <Moon size={18} /> : <Sun size={18} className="text-yellow-500" />}
            </button>

            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl shadow-md transition"
            >
              <Plus size={20} /> New Tree
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="flex gap-4 mb-8">
          <input
            type="text"
            placeholder="Search trees..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`p-3 w-full rounded-lg border ${
              isDarkMode ? "bg-gray-800 text-white border-gray-600" : "bg-white"
            }`}
          />
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value)}
            className={`p-3 rounded-lg border ${
              isDarkMode ? "bg-gray-800 text-white border-gray-600" : "bg-white"
            }`}
          >
            <option value="latest">Latest</option>
            <option value="az">A → Z</option>
            <option value="za">Z → A</option>
          </select>
        </div>

        {/* Empty State */}
        {!filteredTrees.length && (
          <div className="text-center mt-20 opacity-70">
            <TreePine className="w-20 h-20 mx-auto" />
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
                <h3 className="text-xl font-bold">{tree.name}</h3>

                <div className="flex gap-2 items-center">
                  {/* Role Badge */}
                  {getRoleBadge(tree.currentUserRole)}

                  {/* Actions: Only for Owner or Editor (Edit only) */}
                  {(tree.currentUserRole === 'owner' || tree.currentUserRole === 'editor') && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingTree(tree);
                        setEditTreeName(tree.name);
                        setEditTreeDescription(tree.description || "");
                        setShowModal(true);
                      }}
                      className="text-gray-400 hover:text-blue-500 transition cursor-pointer ml-1"
                    >
                      ✏️
                    </button>
                  )}

                  {/* Delete: Only for Owner */}
                  {tree.currentUserRole === 'owner' && (
                    <button
                      onClick={(e) => deleteTree(tree._id, e)}
                      className="text-gray-400 hover:text-red-500 transition cursor-pointer"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>

              {/* Owner Info (if not me) */}
              {tree.currentUserRole !== 'owner' && tree.ownerId && (
                <p className="text-xs text-gray-500 mb-2">
                  Owned by: <span className="font-semibold">{tree.ownerId.name}</span>
                </p>
              )}

              <p className="text-sm mb-3 opacity-90 line-clamp-2 min-h-[40px]">
                {tree.description || "No description available"}
              </p>

              <div className="text-xs opacity-80 pt-3 border-t border-gray-200 dark:border-gray-700 mt-2 flex justify-between">
                <span>{tree.membersCount} Members</span>
                <span>Updated: {new Date(tree.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>

        {/* --- MODAL (Edit/Create) --- */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className={`p-8 rounded-2xl w-full max-w-md shadow-lg ${
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
                  className={`w-full border p-3 rounded-lg mb-3 ${
                    isDarkMode ? "bg-gray-700 border-gray-600 text-white" : ""
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
                  className={`w-full border p-3 rounded-lg mb-6 ${
                    isDarkMode ? "bg-gray-700 border-gray-600 text-white" : ""
                  }`}
                />
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={resetModal} className={`px-6 py-2 rounded-lg transition ${
                      isDarkMode ? "bg-gray-600 hover:bg-gray-500 text-white" : "bg-gray-200 hover:bg-gray-300 text-gray-800"
                    }`}>
                    Cancel
                  </button>
                  <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold">
                    {editingTree ? "Save Changes" : "Create Tree"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* --- NOTIFICATIONS MODAL --- */}
        {showNotifModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowNotifModal(false)}>
            <div 
              className={`p-6 rounded-2xl w-full max-w-lg shadow-2xl relative ${isDarkMode ? "bg-gray-800 text-white" : "bg-white"}`}
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
                <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                  {pendingRequests.map((req, idx) => (
                    <div key={idx} className={`p-4 rounded-lg border flex justify-between items-center ${isDarkMode ? "bg-gray-700 border-gray-600" : "bg-gray-50 border-gray-200"}`}>
                      <div>
                        <p className="font-bold text-sm sm:text-base">{req.user?.name || "Unknown User"}</p>
                        <p className="text-xs opacity-70 mb-1">{req.user?.email}</p>
                        <p className="text-xs flex items-center gap-1">
                          wants to edit <TreePine size={12} className="text-green-500"/> <span className="font-semibold">{req.treeName}</span>
                        </p>
                      </div>
                      <div className="flex gap-2">
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

      </div>
    </div>
  );
};

export default Dashboard;