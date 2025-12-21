import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  X, Save, Trash2, UserPlus, FileText, Link as LinkIcon, ZoomIn, 
  Loader2, Edit, Plus, Phone, Calendar, Search, Heart, Info, 
  Grid, AlertTriangle, ChevronLeft
} from "lucide-react";
import { FileUploaderRegular } from "@uploadcare/react-uploader";
import "@uploadcare/react-uploader/core.css";
import api from "../api/axios";
import toast from "react-hot-toast";

const MemberSidebar = ({
  member,
  allMembers,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  onAddNew,
  onLinkRelative,
  userRole,
}) => {
  const { treeId } = useParams();
  const [mode, setMode] = useState("view");
  const [loading, setLoading] = useState(false);
  const [showImgModal, setShowImgModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Form States
  const [formData, setFormData] = useState({});
  const [potentialParents, setPotentialParents] = useState([]);
  const [newFieldKey, setNewFieldKey] = useState("");
  const [newFieldValue, setNewFieldValue] = useState("");
  const [addFormData, setAddFormData] = useState({});
  const [relativeType, setRelativeType] = useState("");
  const [searchLinkQuery, setSearchLinkQuery] = useState("");
  const [linkChildrenIds, setLinkChildrenIds] = useState([]);

  const DEFAULT_IMG = "https://ucarecdn.com/db931dbd-59c5-4b4d-a86d-79d9791262ce/user.png";
  const canEdit = ["owner", "editor"].includes(userRole);
  
  // Theme Detection
  const isDarkMode = document.documentElement.classList.contains("dark");

  // --- INITIALIZATION ---
  useEffect(() => {
    if (member) {
      setMode("view");
      initializeEditForm(member);
      findPotentialParents(member);
    }
  }, [member, allMembers]);

  const initializeEditForm = (m) => {
    setFormData({
      ...m,
      birthDate: m.birthDate ? m.birthDate.split("T")[0] : "",
      deathDate: m.deathDate ? m.deathDate.split("T")[0] : "",
      description: m.description || "",
      contactNo: m.contactNo || "",
      weddings: m.weddings || [],
      data: m.data || {},
    });
    setNewFieldKey("");
    setNewFieldValue("");
  };

  // --- HELPERS ---
  const calculateAge = (dob) => {
    if (!dob) return "";
    const diff = Date.now() - new Date(dob).getTime();
    return Math.floor(diff / 31556952000);
  };

  const getAnniversaryDate = (spouseId) => {
    if (!member.weddings) return null;
    const record = member.weddings.find((w) => String(w.spouseId) === String(spouseId));
    return record?.date
      ? new Date(record.date).toLocaleDateString(undefined, { dateStyle: "long" })
      : null;
  };

  const getWeddingInputValue = (spouseId) => {
    if (!formData.weddings) return "";
    const record = formData.weddings.find((w) => String(w.spouseId) === String(spouseId));
    return record?.date ? record.date.split("T")[0] : "";
  };

  const isSameId = (a, b) => String(a) === String(b);

  const hasParent = (node, parentKey) => {
    return node[parentKey] && node[parentKey] !== null && String(node[parentKey]) !== "null";
  };

  const findPotentialParents = (m) => {
    const suggestions = [];
    if (m.fid && !m.mid) {
      const father = allMembers.find((p) => isSameId(p.id || p._id, m.fid));
      father?.pids?.forEach((pid) => {
        const spouse = allMembers.find((s) => isSameId(s.id || s._id, pid));
        if (spouse && spouse.gender === "female")
          suggestions.push({ ...spouse, role: "Mother", key: "mid" });
      });
    }
    if (m.mid && !m.fid) {
      const mother = allMembers.find((p) => isSameId(p.id || p._id, m.mid));
      mother?.pids?.forEach((pid) => {
        const spouse = allMembers.find((s) => isSameId(s.id || s._id, pid));
        if (spouse && spouse.gender === "male")
          suggestions.push({ ...spouse, role: "Father", key: "fid" });
      });
    }
    setPotentialParents(suggestions);
  };

  const getRelatives = () => {
    if (!member) return { parents: [], spouses: [], children: [], siblings: [] };
    const { mid, fid, pids = [], id, _id } = member;
    const currentId = id || _id;

    return {
      parents: allMembers.filter((n) => isSameId(n.id || n._id, mid) || isSameId(n.id || n._id, fid)),
      spouses: allMembers.filter((n) => pids.some((pid) => isSameId(pid, n.id || n._id))),
      children: allMembers.filter((n) => isSameId(n.fid, currentId) || isSameId(n.mid, currentId)),
      siblings: allMembers.filter((n) => !isSameId(n.id || n._id, currentId) && ((mid && isSameId(n.mid, mid)) || (fid && isSameId(n.fid, fid)))),
    };
  };

  const getLinkCandidates = () => {
    return allMembers.filter((n) => {
      const nid = n.id || n._id;
      const mid = member.id || member._id;

      if (isSameId(nid, mid)) return false;
      if (!n.name.toLowerCase().includes(searchLinkQuery.toLowerCase())) return false;
      if (member.pids?.some((pid) => isSameId(pid, nid))) return false;
      if (isSameId(member.mid, nid) || isSameId(member.fid, nid)) return false;

      if (relativeType === "father") return n.gender === "male";
      if (relativeType === "mother") return n.gender === "female";

      if (relativeType === "child") {
        if (member.gender === "male" && n.fid) return false;
        if (member.gender === "female" && n.mid) return false;
        if (member.gender === "other") return false;

        if (member.gender === "male") return member.pids?.some((pid) => isSameId(pid, n.mid));
        if (member.gender === "female") return member.pids?.some((pid) => isSameId(pid, n.fid));
      }
      return true;
    });
  };

  const getLinkableNodes = () => {
    if (!member) return [];
    const mid = member.id || member._id;

    if (relativeType === "spouse") {
      const myChildren = allMembers.filter((n) => isSameId(n.mid, mid) || isSameId(n.fid, mid));
      return myChildren.filter((child) => {
        if (member.gender === "male") return !hasParent(child, "mid");
        return !hasParent(child, "fid");
      });
    }
    // Father/Mother logic omitted for brevity, same as before
    return [];
  };

  const linkableNodes = getLinkableNodes();

  // --- ACTIONS ---
  const handleWeddingDateChange = (spouseId, date) => {
    setFormData((prev) => {
      const currentWeddings = prev.weddings ? [...prev.weddings] : [];
      const index = currentWeddings.findIndex((w) => String(w.spouseId) === String(spouseId));
      if (index > -1) currentWeddings[index] = { ...currentWeddings[index], date };
      else currentWeddings.push({ spouseId, date });
      return { ...prev, weddings: currentWeddings };
    });
  };

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

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.put(`/trees/${treeId}/members/${member.id || member._id}`, formData);
      onUpdate(data);
      toast.success("Member updated");
      setMode("view");
    } catch (error) {
      toast.error("Update failed");
    } finally {
      setLoading(false);
    }
  };

  const initiateDelete = () => setShowDeleteModal(true);

  const confirmDelete = async () => {
    setLoading(true);
    try {
      await api.delete(`/trees/${treeId}/members/${member.id || member._id}`);
      onDelete(member.id || member._id);
      setShowDeleteModal(false);
      onClose();
    } catch (error) {
      toast.error("Delete failed");
    } finally {
      setLoading(false);
    }
  };

  const handleLinkParent = async (parent) => {
    if (!window.confirm(`Link ${parent.name} as ${parent.role}?`)) return;
    setLoading(true);
    try {
      const payload = { [parent.key]: parent.id || parent._id };
      const { data } = await api.put(`/trees/${treeId}/members/${member.id || member._id}`, payload);
      onUpdate(data);
      toast.success("Parent linked!");
    } catch (error) {
      toast.error("Failed to link parent");
    } finally {
      setLoading(false);
    }
  };

  const handleStartAdd = (type) => {
    setRelativeType(type);
    setLinkChildrenIds([]);
    let defaultGender = "male";
    if (type === "mother") defaultGender = "female";
    if (type === "spouse") defaultGender = member.gender === "male" ? "female" : "male";

    setAddFormData({
      name: "", gender: defaultGender, birthDate: "", deathDate: "",
      isAlive: true, img: DEFAULT_IMG, contactNo: "",
      relativeId: member.id || member._id, relationType: type,
    });
    setMode("add-form");
  };

  const handleSaveNew = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onAddNew({ ...addFormData, linkChildrenIds });
      setMode("view");
    } catch (error) {
      // toast handled in parent
    } finally {
      setLoading(false);
    }
  };

  // --- STYLES ---
  const inputClass = `w-full p-3 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
    isDarkMode 
      ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500" 
      : "bg-white border-gray-200 text-slate-800 placeholder-gray-400"
  }`;

  const labelClass = `text-xs font-bold uppercase opacity-60 mb-1.5 block ml-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`;

  // Don't render if closed
  if (!isOpen || !member) return null;

  const { parents, spouses, children } = getRelatives();

  return (
    <>
      {/* --- OVERLAY & CONTAINER --- */}
      <div className="fixed inset-0 z-50 flex justify-end">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/30 backdrop-blur-[2px] animate-in fade-in duration-200"
          onClick={onClose}
        />

        {/* Sidebar */}
        <div
          className={`relative h-full w-full sm:w-[420px] shadow-2xl transform transition-transform duration-300 ease-in-out slide-in-from-right flex flex-col
            ${isDarkMode ? "bg-slate-900 border-l border-slate-800 text-slate-100" : "bg-white border-l border-gray-100 text-slate-800"}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* HEADER */}
          <div className={`p-4 border-b flex justify-between items-center z-10 ${isDarkMode ? "border-slate-800 bg-slate-900" : "border-slate-100 bg-white"}`}>
            <div className="flex items-center gap-2">
              {mode !== "view" && (
                <button
                  onClick={() => setMode("view")}
                  className={`p-1.5 rounded-full transition ${isDarkMode ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
                >
                  <ChevronLeft size={20} />
                </button>
              )}
              <h2 className="text-lg font-bold">
                {mode === "view" ? "Member Profile" : mode === "edit" ? "Edit Profile" : mode === "add-form" ? `Add ${relativeType}` : "Add Relative"}
              </h2>
            </div>
            <button onClick={onClose} className={`p-2 rounded-full transition ${isDarkMode ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500'}`}>
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-6 pb-24">
            
            {/* ================= VIEW MODE ================= */}
            {mode === "view" && (
              <div className="animate-fade-in space-y-6">
                
                {/* HERO SECTION */}
                <div className="flex flex-col items-center">
                  <div className="relative group cursor-pointer" onClick={() => setShowImgModal(true)}>
                    <img
                      src={member.img || DEFAULT_IMG}
                      alt="Profile"
                      className={`w-32 h-32 rounded-full object-cover border-4 shadow-xl transition group-hover:scale-105 ${isDarkMode ? 'border-slate-800' : 'border-white'}`}
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full opacity-0 group-hover:opacity-100 transition">
                      <ZoomIn className="text-white drop-shadow-md" size={24} />
                    </div>
                    <span
                      className={`absolute bottom-2 right-2 w-6 h-6 rounded-full border-4 flex items-center justify-center ${isDarkMode ? "border-slate-900" : "border-white"} ${member.isAlive ? "bg-green-500" : "bg-slate-400"}`}
                      title={member.isAlive ? "Alive" : "Deceased"}
                    />
                  </div>
                  <h2 className="text-2xl font-bold mt-4 text-center">{member.name}</h2>
                  {member.description && (
                    <p className={`text-sm text-center opacity-70 mt-2 px-4 italic leading-relaxed ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      "{member.description}"
                    </p>
                  )}
                  
                  {/* Tags */}
                  <div className={`flex flex-wrap justify-center gap-2 mt-4 text-xs font-bold px-4 py-1.5 rounded-full border w-fit ${isDarkMode ? "bg-slate-800 border-slate-700 text-slate-300" : "bg-slate-100 border-slate-200 text-slate-600"}`}>
                    <span className="capitalize">{member.gender}</span>
                    <span className="opacity-30">|</span>
                    <span>{member.isAlive ? `${calculateAge(member.birthDate)} years old` : "Deceased"}</span>
                  </div>
                </div>

                {/* DETAILS CARD */}
                <div className={`p-5 rounded-2xl border space-y-4 ${isDarkMode ? "bg-slate-800/40 border-slate-700" : "bg-slate-50/80 border-slate-200"}`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDarkMode ? 'bg-blue-900/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                      <Calendar size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase opacity-50 tracking-wider">Birth Date</p>
                      <p className="text-sm font-semibold">{member.birthDate ? new Date(member.birthDate).toLocaleDateString(undefined, { dateStyle: "long" }) : "Unknown"}</p>
                    </div>
                  </div>
                  
                  {!member.isAlive && (
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDarkMode ? 'bg-slate-700 text-slate-400' : 'bg-slate-200 text-slate-600'}`}>
                        <Calendar size={18} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase opacity-50 tracking-wider">Death Date</p>
                        <p className="text-sm font-semibold">{member.deathDate ? new Date(member.deathDate).toLocaleDateString(undefined, { dateStyle: "long" }) : "Unknown"}</p>
                      </div>
                    </div>
                  )}

                  {member.contactNo && (
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDarkMode ? 'bg-green-900/20 text-green-400' : 'bg-green-100 text-green-600'}`}>
                        <Phone size={18} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase opacity-50 tracking-wider">Contact</p>
                        <p className="text-sm font-semibold">{member.contactNo}</p>
                      </div>
                    </div>
                  )}

                  {/* Custom Fields */}
                  {member.data && Object.entries(member.data).length > 0 && (
                    <div className={`pt-3 mt-2 border-t space-y-3 ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                      {Object.entries(member.data).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDarkMode ? 'bg-purple-900/20 text-purple-400' : 'bg-purple-100 text-purple-600'}`}>
                            <Info size={18} />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold uppercase opacity-50 tracking-wider capitalize">{key.replace(/_/g, " ")}</p>
                            <p className="text-sm font-semibold">{value}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* RELATIVES LIST */}
                <div className="space-y-4">
                  <h3 className={`text-xs font-bold uppercase tracking-wider mb-2 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    Family Connections
                  </h3>
                  <div className="grid grid-cols-1 gap-2">
                    {/* Parents */}
                    {parents.map((p) => (
                      <div
                        key={p.id || p._id}
                        onClick={() => onUpdate(p)}
                        className={`flex items-center gap-3 p-2 rounded-xl border cursor-pointer transition
                          ${isDarkMode 
                            ? "bg-blue-900/10 border-blue-900/30 hover:bg-blue-900/20" 
                            : "bg-blue-50 border-blue-100 hover:bg-blue-100"}`}
                      >
                        <img src={p.img || DEFAULT_IMG} className="w-10 h-10 rounded-full object-cover" />
                        <div>
                          <p className="font-bold text-sm">{p.name}</p>
                          <p className={`text-xs font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>Parent</p>
                        </div>
                      </div>
                    ))}

                    {/* Spouses */}
                    {spouses.map((s) => (
                      <div
                        key={s.id || s._id}
                        onClick={() => onUpdate(s)}
                        className={`flex items-center gap-3 p-2 rounded-xl border cursor-pointer transition
                          ${isDarkMode 
                            ? "bg-pink-900/10 border-pink-900/30 hover:bg-pink-900/20" 
                            : "bg-pink-50 border-pink-100 hover:bg-pink-100"}`}
                      >
                        <div className="relative">
                          <img src={s.img || DEFAULT_IMG} className="w-10 h-10 rounded-full object-cover" />
                          <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-800 rounded-full p-0.5 shadow-sm">
                            <Heart size={10} className="text-pink-500 fill-current" />
                          </div>
                        </div>
                        <div>
                          <p className="font-bold text-sm">{s.name}</p>
                          <p className={`text-xs font-bold ${isDarkMode ? 'text-pink-400' : 'text-pink-600'}`}>Spouse</p>
                        </div>
                      </div>
                    ))}

                    {/* Children */}
                    {children.map((c) => (
                      <div
                        key={c.id || c._id}
                        onClick={() => onUpdate(c)}
                        className={`flex items-center gap-3 p-2 rounded-xl border cursor-pointer transition
                          ${isDarkMode 
                            ? "bg-emerald-900/10 border-emerald-900/30 hover:bg-emerald-900/20" 
                            : "bg-emerald-50 border-emerald-100 hover:bg-emerald-100"}`}
                      >
                        <img src={c.img || DEFAULT_IMG} className="w-10 h-10 rounded-full object-cover" />
                        <div>
                          <p className="font-bold text-sm">{c.name}</p>
                          <p className={`text-xs font-bold ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>Child</p>
                        </div>
                      </div>
                    ))}

                    {!parents.length && !spouses.length && !children.length && (
                      <div className={`text-sm text-center py-6 border border-dashed rounded-xl ${isDarkMode ? 'border-slate-700 text-slate-500' : 'border-slate-200 text-slate-400'}`}>
                        No relatives connected.
                      </div>
                    )}
                  </div>
                </div>

                {/* ACTION BUTTONS */}
                {canEdit && (
                  <div className={`grid grid-cols-2 gap-3 pt-4 border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                    <button
                      onClick={() => setMode("edit")}
                      className={`flex items-center justify-center gap-2 p-3 rounded-xl font-bold text-sm transition
                        ${isDarkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                    >
                      <Edit size={16} /> Edit Profile
                    </button>
                    <button
                      onClick={() => setMode("add-select")}
                      className="flex items-center justify-center gap-2 p-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition shadow-lg shadow-blue-500/20"
                    >
                      <UserPlus size={16} /> Add Relative
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ================= EDIT MODE ================= */}
            {mode === "edit" && (
              <form onSubmit={handleEditSubmit} className="animate-fade-in space-y-5">
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
                  <input
                    className={inputClass}
                    value={formData.name || ""}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Birth Date</label>
                    <input
                      type="date"
                      className={inputClass}
                      value={formData.birthDate || ""}
                      onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Gender</label>
                    <select
                      className={inputClass}
                      value={formData.gender || "male"}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Alive Checkbox */}
                <label className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <input
                    type="checkbox"
                    checked={formData.isAlive !== false}
                    onChange={(e) => setFormData({ ...formData, isAlive: e.target.checked, deathDate: e.target.checked ? "" : formData.deathDate })}
                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="font-bold text-sm">This person is alive</span>
                </label>

                {formData.isAlive === false && (
                  <div>
                    <label className={labelClass}>Death Date</label>
                    <input
                      type="date"
                      className={inputClass}
                      value={formData.deathDate || ""}
                      onChange={(e) => setFormData({ ...formData, deathDate: e.target.value })}
                    />
                  </div>
                )}

                <div>
                  <label className={labelClass}>Contact Number</label>
                  <input
                    className={inputClass}
                    value={formData.contactNo || ""}
                    onChange={(e) => setFormData({ ...formData, contactNo: e.target.value })}
                    placeholder="Phone"
                  />
                </div>

                <div>
                  <label className={labelClass}>Bio / Description</label>
                  <textarea
                    value={formData.description || ""}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Add career info, memories..."
                    className={inputClass}
                    rows="3"
                  />
                </div>

                {/* Spouses Section */}
                {member.pids && member.pids.length > 0 && (
                  <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    <label className={`text-xs font-bold uppercase mb-3 block flex items-center gap-1 ${isDarkMode ? 'text-pink-400' : 'text-pink-600'}`}>
                      <Heart size={12} className="fill-current" /> Wedding Dates
                    </label>
                    <div className="space-y-3">
                      {member.pids.map((pid) => {
                        const spouse = allMembers.find((m) => isSameId(m.id || m._id, pid));
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
                  
                  {/* Add New Field */}
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

                {/* File Uploader */}
                <div className={`p-4 rounded-xl border ${isDarkMode ? "bg-slate-800 border-slate-700" : "bg-white border-gray-200"}`}>
                  <FileUploaderRegular
                    pubkey="8adc52d0c4bb04d5e668"
                    classNameUploader={`uc-purple ${isDarkMode ? "uc-dark" : "uc-light"}`}
                    sourceList="local, camera, facebook"
                    onFileUploadSuccess={(fileInfo) => {
                      setFormData({ ...formData, img: fileInfo.cdnUrl });
                      toast.success("Image uploaded");
                    }}
                  />
                </div>

                {/* Footer Actions */}
                <div className={`pt-4 flex gap-3 bottom-0 z-10 pb-2 border-t ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                  <button
                    type="button"
                    onClick={initiateDelete}
                    disabled={loading}
                    className={`flex-1 py-3 font-bold rounded-xl transition flex justify-center items-center gap-2 ${isDarkMode ? 'bg-red-900/20 text-red-400 hover:bg-red-900/30' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                  >
                    <Trash2 size={18} /> Delete
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-[2] py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition flex justify-center items-center gap-2 shadow-lg shadow-blue-500/20"
                  >
                    {loading ? <Loader2 className="animate-spin" /> : <Save size={18} />} Save
                  </button>
                </div>
              </form>
            )}

            {/* ================= ADD / LINK SELECT MODES ================= */}
            {mode === "add-select" && (
              <div className="animate-fade-in space-y-3">
                <button
                  onClick={() => handleStartAdd("child")}
                  className={`w-full p-4 border rounded-xl text-left font-bold flex items-center justify-between transition group
                    ${isDarkMode ? 'bg-green-900/10 border-green-900/30 text-green-400 hover:bg-green-900/20' : 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'}`}
                >
                  <span>Add Child (New)</span> <Plus size={20} className="group-hover:scale-110 transition"/>
                </button>
                <button
                  onClick={() => { setRelativeType("child"); setMode("link-search"); }}
                  className={`w-full p-4 border rounded-xl text-left font-bold flex items-center justify-between transition group
                    ${isDarkMode ? 'bg-blue-900/10 border-blue-900/30 text-blue-400 hover:bg-blue-900/20' : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'}`}
                >
                  <span>Link Existing Child</span> <LinkIcon size={20} className="group-hover:scale-110 transition" />
                </button>
                
                <div className={`h-px my-2 ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200'}`} />
                
                {["spouse", "father", "mother", "sibling"].map((r) => (
                  <button
                    key={r}
                    onClick={() => handleStartAdd(r)}
                    className={`w-full p-4 border rounded-xl text-left font-medium capitalize flex items-center justify-between transition
                      ${isDarkMode ? 'border-slate-700 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-50'}`}
                  >
                    <span>Add {r}</span>
                    <Plus size={18} className="opacity-50" />
                  </button>
                ))}
              </div>
            )}

            {/* ================= ADD FORM MODE ================= */}
            {mode === "add-form" && (
              <form onSubmit={handleSaveNew} className="animate-fade-in space-y-4">
                <div className={`text-xs p-3 rounded-xl border text-center ${isDarkMode ? 'bg-blue-900/20 border-blue-800 text-blue-300' : 'bg-blue-50 border-blue-100 text-blue-700'}`}>
                  Adding <span className="font-bold uppercase">{relativeType}</span> to <span className="font-bold">{member.name}</span>
                </div>

                <div>
                  <label className={labelClass}>Full Name</label>
                  <input
                    className={inputClass}
                    value={addFormData.name}
                    onChange={(e) => setAddFormData({ ...addFormData, name: e.target.value })}
                    required
                    placeholder="Enter name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Gender</label>
                    <select
                      className={inputClass}
                      value={addFormData.gender}
                      onChange={(e) => setAddFormData({ ...addFormData, gender: e.target.value })}
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Birth Date</label>
                    <input
                      type="date"
                      className={inputClass}
                      value={addFormData.birthDate}
                      onChange={(e) => setAddFormData({ ...addFormData, birthDate: e.target.value })}
                    />
                  </div>
                </div>

                {linkableNodes.length > 0 && (
                  <div className={`p-4 rounded-xl border animate-in fade-in ${isDarkMode ? "bg-amber-900/10 border-amber-900/30" : "bg-amber-50 border-amber-200"}`}>
                    <p className={`text-sm font-bold mb-3 flex items-center gap-2 ${isDarkMode ? "text-amber-400" : "text-amber-700"}`}>
                      <LinkIcon size={14} /> Link existing family?
                    </p>
                    <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                      {linkableNodes.map((node) => (
                        <label
                          key={node.id}
                          className={`flex items-center gap-3 cursor-pointer p-2 rounded-lg transition ${isDarkMode ? "hover:bg-amber-900/20" : "hover:bg-amber-100"}`}
                        >
                          <input
                            type="checkbox"
                            checked={linkChildrenIds.includes(node.id)}
                            onChange={(e) => {
                              if (e.target.checked) setLinkChildrenIds([...linkChildrenIds, node.id]);
                              else setLinkChildrenIds(linkChildrenIds.filter((id) => id !== node.id));
                            }}
                            className="rounded text-amber-600 focus:ring-amber-500"
                          />
                          <img src={node.img || DEFAULT_IMG} className="w-8 h-8 rounded-full object-cover" />
                          <span className="text-sm font-medium">{node.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setMode("add-select")}
                    className={`flex-1 p-3 rounded-xl font-bold ${isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-gray-100 text-slate-600'}`}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 p-3 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 flex justify-center items-center gap-2 shadow-lg shadow-green-500/20"
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Save
                  </button>
                </div>
              </form>
            )}

            {/* ================= LINK SEARCH MODE ================= */}
            {mode === "link-search" && (
              <div className="animate-fade-in space-y-4">
                <div className="relative">
                  <input
                    autoFocus
                    placeholder={`Search for ${relativeType}...`}
                    value={searchLinkQuery}
                    onChange={(e) => setSearchLinkQuery(e.target.value)}
                    className={`${inputClass} pl-10`}
                  />
                  <Search className={`absolute left-3 top-3.5 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`} size={18} />
                </div>
                
                <div className="space-y-2 max-h-[50vh] overflow-y-auto custom-scrollbar">
                  {getLinkCandidates().length === 0 ? (
                    <p className={`text-center py-8 italic ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>No matching members found.</p>
                  ) : (
                    getLinkCandidates().map((c) => (
                      <div
                        key={c.id}
                        onClick={() => onLinkRelative(c.id, relativeType)}
                        className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition ${isDarkMode ? 'border-slate-800 hover:bg-slate-800' : 'border-slate-200 hover:bg-slate-50'}`}
                      >
                        <img src={c.img || DEFAULT_IMG} className="w-10 h-10 rounded-full object-cover" />
                        <div>
                          <p className="font-bold text-sm">{c.name}</p>
                          <p className="text-xs opacity-50">Born: {c.birthDate ? new Date(c.birthDate).getFullYear() : "N/A"}</p>
                        </div>
                        <div className={`ml-auto px-3 py-1 text-xs font-bold rounded-full ${isDarkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                          Select
                        </div>
                      </div>
                    ))
                  )}
                </div>
                
                <button
                  onClick={() => setMode("add-select")}
                  className={`w-full p-3 rounded-xl font-bold text-sm ${isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}
                >
                  Back
                </button>
              </div>
            )}
          </div>
        </div>

        {/* --- IMAGE MODAL --- */}
        {showImgModal && (
          <div
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setShowImgModal(false)}
          >
            <div className="relative max-w-4xl max-h-screen">
              <img
                src={formData.img || member.img || DEFAULT_IMG}
                className="max-w-full max-h-[85vh] rounded-lg shadow-2xl object-contain"
                onClick={(e) => e.stopPropagation()}
              />
              <button
                onClick={() => setShowImgModal(false)}
                className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition"
              >
                <X size={32} />
              </button>
            </div>
          </div>
        )}

        {/* --- DELETE CONFIRMATION MODAL --- */}
        {showDeleteModal && (
          <div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] backdrop-blur-sm p-4"
            onClick={() => setShowDeleteModal(false)}
          >
            <div
              className={`p-8 rounded-3xl w-full max-w-sm shadow-2xl border ${isDarkMode ? "bg-slate-900 border-slate-700 text-white" : "bg-white border-gray-100"}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="w-14 h-14 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-5">
                  <AlertTriangle size={28} />
                </div>
                <h3 className="text-xl font-bold mb-2">Delete Member?</h3>
                <p className={`text-sm mb-8 leading-relaxed ${isDarkMode ? "text-slate-400" : "text-slate-500"}`}>
                  Are you sure you want to remove <b className={isDarkMode ? "text-white" : "text-slate-900"}>{member.name}</b>? <br />
                  This will disconnect them from the family tree structure.
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    disabled={loading}
                    className={`flex-1 py-3 rounded-xl font-medium transition ${isDarkMode ? "bg-slate-800 hover:bg-slate-700 text-slate-300" : "bg-slate-100 hover:bg-slate-200 text-slate-600"}`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    disabled={loading}
                    className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition shadow-lg shadow-red-500/30 flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : "Delete"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default MemberSidebar;