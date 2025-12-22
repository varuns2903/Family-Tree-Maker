import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import {
  ArrowLeft, Search, Filter, Pencil, Trash2, X, Save,
  ZoomIn, Calendar, Phone, Info, AlertTriangle, Heart, 
  Grid, Plus
} from "lucide-react";
import { FileUploaderRegular } from "@uploadcare/react-uploader";
import "@uploadcare/react-uploader/core.css";
import toast from "react-hot-toast";
import { getInitialTheme } from "../utils/theme";

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

  // Modals State
  const [viewMember, setViewMember] = useState(null); 
  const [editingMember, setEditingMember] = useState(null); 
  const [deleteTarget, setDeleteTarget] = useState(null); 
  const [previewImage, setPreviewImage] = useState(null); 

  // Form State
  const [formData, setFormData] = useState({});
  const [newFieldKey, setNewFieldKey] = useState("");
  const [newFieldValue, setNewFieldValue] = useState("");

  const DEFAULT_IMG = "https://ucarecdn.com/db931dbd-59c5-4b4d-a86d-79d9791262ce/user.png";
  const canEdit = ["owner", "editor"].includes(userRole);
  const canDelete = ["owner", "editor"].includes(userRole);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [isDarkMode]);

  useEffect(() => {
    fetchData();
  }, [treeId]);

  useEffect(() => {
    filterData();
  }, [members, search, filterGender]);

  const fetchData = async () => {
    try {
      try {
        const treeRes = await api.get(`/trees/${treeId}`);
        setTreeName(treeRes.data.name);
      } catch (e) { console.log(e); }

      const { data } = await api.get(`/trees/${treeId}/members`);
      if (data.role) {
        setUserRole(data.role);
        setMembers(data.members);
      } else {
        setUserRole("owner");
        setMembers(data);
      }
    } catch (error) {
      toast.error("Failed to load members");
    } finally {
      setLoading(false);
    }
  };

  const filterData = () => {
    let res = members.filter((m) =>
      m.name.toLowerCase().includes(search.toLowerCase())
    );
    if (filterGender !== "all")
      res = res.filter((m) => m.gender === filterGender);
    setFilteredMembers(res);
  };

  // --- HELPERS ---
  const calculateAge = (dob) => {
    if (!dob) return "";
    const diff = Date.now() - new Date(dob).getTime();
    return Math.floor(diff / 31556952000);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric", month: "short", year: "numeric",
    });
  };

  const isSameId = (a, b) => {
    if (!a || !b) return false;
    return String(a) === String(b);
  };

  const getRelatives = (targetMember) => {
    if (!targetMember) return { parents: [], spouses: [], children: [] };
    const { mid, fid, pids = [], id, _id } = targetMember;
    const currentId = id || _id;

    return {
      parents: members.filter((n) => isSameId(n.id || n._id, mid) || isSameId(n.id || n._id, fid)),
      spouses: members.filter((n) => pids.some((pid) => isSameId(pid, n.id || n._id))),
      children: members.filter((n) => isSameId(n.fid, currentId) || isSameId(n.mid, currentId)),
    };
  };

  const getAnniversaryDate = (member, spouseId) => {
    if (!member.weddings) return null;
    const record = member.weddings.find((w) => String(w.spouseId) === String(spouseId));
    return record?.date ? formatDate(record.date) : null;
  };

  const getWeddingInputValue = (spouseId) => {
    if (!formData.weddings) return "";
    const record = formData.weddings.find((w) => String(w.spouseId) === String(spouseId));
    return record?.date ? record.date.split("T")[0] : "";
  };

  // --- ACTIONS ---
  const initiateDelete = (member) => {
    setViewMember(null);
    setDeleteTarget(member);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/trees/${treeId}/members/${deleteTarget.id}`);
      setMembers((prev) => prev.filter((m) => m.id !== deleteTarget.id));
      toast.success("Member deleted");
    } catch {
      toast.error("Delete failed");
    } finally {
      setDeleteTarget(null);
    }
  };

  const openEditModal = (member) => {
    setViewMember(null);
    setEditingMember(member);
    setFormData({
      name: member.name,
      gender: member.gender,
      birthDate: member.birthDate ? member.birthDate.split("T")[0] : "",
      deathDate: member.deathDate ? member.deathDate.split("T")[0] : "",
      isAlive: member.isAlive ?? true,
      img: member.img,
      contactNo: member.contactNo || "",
      description: member.description || "",
      weddings: member.weddings || [],
      data: member.data || {},
    });
    setNewFieldKey("");
    setNewFieldValue("");
  };

  const handleCancelEdit = () => {
    setViewMember(editingMember);
    setEditingMember(null);
  };

  // --- CUSTOM FIELD HANDLERS ---
  const handleAddCustomField = () => {
    if (!newFieldKey.trim() || !newFieldValue.trim()) return;
    const safeKey = newFieldKey.trim().replace(/\s+/g, "_").toLowerCase();
    setFormData((prev) => ({ ...prev, data: { ...prev.data, [safeKey]: newFieldValue } }));
    setNewFieldKey("");
    setNewFieldValue("");
  };

  const handleRemoveCustomField = (keyToRemove) => {
    const newData = { ...formData.data };
    delete newData[keyToRemove];
    setFormData((prev) => ({ ...prev, data: newData }));
  };

  const handleCustomFieldChange = (key, value) => {
    setFormData((prev) => ({ ...prev, data: { ...prev.data, [key]: value } }));
  };

  const handleWeddingDateChange = (spouseId, date) => {
    setFormData((prev) => {
      const currentWeddings = prev.weddings ? [...prev.weddings] : [];
      const index = currentWeddings.findIndex((w) => String(w.spouseId) === String(spouseId));
      if (index > -1) currentWeddings[index] = { ...currentWeddings[index], date };
      else currentWeddings.push({ spouseId, date });
      return { ...prev, weddings: currentWeddings };
    });
  };

  const handleSaveEdit = async () => {
    if (formData.birthDate && !formData.isAlive && formData.deathDate) {
      if (new Date(formData.birthDate) > new Date(formData.deathDate)) {
        toast.error("Date Error: Death date cannot be earlier than birth date!");
        return;
      }
    }

    try {
      const payload = { ...formData };
      const { data } = await api.put(`/trees/${treeId}/members/${editingMember.id}`, payload);

      setMembers((prev) =>
        prev.map((m) => (m.id === editingMember.id ? { ...m, ...data } : m))
      );
      
      const updatedMember = { ...editingMember, ...data };
      setEditingMember(null);
      setViewMember(updatedMember);
      
      toast.success("Member updated");
    } catch {
      toast.error("Update failed");
    }
  };

  const handleImageClick = (e, imgUrl) => {
    e.stopPropagation();
    setPreviewImage(imgUrl);
  };

  // Styles
  const inputClass = `w-full p-3 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
    isDarkMode 
      ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500" 
      : "bg-white border-gray-200 text-slate-800 placeholder-gray-400"
  }`;

  const labelClass = `text-xs font-bold uppercase opacity-60 mb-1.5 block ml-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`;

  const viewRelatives = viewMember ? getRelatives(viewMember) : { parents: [], spouses: [], children: [] };

  return (
    <div
      className={`min-h-screen p-4 sm:p-8 transition-all duration-500 ease-in-out
      ${isDarkMode
          ? "bg-slate-900 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-[#0f172a] to-[#062c26] text-slate-100"
          : "bg-stone-50 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-stone-50 via-white to-green-50 text-slate-800"
      }`}
    >
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 sm:mb-8 gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={() => navigate('/dashboard')}
              className={`p-3 rounded-2xl transition shadow-sm border
                ${isDarkMode ? "bg-slate-800 border-slate-700 hover:bg-slate-700 text-white" : "bg-white border-gray-100 hover:bg-white/80 text-slate-700"}`}
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex-1">
              <h1 
                onClick={() => navigate(`/tree/${treeId}`)}
                className="text-2xl sm:text-3xl font-bold tracking-tight cursor-pointer hover:underline decoration-2 underline-offset-4 decoration-blue-500/30 transition-all"
              >
                {treeName}
              </h1>
              <p className={`text-sm font-medium ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                {members.length} Members
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div
          className={`p-2 rounded-2xl shadow-sm border mb-6 sm:mb-8 flex flex-row gap-2 items-center 
          ${isDarkMode ? "bg-slate-800/50 border-slate-700 backdrop-blur-md" : "bg-white/60 border-gray-200 backdrop-blur-md"}`}
        >
          <div className="relative flex-1">
            <Search className={`absolute left-4 top-3.5 ${isDarkMode ? "text-slate-400" : "text-slate-400"}`} size={18} />
            <input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full pl-11 pr-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-green-500 transition
                ${isDarkMode ? "bg-slate-900/50 border-slate-700 text-white placeholder-slate-500" : "bg-white border-gray-200 placeholder-slate-400"}`}
            />
          </div>
          <div className="flex items-center gap-2 w-auto p-1">
            <Filter size={18} className="text-slate-400 hidden md:block" />
            <select
              value={filterGender}
              onChange={(e) => setFilterGender(e.target.value)}
              className={`w-24 sm:w-40 p-3 rounded-xl border outline-none cursor-pointer font-medium transition
                ${isDarkMode ? "bg-slate-900/50 border-slate-700 text-slate-200" : "bg-white border-gray-200 text-slate-700"}`}
            >
              <option value="all" className={isDarkMode ? "bg-slate-900" : ""}>All</option>
              <option value="male" className={isDarkMode ? "bg-slate-900" : ""}>Male</option>
              <option value="female" className={isDarkMode ? "bg-slate-900" : ""}>Female</option>
              <option value="other" className={isDarkMode ? "bg-slate-900" : ""}>Other</option>
            </select>
          </div>
        </div>

        {/* MEMBER GRID */}
        {loading ? (
          <div className="text-center py-24 opacity-60 animate-pulse">Loading members...</div>
        ) : filteredMembers.length === 0 ? (
          <div className="text-center py-24 opacity-60">No members found matching your search.</div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {filteredMembers.map((member) => (
              <div
                key={member.id}
                onClick={() => setViewMember(member)}
                className={`relative p-4 sm:p-6 rounded-2xl sm:rounded-3xl border transition-all duration-300 group hover:-translate-y-1 cursor-pointer
                  ${isDarkMode 
                    ? "bg-slate-800/40 border-slate-700 hover:bg-slate-800 hover:shadow-xl hover:shadow-slate-900/50" 
                    : "bg-white/70 border-white/50 hover:bg-white hover:shadow-xl hover:shadow-blue-900/5"}`}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="relative mb-3 sm:mb-4 group/img">
                    <img
                      src={member.img || DEFAULT_IMG}
                      onClick={(e) => handleImageClick(e, member.img || DEFAULT_IMG)}
                      className={`w-16 h-16 sm:w-24 sm:h-24 rounded-full object-cover shadow-md border-2 sm:border-4 transition-all group-hover:scale-105 cursor-zoom-in
                        ${isDarkMode ? "border-slate-700 group-hover:border-slate-600" : "border-white group-hover:border-blue-50"}`}
                    />
                    <span
                      className={`absolute bottom-0 right-0 sm:bottom-1 sm:right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center text-[8px] sm:text-[10px] font-bold shadow-sm
                      ${isDarkMode ? "border-slate-800" : "border-white"}
                      ${member.gender === "male" ? "bg-blue-500 text-white" : member.gender === "female" ? "bg-pink-500 text-white" : "bg-amber-500 text-white"}`}
                    >
                      {member.gender === "male" ? "M" : member.gender === "female" ? "F" : "O"}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm sm:text-lg truncate w-full mb-1 px-1">{member.name}</h3>

                  <div className={`text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider mb-2
                    ${member.isAlive 
                      ? (isDarkMode ? "bg-green-900/30 text-green-400" : "bg-green-100 text-green-700") 
                      : (isDarkMode ? "bg-slate-700 text-slate-400" : "bg-slate-100 text-slate-500")}`}>
                    {member.isAlive ? "Alive" : "Deceased"}
                  </div>

                  <div className={`w-full pt-2 sm:pt-4 border-t border-dashed flex justify-between text-[10px] sm:text-xs font-medium
                    ${isDarkMode ? "border-slate-700 text-slate-400" : "border-slate-200 text-slate-500"}`}>
                    <span>{member.birthDate ? calculateAge(member.birthDate) + " yrs" : "Age N/A"}</span>
                    <span className="truncate max-w-[60px] sm:max-w-[100px]">{member.contactNo || "No Phone"}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* --- VIEW MEMBER DETAILS MODAL --- */}
        {viewMember && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm p-4" onClick={() => setViewMember(null)}>
            {/* ✅ ADDED: no-scrollbar */}
            <div
              className={`p-6 sm:p-8 rounded-3xl w-full max-w-md shadow-2xl transition-all scale-100 max-h-[90vh] overflow-y-auto no-scrollbar flex flex-col gap-6
                ${isDarkMode ? "bg-slate-900 text-white border border-slate-800" : "bg-white text-slate-900"}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="relative cursor-zoom-in group" onClick={() => setPreviewImage(viewMember.img || DEFAULT_IMG)}>
                    <img src={viewMember.img || DEFAULT_IMG} className={`w-20 h-20 rounded-full object-cover border-4 shadow-md ${isDarkMode ? 'border-slate-800' : 'border-white'}`} />
                    <div className="absolute inset-0 bg-black/20 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                      <ZoomIn size={20} className="text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">{viewMember.name}</h3>
                    <div className={`inline-flex items-center gap-2 text-xs font-bold px-2 py-0.5 rounded-full mt-1 ${isDarkMode ? "bg-slate-800 text-slate-300" : "bg-gray-100 text-gray-600"}`}>
                      <span className="capitalize">{viewMember.gender}</span>
                      <span className="opacity-30">|</span>
                      <span>{viewMember.isAlive ? "Alive" : "Deceased"}</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setViewMember(null)} className={`p-2 rounded-full transition ${isDarkMode ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-500"}`}>
                  <X size={20} />
                </button>
              </div>

              {viewMember.description && (
                <p className={`text-sm text-center opacity-70 italic leading-relaxed px-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  "{viewMember.description}"
                </p>
              )}

              <div className={`p-5 rounded-2xl border space-y-4 ${isDarkMode ? "bg-slate-800/40 border-slate-700" : "bg-slate-50/80 border-slate-200"}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDarkMode ? 'bg-blue-900/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}><Calendar size={18} /></div>
                  <div>
                    <p className="text-[10px] font-bold uppercase opacity-50 tracking-wider">Birth Date</p>
                    <p className="text-sm font-semibold">{viewMember.birthDate ? formatDate(viewMember.birthDate) : "Unknown"} ({viewMember.birthDate ? calculateAge(viewMember.birthDate) : "?"} yrs)</p>
                  </div>
                </div>
                
                {!viewMember.isAlive && (
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDarkMode ? 'bg-slate-700 text-slate-400' : 'bg-slate-200 text-slate-600'}`}><Calendar size={18} /></div>
                    <div>
                      <p className="text-[10px] font-bold uppercase opacity-50 tracking-wider">Death Date</p>
                      <p className="text-sm font-semibold">{viewMember.deathDate ? formatDate(viewMember.deathDate) : "Unknown"}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDarkMode ? 'bg-green-900/20 text-green-400' : 'bg-green-100 text-green-600'}`}><Phone size={18} /></div>
                  <div>
                    <p className="text-[10px] font-bold uppercase opacity-50 tracking-wider">Contact</p>
                    <p className="text-sm font-semibold">{viewMember.contactNo || "N/A"}</p>
                  </div>
                </div>

                {viewMember.data && Object.entries(viewMember.data).length > 0 && (
                   <div className={`pt-3 mt-2 border-t space-y-3 ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                      {Object.entries(viewMember.data).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDarkMode ? 'bg-purple-900/20 text-purple-400' : 'bg-purple-100 text-purple-600'}`}><Info size={18} /></div>
                          <div>
                            <p className="text-[10px] font-bold uppercase opacity-50 tracking-wider capitalize">{key.replace(/_/g, " ")}</p>
                            <p className="text-sm font-semibold">{value}</p>
                          </div>
                        </div>
                      ))}
                   </div>
                )}
              </div>

              <div className="space-y-4">
                  <h3 className={`text-xs font-bold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Family Connections
                  </h3>
                  <div className="grid grid-cols-1 gap-2">
                    {viewRelatives.parents.map((p) => (
                      <div key={p.id} className={`flex items-center gap-3 p-2 rounded-xl border ${isDarkMode ? "bg-blue-900/10 border-blue-900/30" : "bg-blue-50 border-blue-100"}`}>
                        <img src={p.img || DEFAULT_IMG} className="w-10 h-10 rounded-full object-cover" />
                        <div>
                          <p className="font-bold text-sm">{p.name}</p>
                          <p className={`text-xs font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>Parent</p>
                        </div>
                      </div>
                    ))}

                    {viewRelatives.spouses.map((s) => {
                      const anniversary = getAnniversaryDate(viewMember, s.id);
                      return (
                        <div key={s.id} className={`flex items-center gap-3 p-2 rounded-xl border ${isDarkMode ? "bg-pink-900/10 border-pink-900/30" : "bg-pink-50 border-pink-100"}`}>
                          <div className="relative">
                            <img src={s.img || DEFAULT_IMG} className="w-10 h-10 rounded-full object-cover" />
                            <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-800 rounded-full p-0.5 shadow-sm">
                              <Heart size={10} className="text-pink-500 fill-current" />
                            </div>
                          </div>
                          <div>
                            <p className="font-bold text-sm">{s.name}</p>
                            <p className={`text-xs font-bold flex items-center gap-1 ${isDarkMode ? 'text-pink-400' : 'text-pink-600'}`}>
                              Spouse {anniversary && <span className="opacity-70 text-[10px] font-normal">• Wed: {anniversary}</span>}
                            </p>
                          </div>
                        </div>
                      );
                    })}

                    {viewRelatives.children.map((c) => (
                      <div key={c.id} className={`flex items-center gap-3 p-2 rounded-xl border ${isDarkMode ? "bg-emerald-900/10 border-emerald-900/30" : "bg-emerald-50 border-emerald-100"}`}>
                        <img src={c.img || DEFAULT_IMG} className="w-10 h-10 rounded-full object-cover" />
                        <div>
                          <p className="font-bold text-sm">{c.name}</p>
                          <p className={`text-xs font-bold ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>Child</p>
                        </div>
                      </div>
                    ))}

                    {!viewRelatives.parents.length && !viewRelatives.spouses.length && !viewRelatives.children.length && (
                      <div className={`text-sm text-center py-6 border border-dashed rounded-xl ${isDarkMode ? 'border-slate-700 text-slate-500' : 'border-slate-200 text-slate-400'}`}>
                        No relatives connected.
                      </div>
                    )}
                  </div>
              </div>

              {(canEdit || canDelete) && (
                <div className={`grid grid-cols-2 gap-3 pt-4 border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                  {canEdit && (
                    <button onClick={() => openEditModal(viewMember)} className={`flex items-center justify-center gap-2 p-3 rounded-xl font-bold transition ${isDarkMode ? "bg-blue-900/30 text-blue-400 hover:bg-blue-900/50" : "bg-blue-50 text-blue-600 hover:bg-blue-100"}`}>
                      <Pencil size={16} /> Edit
                    </button>
                  )}
                  {canDelete && (
                    <button onClick={() => initiateDelete(viewMember)} className={`flex items-center justify-center gap-2 p-3 rounded-xl font-bold transition ${isDarkMode ? "bg-red-900/30 text-red-400 hover:bg-red-900/50" : "bg-red-50 text-red-600 hover:bg-red-100"}`}>
                      <Trash2 size={16} /> Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- IMAGE LIGHTBOX --- */}
        {previewImage && (
          <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setPreviewImage(null)}>
            <div className="relative max-w-4xl max-h-screen">
              <img src={previewImage} className="max-w-full max-h-[85vh] rounded-lg shadow-2xl object-contain" onClick={(e) => e.stopPropagation()} />
              <button onClick={() => setPreviewImage(null)} className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition">
                <X size={32} />
              </button>
            </div>
          </div>
        )}

        {/* --- EDIT MODAL (FULL) --- */}
        {editingMember && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm p-4" onClick={() => setEditingMember(null)}>
            {/* ✅ ADDED: no-scrollbar here too */}
            <div className={`p-6 sm:p-8 rounded-3xl w-full max-w-md shadow-2xl transition-all scale-100 max-h-[90vh] overflow-y-auto no-scrollbar ${isDarkMode ? "bg-slate-900 text-white border border-slate-800" : "bg-white text-slate-900"}`} onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Edit Profile</h3>
                <button onClick={() => setEditingMember(null)} className={`p-2 rounded-full transition ${isDarkMode ? "hover:bg-slate-800 text-slate-400" : "hover:bg-slate-100 text-slate-500"}`}>
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                
                <div className="flex justify-center mb-6">
                  <div className="relative group cursor-pointer" onClick={() => setShowImgModal(true)}>
                    <img
                      src={formData.img || DEFAULT_IMG}
                      className={`w-24 h-24 rounded-full object-cover border-4 shadow-xl ${isDarkMode ? 'border-slate-800' : 'border-white'}`}
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full opacity-0 group-hover:opacity-100 transition">
                      <ZoomIn className="text-white" size={20} />
                    </div>
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Full Name</label>
                  <input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={inputClass} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className={labelClass}>Gender</label>
                     <select value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })} className={inputClass}>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Birth Date</label>
                    <input type="date" value={formData.birthDate} onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })} className={inputClass} />
                  </div>
                </div>

                <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <input type="checkbox" checked={formData.isAlive} onChange={(e) => setFormData({ ...formData, isAlive: e.target.checked })} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                  <span className="text-sm font-bold">Is this person alive?</span>
                </label>

                {!formData.isAlive && (
                  <div>
                    <label className={labelClass}>Death Date</label>
                    <input type="date" value={formData.deathDate} onChange={(e) => setFormData({ ...formData, deathDate: e.target.value })} className={inputClass} />
                  </div>
                )}

                <div>
                  <label className={labelClass}>Contact Number</label>
                  <input value={formData.contactNo} onChange={(e) => setFormData({ ...formData, contactNo: e.target.value })} placeholder="Phone" className={inputClass} />
                </div>

                <div>
                  <label className={labelClass}>Bio / Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Add career info, memories..."
                    className={inputClass}
                    rows="3"
                  />
                </div>

                {/* Spouses Wedding Dates */}
                {editingMember.pids && editingMember.pids.length > 0 && (
                  <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    <label className={`text-xs font-bold uppercase mb-3 block flex items-center gap-1 ${isDarkMode ? 'text-pink-400' : 'text-pink-600'}`}>
                      <Heart size={12} className="fill-current" /> Wedding Dates
                    </label>
                    <div className="space-y-3">
                      {editingMember.pids.map((pid) => {
                        const spouse = members.find((m) => isSameId(m.id || m._id, pid));
                        if (!spouse) return null;
                        return (
                          <div key={pid} className={`flex items-center justify-between p-2 rounded-lg border ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                            <div className="flex items-center gap-2">
                              <img src={spouse.img || DEFAULT_IMG} className="w-8 h-8 rounded-full object-cover" />
                              <span className="text-sm font-bold truncate max-w-[100px]">{spouse.name}</span>
                            </div>
                            <input
                              type="date"
                              className={`p-1.5 text-xs rounded border outline-none ${isDarkMode ? 'bg-slate-800 border-slate-600 text-white' : 'bg-slate-50 border-slate-300'}`}
                              value={getWeddingInputValue(pid)}
                              onChange={(e) => handleWeddingDateChange(pid, e.target.value)}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Custom Fields */}
                <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <label className={`text-xs font-bold uppercase mb-3 block flex items-center gap-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    <Grid size={12} /> Custom Details
                  </label>
                  <div className="space-y-3 mb-4">
                    {formData.data && Object.entries(formData.data).map(([key, value]) => (
                      <div key={key} className="flex gap-2 items-center">
                        <div className="flex-1">
                          <label className="text-[10px] font-bold uppercase opacity-50 block mb-1">{key.replace(/_/g, " ")}</label>
                          <input
                            className={`w-full p-2 text-sm rounded-lg border ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}
                            value={value}
                            onChange={(e) => handleCustomFieldChange(key, e.target.value)}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveCustomField(key)}
                          className={`p-2 rounded-lg self-end mb-0.5 transition ${isDarkMode ? 'text-red-400 hover:bg-red-900/30' : 'text-red-500 hover:bg-red-50'}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  <div className={`flex gap-2 items-end p-2 rounded-lg border border-dashed ${isDarkMode ? 'border-slate-600 bg-slate-900/50' : 'border-slate-300 bg-white'}`}>
                    <div className="flex-1 space-y-2">
                      <input
                        placeholder="Label (e.g. Birth Place)"
                        className={`w-full p-2 text-xs rounded border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}
                        value={newFieldKey}
                        onChange={(e) => setNewFieldKey(e.target.value)}
                      />
                      <input
                        placeholder="Value (e.g. London)"
                        className={`w-full p-2 text-sm rounded border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}
                        value={newFieldValue}
                        onChange={(e) => setNewFieldValue(e.target.value)}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddCustomField}
                      className={`p-2 rounded-lg mb-0.5 ${isDarkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-50 text-blue-600'}`}
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                </div>

                <div className={`text-center p-4 rounded-xl border border-dashed ${isDarkMode ? "bg-slate-800/50 border-slate-700" : "bg-slate-50 border-slate-200"}`}>
                  <FileUploaderRegular pubkey="8adc52d0c4bb04d5e668" classNameUploader={`uc-purple ${isDarkMode ? "uc-dark" : "uc-light"}`} sourceList="local, facebook" onFileUploadSuccess={(file) => setFormData({ ...formData, img: file.cdnUrl })} />
                </div>

                <div className="flex gap-3 mt-4">
                  <button 
                    onClick={handleCancelEdit} 
                    className={`flex-1 font-bold py-3.5 rounded-xl transition ${isDarkMode ? "bg-slate-800 hover:bg-slate-700 text-slate-300" : "bg-gray-100 hover:bg-gray-200 text-gray-600"}`}
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSaveEdit} 
                    className="flex-[2] bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.02]"
                  >
                    <Save size={18} /> Save
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- DELETE MODAL --- */}
        {deleteTarget && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm p-4" onClick={() => setDeleteTarget(null)}>
            <div className={`p-8 rounded-3xl w-full max-w-sm shadow-2xl border ${isDarkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-gray-100"}`} onClick={(e) => e.stopPropagation()}>
              <div className="text-center">
                <div className="w-14 h-14 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-5">
                  <AlertTriangle size={28} />
                </div>
                <h3 className="text-xl font-bold mb-2">Delete Member?</h3>
                <p className={`text-sm mb-8 leading-relaxed ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                  Are you sure you want to remove <b className={isDarkMode ? "text-white" : "text-slate-900"}>{deleteTarget.name}</b>? <br />
                  This will disconnect them from the family tree structure.
                </p>

                <div className="flex gap-3">
                  <button onClick={() => setDeleteTarget(null)} className={`flex-1 py-3 rounded-xl font-medium transition ${isDarkMode ? "bg-slate-800 hover:bg-slate-700 text-slate-300" : "bg-slate-100 hover:bg-slate-200 text-slate-600"}`}>Cancel</button>
                  <button onClick={confirmDelete} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition shadow-lg shadow-red-500/30">Delete</button>
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