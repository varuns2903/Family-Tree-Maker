import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  X,
  Save,
  Trash2,
  UserPlus,
  FileText,
  Link as LinkIcon,
  ZoomIn,
  Loader2,
  Edit,
  Plus,
  Phone,
  Calendar,
  Search,
  Heart,
  Sparkles,
  User,
  ChevronLeft,
  Info,
  Grid,
  AlertTriangle,
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

  const DEFAULT_IMG =
    "https://ucarecdn.com/db931dbd-59c5-4b4d-a86d-79d9791262ce/user.png";
  const canEdit = ["owner", "editor"].includes(userRole);
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
    const record = member.weddings.find(
      (w) => String(w.spouseId) === String(spouseId)
    );
    return record?.date
      ? new Date(record.date).toLocaleDateString(undefined, {
          dateStyle: "long",
        })
      : null;
  };

  const getWeddingInputValue = (spouseId) => {
    if (!formData.weddings) return "";
    const record = formData.weddings.find(
      (w) => String(w.spouseId) === String(spouseId)
    );
    return record?.date ? record.date.split("T")[0] : "";
  };

  const isSameId = (a, b) => {
    if (!a || !b) return false;
    return String(a) === String(b);
  };

  const hasParent = (node, parentKey) => {
    return (
      node[parentKey] &&
      node[parentKey] !== null &&
      String(node[parentKey]) !== "null"
    );
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
    if (!member)
      return { parents: [], spouses: [], children: [], siblings: [] };
    const { mid, fid, pids = [], id, _id } = member;
    const currentId = id || _id;

    return {
      parents: allMembers.filter(
        (n) => isSameId(n.id || n._id, mid) || isSameId(n.id || n._id, fid)
      ),
      spouses: allMembers.filter((n) =>
        pids.some((pid) => isSameId(pid, n.id || n._id))
      ),
      children: allMembers.filter(
        (n) => isSameId(n.fid, currentId) || isSameId(n.mid, currentId)
      ),
      siblings: allMembers.filter(
        (n) =>
          !isSameId(n.id || n._id, currentId) &&
          ((mid && isSameId(n.mid, mid)) || (fid && isSameId(n.fid, fid)))
      ),
    };
  };

  const getLinkCandidates = () => {
    return allMembers.filter((n) => {
      const nid = n.id || n._id;
      const mid = member.id || member._id;

      if (isSameId(nid, mid)) return false;
      if (!n.name.toLowerCase().includes(searchLinkQuery.toLowerCase()))
        return false;

      if (member.pids && member.pids.some((pid) => isSameId(pid, nid)))
        return false;
      if (isSameId(member.mid, nid) || isSameId(member.fid, nid)) return false;

      if (relativeType === "father") return n.gender === "male";
      if (relativeType === "mother") return n.gender === "female";

      if (relativeType === "child") {
        if (member.gender === "male" && n.fid) return false;
        if (member.gender === "female" && n.mid) return false;
        if (member.gender === "other") return false;

        if (member.gender === "male") {
          if (!n.mid) return false;
          return member.pids?.some((pid) => isSameId(pid, n.mid));
        }
        if (member.gender === "female") {
          if (!n.fid) return false;
          return member.pids?.some((pid) => isSameId(pid, n.fid));
        }
      }
      return true;
    });
  };

  const getLinkableNodes = () => {
    if (!member) return [];
    const mid = member.id || member._id;

    if (relativeType === "spouse") {
      const myChildren = allMembers.filter(
        (n) => isSameId(n.mid, mid) || isSameId(n.fid, mid)
      );
      return myChildren.filter((child) => {
        if (member.gender === "male") return !hasParent(child, "mid");
        return !hasParent(child, "fid");
      });
    }

    if (relativeType === "father") {
      if (!hasParent(member, "mid")) return [];
      return allMembers.filter(
        (n) =>
          !isSameId(n.id || n._id, mid) &&
          isSameId(n.mid, member.mid) &&
          !hasParent(n, "fid")
      );
    }

    if (relativeType === "mother") {
      if (!hasParent(member, "fid")) return [];
      return allMembers.filter(
        (n) =>
          !isSameId(n.id || n._id, mid) &&
          isSameId(n.fid, member.fid) &&
          !hasParent(n, "mid")
      );
    }
    return [];
  };

  const linkableNodes = getLinkableNodes();

  // --- ACTIONS ---

  const handleWeddingDateChange = (spouseId, date) => {
    setFormData((prev) => {
      const currentWeddings = prev.weddings ? [...prev.weddings] : [];
      const index = currentWeddings.findIndex(
        (w) => String(w.spouseId) === String(spouseId)
      );
      if (index > -1) {
        currentWeddings[index] = { ...currentWeddings[index], date };
      } else {
        currentWeddings.push({ spouseId, date });
      }
      return { ...prev, weddings: currentWeddings };
    });
  };

  const handleAddCustomField = () => {
    if (!newFieldKey.trim() || !newFieldValue.trim()) return;
    const safeKey = newFieldKey.trim().replace(/\s+/g, "_").toLowerCase();
    setFormData((prev) => ({
      ...prev,
      data: { ...prev.data, [safeKey]: newFieldValue },
    }));
    setNewFieldKey("");
    setNewFieldValue("");
  };

  const handleRemoveCustomField = (keyToRemove) => {
    const newData = { ...formData.data };
    delete newData[keyToRemove];
    setFormData((prev) => ({ ...prev, data: newData }));
  };

  const handleCustomFieldChange = (key, value) => {
    setFormData((prev) => ({
      ...prev,
      data: { ...prev.data, [key]: value },
    }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.put(
        `/trees/${treeId}/members/${member.id || member._id}`,
        formData
      );
      onUpdate(data);
      toast.success("Member updated");
      setMode("view");
    } catch (error) {
      console.log(error);
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
      console.log(error);
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
      const { data } = await api.put(
        `/trees/${treeId}/members/${member.id || member._id}`,
        payload
      );
      onUpdate(data);
      toast.success("Parent linked!");
    } catch (error) {
      console.log(error);
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
    if (type === "spouse")
      defaultGender = member.gender === "male" ? "female" : "male";

    setAddFormData({
      name: "",
      gender: defaultGender,
      birthDate: "",
      deathDate: "",
      isAlive: true,
      img: DEFAULT_IMG,
      contactNo: "",
      relativeId: member.id || member._id,
      relationType: type,
    });
    setMode("add-form");
  };

  const handleSaveNew = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...addFormData, linkChildrenIds };
      await onAddNew(payload);
      setMode("view");
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Don't render anything if not open
  if (!isOpen || !member) return null;

  const { parents, spouses, children } = getRelatives();

  return (
    <>
      {/* ✅ OVERLAY & CONTAINER */}
      <div className="fixed inset-0 z-50 flex justify-end">
        {/* Backdrop - Closes on click */}
        <div
          className="absolute inset-0 bg-black/20 backdrop-blur-[1px] animate-in fade-in duration-200"
          onClick={onClose}
        />

        {/* Sidebar - Stops propagation so click doesn't close it */}
        <div
          className={`relative h-full w-full sm:w-[400px] shadow-2xl transform transition-transform duration-300 ease-in-out slide-in-from-right
            ${
              document.documentElement.classList.contains("dark")
                ? "bg-slate-900 border-l border-slate-700 text-slate-100"
                : "bg-white border-l border-gray-200 text-gray-800"
            }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* HEADER */}
          <div
            className={`p-4 border-b flex justify-between items-center sticky top-0 z-10 backdrop-blur-md
            ${
              document.documentElement.classList.contains("dark")
                ? "bg-slate-900/90 border-slate-800"
                : "bg-white/90 border-gray-100"
            }`}
          >
            <div className="flex items-center gap-2">
              {mode !== "view" && (
                <button
                  onClick={() => setMode("view")}
                  className="p-1 mr-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition text-slate-500 dark:text-slate-400"
                >
                  <ChevronLeft size={22} />
                </button>
              )}
              <h2 className="text-lg font-bold">
                {mode === "view"
                  ? "Member Profile"
                  : mode === "edit"
                  ? "Edit Profile"
                  : mode === "add-form"
                  ? `Add ${relativeType}`
                  : "Add Relative"}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition"
            >
              <X size={20} />
            </button>
          </div>

          <div className="h-[calc(100vh-64px)] overflow-y-auto custom-scrollbar p-6 pb-24">
            {/* ================= VIEW MODE ================= */}
            {mode === "view" && (
              <div className="animate-fade-in space-y-6">
                <div className="flex flex-col items-center">
                  <div
                    className="relative group cursor-pointer"
                    onClick={() => setShowImgModal(true)}
                  >
                    <img
                      src={member.img || DEFAULT_IMG}
                      alt="Profile"
                      className="w-32 h-32 rounded-full object-cover border-4 border-white dark:border-slate-800 shadow-xl group-hover:scale-105 transition"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full opacity-0 group-hover:opacity-100 transition">
                      <ZoomIn className="text-white drop-shadow-md" size={24} />
                    </div>
                    <span
                      className={`absolute bottom-2 right-2 w-5 h-5 rounded-full border-2 flex items-center justify-center shadow-sm ${
                        document.documentElement.classList.contains("dark")
                          ? "border-slate-900"
                          : "border-white"
                      } ${member.isAlive ? "bg-green-500" : "bg-gray-400"}`}
                      title={member.isAlive ? "Alive" : "Deceased"}
                    />
                  </div>
                  <h2 className="text-2xl font-bold mt-4 text-center">
                    {member.name}
                  </h2>
                  {member.description && (
                    <p className="text-sm text-center opacity-70 mt-2 px-4 italic leading-relaxed">
                      "{member.description}"
                    </p>
                  )}
                  <div
                    className={`flex flex-wrap justify-center gap-2 mt-4 text-xs font-medium px-4 py-1.5 rounded-full border w-fit ${
                      document.documentElement.classList.contains("dark")
                        ? "bg-slate-800 border-slate-700 text-slate-300"
                        : "bg-gray-100 border-gray-200 text-gray-600"
                    }`}
                  >
                    <span>
                      {member.gender === "male"
                        ? "Male ♂"
                        : member.gender === "female"
                        ? "Female ♀"
                        : "Other ⚧"}
                    </span>
                    <span className="opacity-50">•</span>
                    <span>
                      {member.isAlive
                        ? `${calculateAge(member.birthDate)} yrs`
                        : "Deceased"}
                    </span>
                  </div>
                </div>

                <div
                  className={`p-4 rounded-2xl border space-y-4 ${
                    document.documentElement.classList.contains("dark")
                      ? "bg-slate-800/40 border-slate-700"
                      : "bg-slate-50 border-slate-100"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-500">
                      <Calendar size={16} />
                    </div>
                    <div>
                      <p className="text-xs uppercase font-bold opacity-50">
                        Birth Date
                      </p>
                      <p className="text-sm font-medium">
                        {member.birthDate
                          ? new Date(member.birthDate).toLocaleDateString(
                              undefined,
                              { dateStyle: "long" }
                            )
                          : "Unknown"}
                      </p>
                    </div>
                  </div>
                  {!member.isAlive && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500">
                        <Calendar size={16} />
                      </div>
                      <div>
                        <p className="text-xs uppercase font-bold opacity-50">
                          Death Date
                        </p>
                        <p className="text-sm font-medium">
                          {member.deathDate
                            ? new Date(member.deathDate).toLocaleDateString(
                                undefined,
                                { dateStyle: "long" }
                              )
                            : "Unknown"}
                        </p>
                      </div>
                    </div>
                  )}
                  {member.contactNo && (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-50 dark:bg-green-900/30 flex items-center justify-center text-green-500">
                        <Phone size={16} />
                      </div>
                      <div>
                        <p className="text-xs uppercase font-bold opacity-50">
                          Contact
                        </p>
                        <p className="text-sm font-medium">
                          {member.contactNo}
                        </p>
                      </div>
                    </div>
                  )}
                  {member.data && Object.entries(member.data).length > 0 && (
                    <>
                      <div className="h-px bg-gray-200 dark:bg-slate-700 my-2" />
                      {Object.entries(member.data).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center text-purple-500">
                            <Info size={16} />
                          </div>
                          <div>
                            <p className="text-xs uppercase font-bold opacity-50 capitalize">
                              {key.replace(/_/g, " ")}
                            </p>
                            <p className="text-sm font-medium">{value}</p>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-bold uppercase opacity-60 tracking-wider">
                    Family Members
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {/* PARENTS: Blue */}
                    {parents.map((p) => (
                      <div
                        key={p.id || p._id}
                        className="flex items-center gap-3 p-2 rounded-xl border hover:bg-gray-50 dark:hover:bg-slate-800 transition cursor-pointer dark:border-slate-700"
                        onClick={() => onUpdate(p)}
                      >
                        <img
                          src={p.img || DEFAULT_IMG}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <p className="font-bold text-sm">{p.name}</p>
                          <p className="text-xs font-medium text-blue-600 dark:text-blue-400">
                            Parent
                          </p>
                        </div>
                      </div>
                    ))}

                    {/* SPOUSES: Pink */}
                    {spouses.map((s) => {
                      const anniversary = getAnniversaryDate(s.id || s._id);
                      return (
                        <div
                          key={s.id || s._id}
                          className="flex items-center gap-3 p-2 rounded-xl border hover:bg-gray-50 dark:hover:bg-slate-800 transition cursor-pointer dark:border-slate-700"
                          onClick={() => onUpdate(s)}
                        >
                          <div className="relative">
                            <img
                              src={s.img || DEFAULT_IMG}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                            <div className="absolute -bottom-1 -right-1 bg-white dark:bg-slate-800 rounded-full p-0.5">
                              <Heart
                                size={10}
                                className="text-pink-500 fill-current"
                              />
                            </div>
                          </div>
                          <div>
                            <p className="font-bold text-sm">{s.name}</p>
                            <p className="text-xs font-medium text-pink-600 dark:text-pink-400 flex items-center gap-1">
                              Spouse{" "}
                              {anniversary && (
                                <span className="opacity-80 font-normal text-[10px]">
                                  • Wed: {anniversary}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      );
                    })}

                    {/* CHILDREN: Emerald Green */}
                    {children.map((c) => (
                      <div
                        key={c.id || c._id}
                        className="flex items-center gap-3 p-2 rounded-xl border hover:bg-gray-50 dark:hover:bg-slate-800 transition cursor-pointer dark:border-slate-700"
                        onClick={() => onUpdate(c)}
                      >
                        <img
                          src={c.img || DEFAULT_IMG}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <p className="font-bold text-sm">{c.name}</p>
                          <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                            Child
                          </p>
                        </div>
                      </div>
                    ))}

                    {parents.length === 0 &&
                      spouses.length === 0 &&
                      children.length === 0 && (
                        <p className="text-sm italic opacity-50 text-center py-4">
                          No relatives connected.
                        </p>
                      )}
                  </div>
                </div>

                {canEdit && (
                  <div className="grid grid-cols-2 gap-3 pt-4 border-t dark:border-slate-800">
                    <button
                      onClick={() => setMode("edit")}
                      className="flex items-center justify-center gap-2 p-3 rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-bold text-sm hover:opacity-90 transition"
                    >
                      <Edit size={16} /> Edit Profile
                    </button>
                    <button
                      onClick={() => setMode("add-select")}
                      className="flex items-center justify-center gap-2 p-3 rounded-xl bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 font-bold text-sm hover:opacity-90 transition"
                    >
                      <UserPlus size={16} /> Add Relative
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ================= EDIT MODE ================= */}
            {mode === "edit" && (
              <form
                onSubmit={handleEditSubmit}
                className="animate-fade-in space-y-5"
              >
                <div className="flex justify-center mb-4">
                  <div
                    className="relative group cursor-pointer"
                    onClick={() => setShowImgModal(true)}
                  >
                    <img
                      src={formData.img || DEFAULT_IMG}
                      className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-slate-700 shadow-md"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full opacity-0 group-hover:opacity-100 transition">
                      <ZoomIn className="text-white" size={20} />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase opacity-50 mb-1 block">
                    Full Name
                  </label>
                  <input
                    className="w-full p-3 rounded-xl border dark:bg-slate-800 dark:border-slate-700"
                    value={formData.name || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase opacity-50 mb-1 block">
                      Birth Date
                    </label>
                    <input
                      type="date"
                      className="w-full p-3 rounded-xl border dark:bg-slate-800 dark:border-slate-700"
                      value={formData.birthDate || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, birthDate: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase opacity-50 mb-1 block">
                      Gender
                    </label>
                    <select
                      className="w-full p-3 rounded-xl border dark:bg-slate-800 dark:border-slate-700"
                      value={formData.gender || "male"}
                      onChange={(e) =>
                        setFormData({ ...formData, gender: e.target.value })
                      }
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <label
                    className={`flex items-center gap-2 text-sm p-3 rounded-xl border cursor-pointer ${
                      document.documentElement.classList.contains("dark")
                        ? "bg-slate-800 border-slate-700"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.isAlive !== false}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          isAlive: e.target.checked,
                          deathDate: e.target.checked ? "" : formData.deathDate,
                        })
                      }
                    />{" "}
                    Alive
                  </label>
                  {formData.isAlive === false && (
                    <div>
                      <label className="text-xs font-bold uppercase opacity-50 mb-1 block">
                        Death Date
                      </label>
                      <input
                        type="date"
                        className="w-full p-3 rounded-xl border dark:bg-slate-800 dark:border-slate-700"
                        value={formData.deathDate || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            deathDate: e.target.value,
                          })
                        }
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold uppercase opacity-50 mb-1 block">
                    Contact Number
                  </label>
                  <input
                    className="w-full p-3 rounded-xl border dark:bg-slate-800 dark:border-slate-700"
                    value={formData.contactNo || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, contactNo: e.target.value })
                    }
                    placeholder="Phone"
                  />
                </div>

                <div className="w-full">
                  <label className="text-xs font-bold uppercase opacity-50 mb-1 flex items-center gap-1">
                    <FileText size={12} /> Bio / Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Add career info, memories..."
                    className="w-full p-3 rounded-xl border text-sm dark:bg-slate-800 dark:border-slate-700"
                    rows="3"
                  />
                </div>

                {member.pids && member.pids.length > 0 && (
                  <div className="pt-2 border-t dark:border-slate-800">
                    <label className="text-xs font-bold uppercase opacity-50 mb-2 block flex items-center gap-1 text-pink-500">
                      <Heart size={12} className="fill-current" /> Spouses &
                      Weddings
                    </label>
                    <div className="space-y-3">
                      {member.pids.map((pid) => {
                        const spouse = allMembers.find((m) =>
                          isSameId(m.id || m._id, pid)
                        );
                        if (!spouse) return null;
                        return (
                          <div
                            key={pid}
                            className="flex flex-col gap-1 p-2 rounded-lg bg-gray-50 dark:bg-slate-800/50 border dark:border-slate-700"
                          >
                            <div className="flex items-center gap-2">
                              <img
                                src={spouse.img || DEFAULT_IMG}
                                className="w-6 h-6 rounded-full object-cover"
                              />
                              <span className="text-sm font-bold truncate">
                                {spouse.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] uppercase font-bold opacity-50 w-16">
                                Date:
                              </span>
                              <input
                                type="date"
                                className="flex-1 p-1 text-xs rounded border dark:bg-slate-900 dark:border-slate-600"
                                value={getWeddingInputValue(pid)}
                                onChange={(e) =>
                                  handleWeddingDateChange(pid, e.target.value)
                                }
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t dark:border-slate-800">
                  <label className="text-xs font-bold uppercase opacity-50 mb-3 block flex items-center gap-2">
                    <Grid size={12} /> Extra Details
                  </label>
                  <div className="space-y-3 mb-4">
                    {formData.data &&
                      Object.entries(formData.data).map(([key, value]) => (
                        <div key={key} className="flex gap-2 items-center">
                          <div className="flex-1">
                            <label className="text-[10px] font-bold uppercase opacity-40 block mb-1">
                              {key.replace(/_/g, " ")}
                            </label>
                            <input
                              className="w-full p-2 text-sm rounded-lg border dark:bg-slate-800 dark:border-slate-700"
                              value={value}
                              onChange={(e) =>
                                handleCustomFieldChange(key, e.target.value)
                              }
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveCustomField(key)}
                            className="p-2 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg self-end mb-0.5"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                  </div>
                  <div className="flex gap-2 items-end p-3 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-dashed dark:border-slate-700">
                    <div className="flex-1">
                      <input
                        placeholder="Label (e.g. Place of Birth)"
                        className="w-full p-2 text-xs mb-2 rounded border dark:bg-slate-900 dark:border-slate-700"
                        value={newFieldKey}
                        onChange={(e) => setNewFieldKey(e.target.value)}
                      />
                      <input
                        placeholder="Value (e.g. New York)"
                        className="w-full p-2 text-sm rounded border dark:bg-slate-900 dark:border-slate-700"
                        value={newFieldValue}
                        onChange={(e) => setNewFieldValue(e.target.value)}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddCustomField}
                      className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                </div>

                {/* Search for the FileUploaderRegular inside the 'edit' mode block */}

                <div
                  className={`p-4 rounded-xl border ${
                    isDarkMode
                      ? "bg-slate-800 border-slate-700"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <FileUploaderRegular
                    pubkey="8adc52d0c4bb04d5e668"
                    // ✅ CHANGED: Dynamic class based on theme
                    classNameUploader={`uc-purple ${
                      isDarkMode ? "uc-dark" : "uc-light"
                    }`}
                    sourceList="local, camera, facebook"
                    onFileUploadSuccess={(fileInfo) => {
                      setFormData({ ...formData, img: fileInfo.cdnUrl });
                      toast.success("Image uploaded");
                    }}
                  />
                </div>

                <div className="pt-4 flex gap-3 bottom-0 bg-white dark:bg-slate-900 pb-2 border-t dark:border-slate-800">
                  <button
                    type="button"
                    onClick={initiateDelete}
                    disabled={loading}
                    className="flex-1 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 font-bold rounded-xl hover:bg-red-100 transition flex justify-center items-center gap-2"
                  >
                    <Trash2 size={18} /> Delete
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-[2] py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition flex justify-center items-center gap-2"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <Save size={18} />
                    )}{" "}
                    Save
                  </button>
                </div>

                {potentialParents.length > 0 && (
                  <div className="pt-4 border-t dark:border-slate-800">
                    <label className="text-xs font-bold uppercase opacity-50 mb-3 block text-amber-500">
                      Suggestions
                    </label>
                    <div className="space-y-2">
                      {potentialParents.map((p) => (
                        <div
                          key={p.id}
                          className="flex items-center justify-between p-3 rounded-xl border bg-amber-50 border-amber-100 dark:bg-amber-900/20 dark:border-amber-800"
                        >
                          <div className="text-xs">
                            <p className="font-bold">Link {p.name}</p>
                            <p className="opacity-60">as {p.role}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleLinkParent(p)}
                            className="px-3 py-1 bg-amber-500 text-white text-xs font-bold rounded-lg hover:bg-amber-600"
                          >
                            Link
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </form>
            )}

            {/* ================= ADD SELECT MODE ================= */}
            {mode === "add-select" && (
              <div className="animate-fade-in space-y-3">
                <button
                  onClick={() => handleStartAdd("child")}
                  className="w-full p-4 border rounded-xl text-left font-bold flex items-center justify-between hover:bg-gray-50 dark:border-slate-700 dark:hover:bg-slate-800 text-green-600 border-green-200 bg-green-50 dark:bg-green-900/20 dark:text-green-400"
                >
                  <span>Add Child (New)</span> <Plus size={20} />
                </button>
                <button
                  onClick={() => {
                    setRelativeType("child");
                    setMode("link-search");
                  }}
                  className="w-full p-4 border rounded-xl text-left font-bold flex items-center justify-between text-blue-600 border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400"
                >
                  <span>Link Existing Child</span> <LinkIcon size={20} />
                </button>
                <div className="h-px bg-gray-200 dark:bg-slate-700 my-2" />
                {["spouse", "father", "mother", "sibling"].map((r) => (
                  <button
                    key={r}
                    onClick={() => handleStartAdd(r)}
                    className="w-full p-4 border rounded-xl text-left font-medium capitalize hover:bg-gray-50 dark:border-slate-700 dark:hover:bg-slate-800 flex items-center justify-between"
                  >
                    <span>Add {r}</span>
                    <Plus size={18} className="opacity-50" />{" "}
                  </button>
                ))}
              </div>
            )}

            {/* ================= ADD FORM MODE ================= */}
            {mode === "add-form" && (
              <form
                onSubmit={handleSaveNew}
                className="animate-fade-in space-y-4"
              >
                {relativeType === "child" && (
                  <div
                    className={`text-xs p-3 rounded-lg border ${
                      document.documentElement.classList.contains("dark")
                        ? "bg-blue-900/20 border-blue-800 text-blue-300"
                        : "bg-blue-50 border-blue-100 text-blue-700"
                    }`}
                  >
                    Adding child to <b>{member.name}</b>.
                  </div>
                )}
                {relativeType === "sibling" && !member.fid && !member.mid && (
                  <div className="text-xs p-3 rounded-lg border bg-yellow-50 border-yellow-200 text-yellow-800">
                    Warning: This member has no parents listed. Sibling will be
                    unlinked from parents.
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold uppercase opacity-50 mb-1 block">
                    Full Name
                  </label>
                  <input
                    className="w-full p-3 rounded-xl border dark:bg-slate-800 dark:border-slate-700"
                    value={addFormData.name}
                    onChange={(e) =>
                      setAddFormData({ ...addFormData, name: e.target.value })
                    }
                    required
                    placeholder="Enter name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase opacity-50 mb-1 block">
                      Gender
                    </label>
                    <select
                      className="w-full p-3 rounded-xl border dark:bg-slate-800 dark:border-slate-700"
                      value={addFormData.gender}
                      onChange={(e) =>
                        setAddFormData({
                          ...addFormData,
                          gender: e.target.value,
                        })
                      }
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase opacity-50 mb-1 block">
                      Birth Date
                    </label>
                    <input
                      type="date"
                      className="w-full p-3 rounded-xl border dark:bg-slate-800 dark:border-slate-700"
                      value={addFormData.birthDate}
                      onChange={(e) =>
                        setAddFormData({
                          ...addFormData,
                          birthDate: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <label
                  className={`flex items-center gap-2 text-sm p-3 rounded-xl border cursor-pointer ${
                    document.documentElement.classList.contains("dark")
                      ? "bg-slate-800 border-slate-700"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={addFormData.isAlive}
                    onChange={(e) =>
                      setAddFormData({
                        ...addFormData,
                        isAlive: e.target.checked,
                        deathDate: e.target.checked
                          ? ""
                          : addFormData.deathDate,
                      })
                    }
                  />{" "}
                  Is this person alive?
                </label>
                {!addFormData.isAlive && (
                  <div>
                    <label className="text-xs font-bold uppercase opacity-50 mb-1 block">
                      Death Date
                    </label>
                    <input
                      type="date"
                      className="w-full p-3 rounded-xl border dark:bg-slate-800 dark:border-slate-700"
                      value={addFormData.deathDate}
                      onChange={(e) =>
                        setAddFormData({
                          ...addFormData,
                          deathDate: e.target.value,
                        })
                      }
                    />
                  </div>
                )}

                {/* Search for the FileUploaderRegular inside the 'add-form' mode block */}

                <div
                  className={`p-4 rounded-xl border ${
                    isDarkMode
                      ? "bg-slate-800 border-slate-700"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <FileUploaderRegular
                    pubkey="8adc52d0c4bb04d5e668"
                    // ✅ CHANGED: Dynamic class based on theme
                    classNameUploader={`uc-purple ${
                      isDarkMode ? "uc-dark" : "uc-light"
                    }`}
                    sourceList="local, camera, facebook"
                    onFileUploadSuccess={(fileInfo) => {
                      setAddFormData({ ...addFormData, img: fileInfo.cdnUrl });
                      toast.success("Image uploaded");
                    }}
                  />
                </div>

                {linkableNodes.length > 0 && (
                  <div
                    className={`p-4 rounded-xl border animate-in fade-in ${
                      document.documentElement.classList.contains("dark")
                        ? "bg-yellow-900/20 border-yellow-800"
                        : "bg-yellow-50 border-yellow-200"
                    }`}
                  >
                    <p
                      className={`text-sm font-bold mb-2 flex items-center gap-1 ${
                        document.documentElement.classList.contains("dark")
                          ? "text-yellow-500"
                          : "text-yellow-800"
                      }`}
                    >
                      <LinkIcon size={14} />
                      {relativeType === "spouse"
                        ? "Link existing children?"
                        : "Link existing siblings?"}
                    </p>
                    <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                      {linkableNodes.map((node) => (
                        <label
                          key={node.id}
                          className={`flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-yellow-100/50 dark:hover:bg-yellow-900/30 transition ${
                            document.documentElement.classList.contains("dark")
                              ? "text-gray-300"
                              : "text-gray-700"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={linkChildrenIds.includes(node.id)}
                            onChange={(e) => {
                              if (e.target.checked)
                                setLinkChildrenIds([
                                  ...linkChildrenIds,
                                  node.id,
                                ]);
                              else
                                setLinkChildrenIds(
                                  linkChildrenIds.filter((id) => id !== node.id)
                                );
                            }}
                            className="rounded text-yellow-600 focus:ring-yellow-500"
                          />
                          <div className="flex items-center gap-2">
                            <img
                              src={node.img || DEFAULT_IMG}
                              className="w-6 h-6 rounded-full object-cover"
                            />
                            <span className="text-sm font-medium">
                              {node.name}
                            </span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setMode("add-select")}
                    className="flex-1 p-3 rounded-xl bg-gray-100 dark:bg-slate-800 font-bold dark:text-gray-300"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 p-3 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 flex justify-center items-center gap-2"
                  >
                    {loading ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <Save size={18} />
                    )}{" "}
                    Save
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
                    className="w-full pl-10 p-3 rounded-xl border outline-none dark:bg-slate-800 dark:border-slate-700"
                  />
                  <Search
                    className="absolute left-3 top-3.5 text-gray-400"
                    size={18}
                  />
                </div>
                <div className="space-y-2 max-h-[50vh] overflow-y-auto custom-scrollbar">
                  {getLinkCandidates().map((c) => (
                    <div
                      key={c.id}
                      onClick={() => onLinkRelative(c.id, relativeType)}
                      className="flex items-center gap-3 p-3 border rounded-xl cursor-pointer hover:bg-gray-50 dark:border-slate-700 dark:hover:bg-slate-800"
                    >
                      <img
                        src={c.img || DEFAULT_IMG}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-bold text-sm">{c.name}</p>
                        <p className="text-xs opacity-50">
                          Born:{" "}
                          {c.birthDate
                            ? new Date(c.birthDate).getFullYear()
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                  ))}
                  {getLinkCandidates().length === 0 && (
                    <p className="text-center opacity-50 py-4 italic">
                      No matching members found.
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setMode("add-select")}
                  className="w-full p-3 rounded-xl bg-gray-100 dark:bg-slate-800 font-bold text-sm dark:text-gray-300"
                >
                  Back
                </button>
              </div>
            )}
          </div>
        </div>

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

        {/* ✅ DELETE MODAL */}
        {showDeleteModal && (
          <div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] backdrop-blur-sm p-4"
            onClick={() => setShowDeleteModal(false)}
          >
            <div
              className={`p-8 rounded-3xl w-full max-w-sm shadow-2xl border ${
                isDarkMode
                  ? "bg-slate-900 border-slate-700 text-white"
                  : "bg-white border-gray-100"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="w-14 h-14 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-5">
                  <AlertTriangle size={28} />
                </div>
                <h3 className="text-xl font-bold mb-2">Delete Member?</h3>
                <p
                  className={`text-sm mb-8 leading-relaxed ${
                    isDarkMode ? "text-slate-400" : "text-slate-500"
                  }`}
                >
                  Are you sure you want to remove{" "}
                  <b className={isDarkMode ? "text-white" : "text-slate-900"}>
                    {member.name}
                  </b>
                  ? <br />
                  This will disconnect them from the family tree structure.
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    disabled={loading}
                    className={`flex-1 py-3 rounded-xl font-medium transition ${
                      isDarkMode
                        ? "bg-slate-800 hover:bg-slate-700 text-slate-300"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    disabled={loading}
                    className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition shadow-lg shadow-red-500/30 flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      "Delete"
                    )}
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
