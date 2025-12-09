import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { Plus, Trash2, TreePine } from "lucide-react";
import toast from "react-hot-toast";

const Dashboard = () => {
  const [trees, setTrees] = useState([]);
  const [filteredTrees, setFilteredTrees] = useState([]);
  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState("latest");
  const [user, setUser] = useState(null);

  const [showModal, setShowModal] = useState(false);
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
    filterAndSortTrees();
  }, [trees, search, sortMode]);

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
    else
      result.sort((a, b) => b.name.localeCompare(a.name));

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

  const resetModal = () => {
    setShowModal(false);
    setEditingTree(null);
    setNewTreeName("");
    setNewTreeDescription("");
    setEditTreeName("");
    setEditTreeDescription("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-10">
          <div>
            <div className="flex items-center gap-2">
              <TreePine className="w-10 h-10 text-green-600" />
              <h1 className="text-4xl font-extrabold text-slate-800">
                Legacy Builder
              </h1>
            </div>
            <p className="text-slate-600 mt-2">
              Welcome{user ? `, ${user.name}` : ""}! Craft and explore your
              family history.
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-xl shadow-md transition"
          >
            <Plus size={20} /> New Family Tree
          </button>
        </div>

        {/* Search + Sort */}
        <div className="flex gap-4 mb-8">
          <input
            type="text"
            placeholder="Search trees..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="p-3 w-full rounded-lg border"
          />

          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value)}
            className="p-3 rounded-lg border"
          >
            <option value="latest">Latest</option>
            <option value="az">A → Z</option>
            <option value="za">Z → A</option>
          </select>
        </div>

        {/* Empty */}
        {!filteredTrees.length && (
          <div className="text-center text-gray-600 mt-20">
            <TreePine className="w-20 h-20 mx-auto text-green-400 opacity-50" />
            <p className="text-lg mt-4">
              No family trees yet. Create one!
            </p>
          </div>
        )}

        {/* Trees Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTrees.map((tree) => (
            <div
              key={tree._id}
              onClick={() => navigate(`/tree/${tree._id}`)}
              className="group bg-white p-6 rounded-2xl shadow-md hover:shadow-xl hover:-translate-y-1 border transition duration-300 cursor-pointer"
            >
              {/* Name + Actions */}
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-bold text-slate-800">
                  {tree.name}
                </h3>

                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingTree(tree);
                      setEditTreeName(tree.name);
                      setEditTreeDescription(tree.description || "");
                      setShowModal(true);
                    }}
                    className="text-gray-400 hover:text-blue-500 transition cursor-pointer"
                  >
                    ✏️
                  </button>

                  <button
                    onClick={(e) => deleteTree(tree._id, e)}
                    className="text-gray-400 hover:text-red-500 transition cursor-pointer"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {tree.description || "No description available"}
              </p>

              {/* Meta Info */}
              <div className="text-xs text-gray-500">
                <p>Members: {tree.membersCount}</p>
                <p>
                  Updated:{" "}
                  {new Date(tree.updatedAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-8 rounded-2xl w-full max-w-md shadow-lg">
              <h2 className="text-2xl font-bold mb-6">
                {editingTree ? "Edit Family Tree" : "New Family Tree"}
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
                  className="w-full border p-3 rounded-lg mb-3"
                  required
                />

                <textarea
                  placeholder="Short description"
                  rows="3"
                  value={
                    editingTree
                      ? editTreeDescription
                      : newTreeDescription
                  }
                  onChange={(e) =>
                    editingTree
                      ? setEditTreeDescription(e.target.value)
                      : setNewTreeDescription(e.target.value)
                  }
                  className="w-full border p-3 rounded-lg mb-6"
                />

                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={resetModal}
                    className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold"
                  >
                    {editingTree ? "Save Changes" : "Create Tree"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Dashboard;
