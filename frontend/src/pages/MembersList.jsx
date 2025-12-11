import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { ArrowLeft, Search, Filter, Pencil, Trash2, X, Save, Moon, Sun, AlertTriangle } from 'lucide-react'; // Added AlertTriangle
import { FileUploaderRegular } from '@uploadcare/react-uploader';
import '@uploadcare/react-uploader/core.css';
import toast from 'react-hot-toast';
import { getInitialTheme, toggleTheme } from '../utils/theme';

const MembersList = () => {
  const { treeId } = useParams();
  const navigate = useNavigate();

  // Data State
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [treeName, setTreeName] = useState("Tree Members");
  const [userRole, setUserRole] = useState("viewer");
  const [loading, setLoading] = useState(true);

  // Filter State
  const [search, setSearch] = useState("");
  const [filterGender, setFilterGender] = useState("all");

  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(getInitialTheme);

  // Edit Modal State
  const [editingMember, setEditingMember] = useState(null);
  const [formData, setFormData] = useState({});

  // ✅ DELETE MODAL STATE
  const [deleteTarget, setDeleteTarget] = useState(null); // Stores member object to delete

  const DEFAULT_IMG = "https://ucarecdn.com/db931dbd-59c5-4b4d-a86d-79d9791262ce/user.png";

  useEffect(() => {
    fetchData();
  }, [treeId]);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  useEffect(() => {
    filterData();
  }, [members, search, filterGender]);

  const fetchData = async () => {
    try {
      try {
        const treeRes = await api.get(`/trees/${treeId}`);
        setTreeName(treeRes.data.name);
      } catch (e) { }

      const { data } = await api.get(`/trees/${treeId}/members`);
      if (data.role) {
        setUserRole(data.role);
        setMembers(data.members);
      } else {
        setUserRole('owner');
        setMembers(data);
      }
    } catch (error) {
      toast.error("Failed to load members");
    } finally {
      setLoading(false);
    }
  };

  const filterData = () => {
    let res = members.filter(m => m.name.toLowerCase().includes(search.toLowerCase()));
    if (filterGender !== 'all') res = res.filter(m => m.gender === filterGender);
    setFilteredMembers(res);
  };

  const calculateAge = (dob) => {
    if (!dob) return "";
    const diff = Date.now() - new Date(dob).getTime();
    return Math.floor(diff / 31556952000);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // --- ACTIONS ---

  // 1. TRIGGER DELETE MODAL
  const initiateDelete = (member) => {
    setDeleteTarget(member);
  };

  // 2. CONFIRM DELETE API CALL
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/trees/${treeId}/members/${deleteTarget.id}`);
      setMembers(prev => prev.filter(m => m.id !== deleteTarget.id));
      toast.success("Member deleted");
    } catch {
      toast.error("Delete failed");
    } finally {
      setDeleteTarget(null); // Close modal
    }
  };

  const openEditModal = (member) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      gender: member.gender,
      birthDate: member.birthDate || "",
      deathDate: member.deathDate || "",
      isAlive: member.isAlive ?? true,
      img: member.img,
      contactNo: member.contactNo || ""
    });
  };

  const handleSaveEdit = async () => {
    // ✅ VALIDATION: Check Date Logic
    if (formData.birthDate && !formData.isAlive && formData.deathDate) {
      if (new Date(formData.birthDate) > new Date(formData.deathDate)) {
        toast.error("Date Error: Death date cannot be earlier than birth date!");
        return;
      }
    }

    try {
      const payload = {
        ...formData,
        mid: editingMember.mid,
        fid: editingMember.fid,
        pids: editingMember.pids
      };

      await api.put(`/trees/${treeId}/members/${editingMember.id}`, payload);

      setMembers(prev => prev.map(m => m.id === editingMember.id ? { ...m, ...payload } : m));
      setEditingMember(null);
      toast.success("Member updated");
    } catch {
      toast.error("Update failed");
    }
  };

  const canEdit = ['owner', 'editor'].includes(userRole);
  const canDelete = userRole === 'owner';

  return (
    <div className={`min-h-screen p-8 transition-colors ${isDarkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <button
              onClick={() => navigate(`/dashboard`)}
              className={`p-2 rounded-full transition ${isDarkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-200'}`}
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1
                onClick={() => navigate(`/tree/${treeId}`)}
                className={`text-3xl font-bold tracking-tight cursor-pointer transition-colors
                  ${isDarkMode ? 'hover:text-blue-400' : 'hover:text-blue-600'}`}
                title="Open Graph View"
              >
                {treeName}
              </h1>
              <p className="opacity-70 text-sm">{members.length} Members List</p>
            </div>
          </div>

          <button
            onClick={() => toggleTheme(isDarkMode, setIsDarkMode)}
            className={`p-3 rounded-xl shadow-sm transition ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-700'}`}
          >
            {isDarkMode ? <Moon size={20} /> : <Sun size={20} className="text-orange-500" />}
          </button>
        </div>

        {/* Filters */}
        <div className={`p-4 rounded-xl shadow-sm mb-8 flex flex-col md:flex-row gap-4 items-center ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="relative w-full md:flex-1">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              placeholder="Search members..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-lg border outline-none focus:ring-2 focus:ring-blue-500 
                ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200'}`}
            />
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter size={18} className="text-gray-400" />
            <select
              value={filterGender}
              onChange={(e) => setFilterGender(e.target.value)}
              className={`flex-1 md:w-40 p-2 rounded-lg border outline-none cursor-pointer
                ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}
            >
              <option value="all">All Genders</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="text-center py-20 opacity-60">Loading members...</div>
        ) : filteredMembers.length === 0 ? (
          <div className="text-center py-20 opacity-60">No members found.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredMembers.map(member => (
              <div
                key={member.id}
                className={`relative p-5 rounded-2xl shadow-sm border group transition hover:-translate-y-1
                  ${isDarkMode ? 'bg-gray-800 border-gray-700 hover:shadow-lg hover:shadow-gray-900/50' : 'bg-white border-gray-100 hover:shadow-lg'}`}
              >
                {/* --- ACTIONS --- */}
                <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {canEdit && (
                    <button
                      onClick={() => openEditModal(member)}
                      className={`p-1.5 rounded-full shadow-sm transition ${isDarkMode ? 'bg-slate-700 hover:bg-slate-600 text-blue-400' : 'bg-white hover:bg-gray-100 text-blue-600'}`}
                    >
                      <Pencil size={14} />
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => initiateDelete(member)} // ✅ Opens Modal
                      className={`p-1.5 rounded-full shadow-sm transition ${isDarkMode ? 'bg-slate-700 hover:bg-slate-600 text-red-400' : 'bg-white hover:bg-gray-100 text-red-600'}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                <div className="flex flex-col items-center text-center mt-2">
                  <div className="relative">
                    <img
                      src={member.img || DEFAULT_IMG}
                      className="w-20 h-20 rounded-full object-cover mb-3 shadow-sm border-2 border-transparent group-hover:border-blue-500 transition"
                    />
                    <span className={`absolute bottom-3 right-0 w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold
                      ${isDarkMode ? 'border-gray-800' : 'border-white'}
                      ${member.gender === 'male' ? 'bg-blue-100 text-blue-600' : member.gender === 'female' ? 'bg-pink-100 text-pink-600' : 'bg-yellow-100 text-yellow-600'}`}>
                      {member.gender === 'male' ? 'M' : member.gender === 'female' ? 'F' : 'O'}
                    </span>
                  </div>

                  <h3 className="font-bold text-lg truncate w-full">{member.name}</h3>

                  <div className="flex flex-wrap justify-center gap-2 mb-4">
                    <div className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider
                      ${member.isAlive
                        ? (isDarkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700')
                        : (isDarkMode ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-500')}`}>
                      {member.isAlive ? 'Alive' : 'Deceased'}
                    </div>
                  </div>
                  <div className={`text-xs space-y-0.5 mb-4 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    {member.birthDate && (
                      <p>Born: <span className={isDarkMode ? 'text-slate-200' : 'text-slate-700'}>{formatDate(member.birthDate)}</span></p>
                    )}
                    {!member.isAlive && member.deathDate && (
                      <p>Died: <span className={isDarkMode ? 'text-slate-200' : 'text-slate-700'}>{formatDate(member.deathDate)}</span></p>
                    )}
                  </div>

                  <div className="mt-4 w-full pt-4 border-t border-dashed border-gray-200 dark:border-gray-700 flex justify-between text-xs opacity-70">
                    <span>{member.birthDate ? calculateAge(member.birthDate) + ' yrs' : 'Age N/A'}</span>
                    <span>{member.contactNo || 'No Phone'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* --- EDIT MODAL --- */}
        {editingMember && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm" onClick={() => setEditingMember(null)}>
            <div
              className={`p-6 rounded-2xl w-full max-w-md shadow-2xl ${isDarkMode ? 'bg-slate-900 text-white' : 'bg-white'}`}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Edit Profile</h3>
                <button onClick={() => setEditingMember(null)}><X size={24} /></button>
              </div>

              <div className="space-y-4">
                <input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Full Name"
                  className={`w-full border p-3 rounded-lg ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white"}`}
                />

                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className={`w-full border p-3 rounded-lg ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white"}`}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>

                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={formData.isAlive} onChange={(e) => setFormData({ ...formData, isAlive: e.target.checked })} />
                  <span className="text-sm">Is this person alive?</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs opacity-70 block mb-1">Birth Date</label>
                    <input type="date" value={formData.birthDate} onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                      className={`w-full border p-2 rounded-lg ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white"}`} />
                  </div>
                  {!formData.isAlive && (
                    <div>
                      <label className="text-xs opacity-70 block mb-1">Death Date</label>
                      <input type="date" value={formData.deathDate} onChange={(e) => setFormData({ ...formData, deathDate: e.target.value })}
                        className={`w-full border p-2 rounded-lg ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white"}`} />
                    </div>
                  )}
                </div>

                <input
                  value={formData.contactNo}
                  onChange={(e) => setFormData({ ...formData, contactNo: e.target.value })}
                  placeholder="Phone Number"
                  className={`w-full border p-3 rounded-lg ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white"}`}
                />

                <div className={`text-center p-3 rounded-lg ${isDarkMode ? 'bg-slate-800' : 'bg-gray-50'}`}>
                  <FileUploaderRegular pubkey="8adc52d0c4bb04d5e668" classNameUploader="uc-light uc-purple" sourceList="local, facebook"
                    onFileUploadSuccess={(file) => setFormData({ ...formData, img: file.cdnUrl })} />
                </div>

                <button
                  onClick={handleSaveEdit}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 mt-2"
                >
                  <Save size={18} /> Save Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- ✅ DELETE CONFIRMATION MODAL --- */}
        {deleteTarget && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm" onClick={() => setDeleteTarget(null)}>
            <div
              className={`p-6 rounded-2xl w-full max-w-sm shadow-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-gray-100'}`}
              onClick={e => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle size={24} />
                </div>
                <h3 className="text-xl font-bold mb-2">Delete Member?</h3>
                <p className="text-sm opacity-70 mb-6">
                  Are you sure you want to remove <b>{deleteTarget.name}</b>? <br />
                  This will disconnect them from the family tree structure.
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => setDeleteTarget(null)}
                    className={`flex-1 py-2.5 rounded-lg font-medium transition ${isDarkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-gray-100 hover:bg-gray-200'}`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="flex-1 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition shadow-lg shadow-red-500/30"
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

export default MembersList;