import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import {
  ArrowLeft,
  Search,
  Filter,
  Pencil,
  Trash2,
  X,
  Save,
  ZoomIn,
  Calendar,
  Phone,
  Info,
  User,
  Heart,
} from "lucide-react"; // Added icons
import { FileUploaderRegular } from "@uploadcare/react-uploader";
import "@uploadcare/react-uploader/core.css";
import toast from "react-hot-toast";
import { getInitialTheme } from "../utils/theme";
import { AlertTriangle } from "lucide-react";

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
  const [viewMember, setViewMember] = useState(null); // ✅ NEW: View Details Modal
  const [editingMember, setEditingMember] = useState(null); // Edit Form Modal
  const [deleteTarget, setDeleteTarget] = useState(null); // Delete Confirmation
  const [previewImage, setPreviewImage] = useState(null); // ✅ NEW: Lightbox

  const [formData, setFormData] = useState({});

  const DEFAULT_IMG =
    "https://ucarecdn.com/db931dbd-59c5-4b4d-a86d-79d9791262ce/user.png";

  // --- PERMISSIONS (Updated Requirement 1) ---
  const canEdit = ["owner", "editor"].includes(userRole);
  const canDelete = ["owner", "editor"].includes(userRole); // ✅ Editors can now delete

  useEffect(() => {
    fetchData();
  }, [treeId]);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [isDarkMode]);

  useEffect(() => {
    filterData();
  }, [members, search, filterGender]);

  const fetchData = async () => {
    try {
      try {
        const treeRes = await api.get(`/trees/${treeId}`);
        setTreeName(treeRes.data.name);
      } catch (e) {
        console.log(e);
      }

      const { data } = await api.get(`/trees/${treeId}/members`);
      if (data.role) {
        setUserRole(data.role);
        setMembers(data.members);
      } else {
        setUserRole("owner");
        setMembers(data);
      }
    } catch (error) {
      console.log(error);
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

  const calculateAge = (dob) => {
    if (!dob) return "";
    const diff = Date.now() - new Date(dob).getTime();
    return Math.floor(diff / 31556952000);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // --- ACTIONS ---

  const initiateDelete = (member) => {
    setViewMember(null); // Close view modal if open
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
    setViewMember(null); // Close view modal if open
    setEditingMember(member);
    setFormData({
      name: member.name,
      gender: member.gender,
      birthDate: member.birthDate ? member.birthDate.split("T")[0] : "",
      deathDate: member.deathDate ? member.deathDate.split("T")[0] : "",
      isAlive: member.isAlive ?? true,
      img: member.img,
      contactNo: member.contactNo || "",
      data: member.data || {}, // Keep existing custom data
    });
  };

  const handleSaveEdit = async () => {
    if (formData.birthDate && !formData.isAlive && formData.deathDate) {
      if (new Date(formData.birthDate) > new Date(formData.deathDate)) {
        toast.error(
          "Date Error: Death date cannot be earlier than birth date!"
        );
        return;
      }
    }

    try {
      const payload = { ...formData };
      const { data } = await api.put(
        `/trees/${treeId}/members/${editingMember.id}`,
        payload
      );

      setMembers((prev) =>
        prev.map((m) => (m.id === editingMember.id ? { ...m, ...data } : m))
      );
      setEditingMember(null);
      toast.success("Member updated");
    } catch {
      toast.error("Update failed");
    }
  };

  // ✅ New Handler: Image Click
  const handleImageClick = (e, imgUrl) => {
    e.stopPropagation(); // Prevent opening the member detail modal
    setPreviewImage(imgUrl);
  };

  return (
    <div
      className={`min-h-screen p-4 sm:p-8 transition-all duration-500 ease-in-out
      ${
        isDarkMode
          ? "bg-slate-900 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-900 via-[#0f172a] to-[#062c26] text-slate-100"
          : "bg-stone-50 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-stone-50 via-white to-green-50 text-slate-800"
      }`}
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 sm:mb-8 gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={() => navigate(`/dashboard`)}
              className={`p-3 rounded-2xl transition shadow-sm border
                ${
                  isDarkMode
                    ? "bg-slate-800 border-slate-700 hover:bg-slate-700"
                    : "bg-white border-gray-100 hover:bg-white/80"
                }`}
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex-1">
              <h1
                onClick={() => navigate(`/tree/${treeId}`)}
                className={`text-2xl sm:text-3xl font-bold tracking-tight cursor-pointer hover:underline`}
              >
                {treeName}
              </h1>
              <p
                className={`text-sm font-medium ${
                  isDarkMode ? "text-slate-400" : "text-slate-500"
                }`}
              >
                {members.length} Members
              </p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div
          className={`p-2 rounded-2xl shadow-sm border mb-6 sm:mb-8 flex flex-row gap-2 items-center 
          ${
            isDarkMode
              ? "bg-slate-800/50 border-slate-700 backdrop-blur-md"
              : "bg-white/60 border-gray-200 backdrop-blur-md"
          }`}
        >
          <div className="relative flex-1">
            <Search
              className={`absolute left-4 top-3.5 ${
                isDarkMode ? "text-slate-400" : "text-slate-400"
              }`}
              size={18}
            />
            <input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full pl-11 pr-4 py-3 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 transition
                ${
                  isDarkMode
                    ? "bg-slate-900/50 border-slate-700 text-white placeholder-slate-500"
                    : "bg-white border-gray-200 placeholder-slate-400"
                }`}
            />
          </div>
          <div className="flex items-center gap-2 w-auto p-1">
            <Filter size={18} className="text-slate-400 hidden md:block" />
            <select
              value={filterGender}
              onChange={(e) => setFilterGender(e.target.value)}
              className={`w-24 sm:w-40 p-3 rounded-xl border outline-none cursor-pointer font-medium transition
                ${
                  isDarkMode
                    ? "bg-slate-900/50 border-slate-700 text-slate-200"
                    : "bg-white border-gray-200 text-slate-700"
                }`}
            >
              <option value="all" className={isDarkMode ? "bg-slate-900" : ""}>
                All
              </option>
              <option value="male" className={isDarkMode ? "bg-slate-900" : ""}>
                Male
              </option>
              <option
                value="female"
                className={isDarkMode ? "bg-slate-900" : ""}
              >
                Female
              </option>
              <option
                value="other"
                className={isDarkMode ? "bg-slate-900" : ""}
              >
                Other
              </option>
            </select>
          </div>
        </div>

        {/* --- MEMBER GRID --- */}
        {loading ? (
          <div className="text-center py-24 opacity-60 animate-pulse">
            Loading members...
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="text-center py-24 opacity-60">
            No members found matching your search.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {filteredMembers.map((member) => (
              <div
                key={member.id}
                onClick={() => setViewMember(member)} // ✅ Open Detail Modal
                className={`relative p-3 sm:p-6 rounded-2xl sm:rounded-3xl border transition-all duration-300 group hover:-translate-y-1 cursor-pointer
                  ${
                    isDarkMode
                      ? "bg-slate-800/40 border-slate-700 hover:bg-slate-800 hover:shadow-xl hover:shadow-slate-900/50"
                      : "bg-white/70 border-white/50 hover:bg-white hover:shadow-xl hover:shadow-blue-900/5"
                  }`}
              >
                <div className="flex flex-col items-center text-center">
                  <div className="relative mb-2 sm:mb-4 group/img">
                    <img
                      src={member.img || DEFAULT_IMG}
                      onClick={(e) =>
                        handleImageClick(e, member.img || DEFAULT_IMG)
                      } // ✅ Open Lightbox
                      className={`w-16 h-16 sm:w-24 sm:h-24 rounded-full object-cover shadow-md border-2 sm:border-4 transition-all group-hover:scale-105 cursor-zoom-in
                        ${
                          isDarkMode
                            ? "border-slate-700 group-hover:border-slate-600"
                            : "border-white group-hover:border-blue-50"
                        }`}
                    />
                    <span
                      className={`absolute bottom-0 right-0 sm:bottom-1 sm:right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center text-[8px] sm:text-[10px] font-bold shadow-sm
                      ${isDarkMode ? "border-slate-800" : "border-white"}
                      ${
                        member.gender === "male"
                          ? "bg-blue-500 text-white"
                          : member.gender === "female"
                          ? "bg-pink-500 text-white"
                          : "bg-amber-500 text-white"
                      }`}
                    >
                      {member.gender === "male"
                        ? "M"
                        : member.gender === "female"
                        ? "F"
                        : "O"}
                    </span>
                  </div>

                  <h3 className="font-bold text-sm sm:text-lg truncate w-full mb-1 px-1">
                    {member.name}
                  </h3>

                  <div
                    className={`text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider mb-2
                    ${
                      member.isAlive
                        ? isDarkMode
                          ? "bg-green-900/30 text-green-400"
                          : "bg-green-100 text-green-700"
                        : isDarkMode
                        ? "bg-slate-700 text-slate-400"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {member.isAlive ? "Alive" : "Deceased"}
                  </div>

                  <div
                    className={`w-full pt-2 sm:pt-4 border-t border-dashed flex justify-between text-[10px] sm:text-xs font-medium
                    ${
                      isDarkMode
                        ? "border-slate-700 text-slate-400"
                        : "border-slate-200 text-slate-500"
                    }`}
                  >
                    <span>
                      {member.birthDate
                        ? calculateAge(member.birthDate) + " yrs"
                        : "Age N/A"}
                    </span>
                    <span className="truncate max-w-[60px] sm:max-w-[100px]">
                      {member.contactNo || "No Phone"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* --- 1. VIEW MEMBER DETAILS MODAL (New Requirement) --- */}
        {viewMember && (
          <div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm p-4"
            onClick={() => setViewMember(null)}
          >
            <div
              className={`p-6 sm:p-8 rounded-3xl w-full max-w-md shadow-2xl transition-all scale-100 max-h-[90vh] overflow-y-auto custom-scrollbar flex flex-col gap-6
                ${
                  isDarkMode
                    ? "bg-slate-900 text-white border border-slate-800"
                    : "bg-white text-slate-900"
                }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div
                    className="relative cursor-zoom-in"
                    onClick={() =>
                      setPreviewImage(viewMember.img || DEFAULT_IMG)
                    }
                  >
                    <img
                      src={viewMember.img || DEFAULT_IMG}
                      className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md"
                    />
                    <div className="absolute inset-0 bg-black/20 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition">
                      <ZoomIn size={20} className="text-white" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{viewMember.name}</h3>
                    <div
                      className={`inline-flex items-center gap-2 text-xs font-medium px-2 py-0.5 rounded-full mt-1 ${
                        isDarkMode
                          ? "bg-slate-800 text-slate-300"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      <span>
                        {viewMember.gender === "male" ? "Male" : "Female"}
                      </span>
                      <span>•</span>
                      <span>{viewMember.isAlive ? "Alive" : "Deceased"}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setViewMember(null)}
                  className={`p-2 rounded-full transition ${
                    isDarkMode
                      ? "hover:bg-slate-800 text-slate-400"
                      : "hover:bg-slate-100 text-slate-500"
                  }`}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Info Grid */}
              <div
                className={`p-4 rounded-2xl border space-y-3 ${
                  isDarkMode
                    ? "bg-slate-800/50 border-slate-700"
                    : "bg-gray-50 border-gray-100"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Calendar size={16} className="text-blue-500" />
                  <div className="text-sm">
                    <span className="opacity-60 block text-xs">Birth Date</span>
                    <span className="font-medium">
                      {viewMember.birthDate
                        ? formatDate(viewMember.birthDate)
                        : "Unknown"}{" "}
                      (
                      {viewMember.birthDate
                        ? calculateAge(viewMember.birthDate)
                        : "?"}{" "}
                      yrs)
                    </span>
                  </div>
                </div>
                {!viewMember.isAlive && (
                  <div className="flex items-center gap-3">
                    <Calendar size={16} className="text-slate-500" />
                    <div className="text-sm">
                      <span className="opacity-60 block text-xs">
                        Death Date
                      </span>
                      <span className="font-medium">
                        {viewMember.deathDate
                          ? formatDate(viewMember.deathDate)
                          : "Unknown"}
                      </span>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Phone size={16} className="text-green-500" />
                  <div className="text-sm">
                    <span className="opacity-60 block text-xs">Contact</span>
                    <span className="font-medium">
                      {viewMember.contactNo || "N/A"}
                    </span>
                  </div>
                </div>
                {/* Dynamic Data Fields */}
                {viewMember.data &&
                  Object.entries(viewMember.data).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-center gap-3 border-t border-dashed pt-2 mt-2 border-gray-200 dark:border-slate-700"
                    >
                      <Info size={16} className="text-purple-500" />
                      <div className="text-sm">
                        <span className="opacity-60 block text-xs capitalize">
                          {key.replace(/_/g, " ")}
                        </span>
                        <span className="font-medium">{value}</span>
                      </div>
                    </div>
                  ))}
              </div>

              {/* Action Buttons (Permissions Checked) */}
              {(canEdit || canDelete) && (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  {canEdit && (
                    <button
                      onClick={() => openEditModal(viewMember)}
                      className={`flex items-center justify-center gap-2 p-3 rounded-xl font-bold transition ${
                        isDarkMode
                          ? "bg-blue-900/30 text-blue-400 hover:bg-blue-900/50"
                          : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                      }`}
                    >
                      <Pencil size={16} /> Edit
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => initiateDelete(viewMember)}
                      className={`flex items-center justify-center gap-2 p-3 rounded-xl font-bold transition ${
                        isDarkMode
                          ? "bg-red-900/30 text-red-400 hover:bg-red-900/50"
                          : "bg-red-50 text-red-600 hover:bg-red-100"
                      }`}
                    >
                      <Trash2 size={16} /> Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- 2. IMAGE LIGHTBOX (New Requirement) --- */}
        {previewImage && (
          <div
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setPreviewImage(null)}
          >
            <div className="relative max-w-4xl max-h-screen">
              <img
                src={previewImage}
                className="max-w-full max-h-[85vh] rounded-lg shadow-2xl object-contain"
                onClick={(e) => e.stopPropagation()}
              />
              <button
                onClick={() => setPreviewImage(null)}
                className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition"
              >
                <X size={32} />
              </button>
            </div>
          </div>
        )}

        {/* --- EDIT MODAL --- */}
        {editingMember && (
          <div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm p-4"
            onClick={() => setEditingMember(null)}
          >
            <div
              className={`p-6 sm:p-8 rounded-3xl w-full max-w-md shadow-2xl transition-all scale-100 max-h-[90vh] overflow-y-auto custom-scrollbar
                ${
                  isDarkMode
                    ? "bg-slate-900 text-white border border-slate-800"
                    : "bg-white text-slate-900"
                }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Edit Profile</h3>
                <button
                  onClick={() => setEditingMember(null)}
                  className={`p-2 rounded-full transition ${
                    isDarkMode
                      ? "hover:bg-slate-800 text-slate-400"
                      : "hover:bg-slate-100 text-slate-500"
                  }`}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Full Name"
                  className={`w-full border p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition ${
                    isDarkMode
                      ? "bg-slate-800 border-slate-700 placeholder-slate-500 text-white"
                      : "bg-white border-gray-200"
                  }`}
                />

                <select
                  value={formData.gender}
                  onChange={(e) =>
                    setFormData({ ...formData, gender: e.target.value })
                  }
                  className={`w-full border p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition ${
                    isDarkMode
                      ? "bg-slate-800 border-slate-700 text-white"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <option
                    value="male"
                    className={isDarkMode ? "bg-slate-900" : ""}
                  >
                    Male
                  </option>
                  <option
                    value="female"
                    className={isDarkMode ? "bg-slate-900" : ""}
                  >
                    Female
                  </option>
                  <option
                    value="other"
                    className={isDarkMode ? "bg-slate-900" : ""}
                  >
                    Other
                  </option>
                </select>

                <div
                  className={`flex items-center gap-3 p-3 rounded-xl border ${
                    isDarkMode
                      ? "bg-slate-800 border-slate-700"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.isAlive}
                    onChange={(e) =>
                      setFormData({ ...formData, isAlive: e.target.checked })
                    }
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium">
                    Is this person alive?
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold uppercase opacity-60 block mb-1.5 ml-1">
                      Birth Date
                    </label>
                    <input
                      type="date"
                      value={formData.birthDate}
                      onChange={(e) =>
                        setFormData({ ...formData, birthDate: e.target.value })
                      }
                      className={`w-full border p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition ${
                        isDarkMode
                          ? "bg-slate-800 border-slate-700 text-white"
                          : "bg-white border-gray-200"
                      }`}
                    />
                  </div>
                  {!formData.isAlive && (
                    <div>
                      <label className="text-xs font-bold uppercase opacity-60 block mb-1.5 ml-1">
                        Death Date
                      </label>
                      <input
                        type="date"
                        value={formData.deathDate}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            deathDate: e.target.value,
                          })
                        }
                        className={`w-full border p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition ${
                          isDarkMode
                            ? "bg-slate-800 border-slate-700 text-white"
                            : "bg-white border-gray-200"
                        }`}
                      />
                    </div>
                  )}
                </div>

                <input
                  value={formData.contactNo}
                  onChange={(e) =>
                    setFormData({ ...formData, contactNo: e.target.value })
                  }
                  placeholder="Phone Number"
                  className={`w-full border p-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition ${
                    isDarkMode
                      ? "bg-slate-800 border-slate-700 placeholder-slate-500 text-white"
                      : "bg-white border-gray-200"
                  }`}
                />

                {/* File Uploader */}
                <div
                  className={`text-center p-4 rounded-xl border border-dashed ${
                    isDarkMode
                      ? "bg-slate-800/50 border-slate-700"
                      : "bg-slate-50 border-slate-200"
                  }`}
                >
                  <FileUploaderRegular
                    pubkey="8adc52d0c4bb04d5e668"
                    classNameUploader="uc-light uc-purple"
                    sourceList="local, facebook"
                    onFileUploadSuccess={(file) =>
                      setFormData({ ...formData, img: file.cdnUrl })
                    }
                  />
                </div>

                {/* ✅ Buttons: Cancel & Save */}
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => setEditingMember(null)}
                    className={`flex-1 font-bold py-3.5 rounded-xl transition 
                      ${
                        isDarkMode
                          ? "bg-slate-800 hover:bg-slate-700 text-slate-300"
                          : "bg-gray-100 hover:bg-gray-200 text-gray-600"
                      }`}
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

        {/* --- DELETE CONFIRMATION MODAL --- */}
        {deleteTarget && (
          <div
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm p-4"
            onClick={() => setDeleteTarget(null)}
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
                    {deleteTarget.name}
                  </b>
                  ? <br />
                  This will disconnect them from the family tree structure.
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => setDeleteTarget(null)}
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

export default MembersList;
