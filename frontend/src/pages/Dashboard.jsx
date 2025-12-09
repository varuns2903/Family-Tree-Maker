import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Plus, Trash2, FolderTree } from 'lucide-react';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [trees, setTrees] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newTreeName, setNewTreeName] = useState('');
  const navigate = useNavigate();

  // Fetch Trees on Load
  useEffect(() => {
    fetchTrees();
  }, []);

  const fetchTrees = async () => {
    try {
      const { data } = await api.get('/trees');
      setTrees(data);
    } catch (error) {
      toast.error('Failed to load trees');
    }
  };

  const createTree = async (e) => {
    e.preventDefault();
    try {
      await api.post('/trees', { name: newTreeName });
      setShowModal(false);
      setNewTreeName('');
      fetchTrees();
      toast.success('Tree created!');
    } catch (error) {
      toast.error('Error creating tree');
    }
  };

  const deleteTree = async (id, e) => {
    e.stopPropagation(); // Prevent entering the tree when clicking delete
    if(!window.confirm("Delete this tree and all members?")) return;
    
    try {
      await api.delete(`/trees/${id}`);
      setTrees(trees.filter(t => t._id !== id));
      toast.success('Tree deleted');
    } catch (error) {
      toast.error('Could not delete tree');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-4xl font-bold text-slate-800">My Lineage</h1>
            <p className="text-slate-500 mt-2">Manage your family history projects</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl shadow-lg transition-all"
          >
            <Plus size={20} /> New Tree
          </button>
        </div>

        {/* Grid of Trees */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {trees.map((tree) => (
            <div
              key={tree._id}
              onClick={() => navigate(`/tree/${tree._id}`)}
              className="group bg-white p-6 rounded-2xl shadow-sm hover:shadow-xl border border-gray-100 cursor-pointer transition-all duration-300 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-2 h-full bg-primary transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
              
              <div className="flex justify-between items-start">
                <div className="bg-blue-50 p-3 rounded-lg text-primary mb-4">
                  <FolderTree size={28} />
                </div>
                <button
                  onClick={(e) => deleteTree(tree._id, e)}
                  className="text-gray-300 hover:text-red-500 transition-colors p-2"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              
              <h3 className="text-xl font-bold text-slate-800 mb-2">{tree.name}</h3>
              <p className="text-sm text-gray-400">
                Created: {new Date(tree.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>

        {/* Simple Modal for New Tree */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm z-50">
            <div className="bg-white p-8 rounded-2xl w-full max-w-md shadow-2xl">
              <h2 className="text-2xl font-bold mb-6">Name your project</h2>
              <form onSubmit={createTree}>
                <input
                  autoFocus
                  type="text"
                  placeholder="e.g. The Windsors"
                  value={newTreeName}
                  onChange={(e) => setNewTreeName(e.target.value)}
                  className="w-full border-2 border-gray-200 p-4 rounded-xl text-lg focus:border-primary focus:ring-0 outline-none mb-6"
                />
                <div className="flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-6 py-2 text-gray-500 font-medium hover:bg-gray-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-primary text-white font-medium rounded-lg hover:bg-blue-600"
                  >
                    Create Project
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