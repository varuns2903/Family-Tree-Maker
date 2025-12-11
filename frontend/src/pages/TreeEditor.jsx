import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import FamilyTree from '@balkangraph/familytree.js';
import { FileUploaderRegular } from '@uploadcare/react-uploader';
import '@uploadcare/react-uploader/core.css';
import api from '../api/axios';
import ShareModal from '../components/ShareModal';
import StatsModal from '../components/StatsModal'; // ✅ Imported StatsModal
import toast from 'react-hot-toast';
import { ArrowLeft, PieChart, Palette, Moon, Sun, Lock, Share2, Key, TreePine } from 'lucide-react';
import { getInitialTheme, toggleTheme } from '../utils/theme';

const TreeEditor = () => {
  const divRef = useRef(null);
  const treeRef = useRef(null);
  const nodesRef = useRef([]);
  const { treeId } = useParams();
  const navigate = useNavigate();

  // --- GLOBAL STATE ---
  const [nodes, setNodes] = useState([]);
  const [treeName, setTreeName] = useState("Family Tree");
  const [userRole, setUserRole] = useState('viewer');
  const [showShareModal, setShowShareModal] = useState(false);

  // --- UI STATE ---
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarMode, setSidebarMode] = useState("view");
  const [selectedNode, setSelectedNode] = useState(null);

  // --- ADD/EDIT CONTEXT STATE ---
  const [relativeType, setRelativeType] = useState("");
  const [linkChildrenIds, setLinkChildrenIds] = useState([]);

  // --- THEME & STATS STATE ---
  const [isDarkMode, setIsDarkMode] = useState(getInitialTheme);
  const [currentTemplate, setCurrentTemplate] = useState("hugo");
  const [showStats, setShowStats] = useState(false);
  const [stats, setStats] = useState({
    total: 0, male: 0, female: 0, living: 0,
    upcomingBirthdays: [], topZodiac: {}, decadeCounts: {}
  });

  // --- FORM DATA STATE ---
  const [formData, setFormData] = useState({
    name: "", gender: "male", birthDate: "", deathDate: "", isAlive: true,
    img: "", contactNo: "", mid: null, fid: null, pids: [],
    relativeId: null, relationType: null
  });

  const DEFAULT_IMG = "https://ucarecdn.com/db931dbd-59c5-4b4d-a86d-79d9791262ce/user.png";

  // ==================================================================================
  // 1. PERMISSION HELPERS
  // ==================================================================================
  const canEdit = ['owner', 'editor'].includes(userRole);
  const canDelete = userRole === 'owner';
  const isReadOnly = userRole === 'viewer';

  // ==================================================================================
  // 2. HELPER FUNCTIONS
  // ==================================================================================

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const calculateAge = (dob) => {
    if (!dob) return "";
    const diff = Date.now() - new Date(dob).getTime();
    return Math.floor(diff / 31556952000);
  };

  const getZodiacSign = (dateStr) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    const day = date.getDate();
    const month = date.getMonth() + 1;

    if ((month == 1 && day <= 19) || (month == 12 && day >= 22)) return "Capricorn ♑";
    if ((month == 1 && day >= 20) || (month == 2 && day <= 18)) return "Aquarius ♒";
    if ((month == 2 && day >= 19) || (month == 3 && day <= 20)) return "Pisces ♓";
    if ((month == 3 && day >= 21) || (month == 4 && day <= 19)) return "Aries ♈";
    if ((month == 4 && day >= 20) || (month == 5 && day <= 20)) return "Taurus ♉";
    if ((month == 5 && day >= 21) || (month == 6 && day <= 20)) return "Gemini ♊";
    if ((month == 6 && day >= 21) || (month == 7 && day <= 22)) return "Cancer ♋";
    if ((month == 7 && day >= 23) || (month == 8 && day <= 22)) return "Leo ♌";
    if ((month == 8 && day >= 23) || (month == 9 && day <= 22)) return "Virgo ♍";
    if ((month == 9 && day >= 23) || (month == 10 && day <= 22)) return "Libra ♎";
    if ((month == 10 && day >= 23) || (month == 11 && day <= 21)) return "Scorpio ♏";
    if ((month == 11 && day >= 22) || (month == 12 && day >= 21)) return "Sagittarius ♐";
    return null;
  };

  const getRelatives = () => {
    if (!selectedNode) return { parents: [], spouses: [], children: [], siblings: [] };
    const { mid, fid, pids = [], id } = selectedNode;

    const parents = nodes.filter((n) => n.id === mid || n.id === fid);
    const spouses = nodes.filter((n) => pids.includes(n.id));
    const children = nodes.filter((n) => n.fid === id || n.mid === id);
    const siblings = nodes.filter((n) =>
      n.id !== id && ((n.mid && n.mid === mid) || (n.fid && n.fid === fid))
    );

    return { parents, spouses, children, siblings };
  };

  const getSpouses = (node) => {
    if (!node || !node.pids) return [];
    return nodes.filter(n => node.pids.includes(n.id));
  };

  const getSingleParentChildren = () => {
    if (!selectedNode) return [];
    const myChildren = nodes.filter(n => n.mid === selectedNode.id || n.fid === selectedNode.id);
    return myChildren.filter(child => {
      if (selectedNode.gender === 'male') return !child.mid;
      else return !child.fid;
    });
  };

  const calculateStats = () => {
    const total = nodes.length;
    const male = nodes.filter(n => n.gender === 'male').length;
    const female = nodes.filter(n => n.gender === 'female').length;
    const other = nodes.filter(n => n.gender === 'other').length;
    const living = nodes.filter(n => n.isAlive).length;
    const deceased = total - living;

    const currentMonth = new Date().getMonth();
    const upcomingBirthdays = nodes
      .filter(n => n.isAlive && n.birthDate && new Date(n.birthDate).getMonth() === currentMonth)
      .map(n => ({
        name: n.name,
        day: new Date(n.birthDate).getDate(),
        age: calculateAge(n.birthDate) + 1
      }))
      .sort((a, b) => a.day - b.day);

    const zodiacCounts = {};
    const decadeCounts = {};

    nodes.forEach(n => {
      if (n.birthDate) {
        const sign = getZodiacSign(n.birthDate);
        if (sign) zodiacCounts[sign] = (zodiacCounts[sign] || 0) + 1;

        const year = new Date(n.birthDate).getFullYear();
        const decade = Math.floor(year / 10) * 10;
        decadeCounts[decade] = (decadeCounts[decade] || 0) + 1;
      }
    });

    let topZodiac = { sign: '-', count: 0 };
    Object.entries(zodiacCounts).forEach(([sign, count]) => {
      if (count > topZodiac.count) topZodiac = { sign, count };
    });

    setStats({
      total, male, female, other, living, deceased,
      upcomingBirthdays, topZodiac, decadeCounts
    });
    setShowStats(true);
  };

  // ==================================================================================
  // 3. API ACTIONS
  // ==================================================================================

  const loadTreeData = async () => {
    try {
      const membersRes = await api.get(`/trees/${treeId}/members`);
      if (membersRes.data.role) {
        setUserRole(membersRes.data.role);
        setNodes(membersRes.data.members);
      } else {
        setUserRole('owner');
        setNodes(membersRes.data);
      }

      try {
        const treeRes = await api.get(`/trees/${treeId}`);
        setTreeName(treeRes.data.name);
      } catch (err) {
        console.log("Could not fetch tree metadata (likely permission issue)");
      }

    } catch {
      toast.error("Failed to load tree data");
    }
  };

  const requestAccess = async () => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        toast.error("User session not found. Please relogin.");
        return;
      }
      const user = JSON.parse(userStr);
      await api.put(`/trees/${treeId}/role`, { userId: user.id, action: 'request' });
      toast.success("Request sent to owner");
    } catch (e) {
      toast.error("Failed to send request");
    }
  };

  const saveEdit = async () => {
    try {
      const payload = {
        name: formData.name,
        gender: formData.gender,
        birthDate: formData.birthDate,
        deathDate: formData.deathDate,
        isAlive: formData.isAlive,
        img: formData.img,
        contactNo: formData.contactNo,
        mid: formData.mid,
        fid: formData.fid,
        pids: formData.pids
      };

      await api.put(`/trees/${treeId}/members/${selectedNode.id}`, payload);
      toast.success("Updated");
      setSidebarOpen(false);
      loadTreeData();
    } catch {
      toast.error("Update failed");
    }
  };

  const saveNewMember = async () => {
    try {
      const payload = {
        ...formData,
        relativeId: formData.relativeId || (formData.fid || formData.mid ? null : selectedNode?.id) || null,
        relationType: formData.relationType || relativeType || null,
        linkChildrenIds: linkChildrenIds
      };

      await api.post(`/trees/${treeId}/members`, payload);
      toast.success("Added Successfully");
      setSidebarOpen(false);
      loadTreeData();
    } catch (error) {
      console.error(error);
      toast.error("Failed to add member");
    }
  };

  const removeMember = async () => {
    if (!window.confirm("Are you sure? This cannot be undone.")) return;
    try {
      await api.delete(`/trees/${treeId}/members/${selectedNode.id}`);
      toast.success("Removed");
      setSidebarOpen(false);
      loadTreeData();
    } catch {
      toast.error("Delete failed");
    }
  };

  // ==================================================================================
  // 4. UI HANDLERS
  // ==================================================================================

  const openSidebar = (node) => {
    if (!node) return;
    setSelectedNode(node);

    setFormData({
      name: node.name,
      gender: node.gender,
      birthDate: node.birthDate || "",
      deathDate: node.deathDate || "",
      isAlive: node.isAlive ?? true,
      img: node.img || DEFAULT_IMG,
      contactNo: node.contactNo || "",
      mid: node.mid || null,
      fid: node.fid || null,
      pids: node.pids || [],
      relativeId: null,
      relationType: null,
    });
    setSidebarMode(isReadOnly ? "edit" : "view");
    setSidebarOpen(true);
  };

  const handleAddChildClick = () => {
    const spouses = getSpouses(selectedNode);
    if (spouses.length === 0) openAddChildForm(null);
    else setSidebarMode("select-other-parent");
  };

  const openAddChildForm = (otherParentId) => {
    let fatherId = null;
    let motherId = null;

    if (selectedNode.gender === 'male') {
      fatherId = selectedNode.id;
      motherId = otherParentId;
    } else {
      motherId = selectedNode.id;
      fatherId = otherParentId;
    }

    setRelativeType("child");
    setFormData({
      name: "", gender: "male", birthDate: "", deathDate: "", isAlive: true, img: DEFAULT_IMG, contactNo: "",
      fid: fatherId, mid: motherId, relativeId: null, relationType: "child", pids: []
    });
    setSidebarMode("add-form");
  };

  const openGenericAddForm = (type) => {
    if (type === "sibling") {
      if (!selectedNode.fid && !selectedNode.mid) {
        toast.error("Cannot add sibling: This member has no parents recorded. Please add a Father or Mother first.", {
          duration: 4000,
          icon: '⚠️'
        });
        return;
      }
    }

    setRelativeType(type);
    setLinkChildrenIds([]);
    setFormData({
      name: "", gender: type === "mother" ? "female" : "male", birthDate: "", deathDate: "", isAlive: true, img: DEFAULT_IMG, contactNo: "",
      relativeId: selectedNode.id, relationType: type, mid: null, fid: null, pids: []
    });
    setSidebarMode("add-form");
  };

  // ==================================================================================
  // 5. EFFECTS
  // ==================================================================================

  useEffect(() => {
    loadTreeData();
  }, [treeId]);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  useEffect(() => {
    if (divRef.current) {
      if (nodes.length > 0) {
        nodesRef.current = nodes;

        const enriched = nodes.map((n) => ({
          ...n,
          ageDisplay: n.isAlive && n.birthDate
            ? `${calculateAge(n.birthDate)} yrs`
            : n.birthDate ? `Born ${formatDate(n.birthDate)}` : "",
        }));

        divRef.current.innerHTML = '';

        treeRef.current = new FamilyTree(divRef.current, {
          template: currentTemplate,
          mode: isDarkMode ? 'dark' : 'light',
          enableSearch: false,
          toolbar: false,
          mmouseScrool: FamilyTree.action.zoom,   // Enable zoom
          scaleInitial: FamilyTree.match.boundary,  // Auto-fit tree
          scaleMin: 0.3,                         // Minimum zoom
          scaleMax: 2.5,                         // Maximum zoom
          enableDrag: true,       // Allow dragging/panning
          editForm: { readOnly: true },
          nodeMenu: null,
          nodeBinding: {
            field_0: "name",
            field_1: "ageDisplay",
            img_0: "img",
          },
          nodes: enriched
        });

        treeRef.current.on("click", (sender, args) => {
          const nodeId = args?.node?.id;
          if (!nodeId) return false;

          const full = nodesRef.current.find(n => n.id === nodeId);
          if (full) openSidebar(full);
          return false;
        });
      } else {
        divRef.current.innerHTML = '';
        treeRef.current = null;
      }
    }
  }, [nodes, currentTemplate, isDarkMode]);

  const { parents, spouses, children, siblings } = getRelatives();

  // ==================================================================================
  // 6. RENDER
  // ==================================================================================

  return (
    <div className={`w-full h-screen flex overflow-hidden relative transition-colors duration-300
      ${isDarkMode ? 'bg-[#0e0e0e] text-gray-100' : 'bg-gray-100 text-gray-800'}`}>

      {/* TOP TOOLBAR */}
      <div className="absolute top-4 left-4 right-4 z-30 flex justify-between items-center pointer-events-none">

        {/* Back Button & Permissions */}
        <div className="pointer-events-auto flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow-md transition
            ${isDarkMode ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-white/90 text-gray-700 hover:bg-gray-200'}`}>
            <ArrowLeft size={18} /> <span className="hidden sm:inline">Back</span>
          </button>

          <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm
            ${userRole === 'owner' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
              userRole === 'editor' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                'bg-gray-200 text-gray-600 border border-gray-300'}`}>
            {userRole === 'viewer' && <Lock size={12} />} {userRole}
          </div>
        </div>

        {/* Tree Name Badge */}
        <div className={`absolute left-1/2 -translate-x-1/2 pointer-events-auto hidden md:flex items-center gap-2 px-6 py-2 rounded-xl shadow-lg border backdrop-blur-md
          ${isDarkMode ? 'bg-slate-900/80 border-slate-700 text-gray-100' : 'bg-white/80 border-gray-200 text-gray-800'}`}>
          <TreePine size={18} className="text-green-500" />
          <span className="font-bold text-lg max-w-[200px] truncate">{treeName}</span>
        </div>

        {/* Right Actions */}
        <div className="pointer-events-auto flex gap-3">
          <div className="relative group">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition shadow-md
            ${isDarkMode ? 'bg-slate-800 text-gray-200 hover:bg-slate-700' : 'bg-white/90 text-gray-700 hover:bg-gray-200'}`}>
              <Palette size={18} className="text-purple-500" />
              <span className="capitalize">{currentTemplate}</span>
            </div>
            <div className="absolute right-0 top-full pt-2 w-32 hidden group-hover:block z-50">
              <div className={`rounded-lg shadow-xl border overflow-hidden
              ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'}`}>
                {['hugo', 'tommy', 'john'].map(t => (
                  <div key={t} onClick={() => setCurrentTemplate(t)}
                    className={`px-4 py-2 text-sm cursor-pointer capitalize
                    ${currentTemplate === t ? 'font-bold text-blue-500' : ''}
                    ${isDarkMode ? 'text-gray-200 hover:bg-slate-700' : 'text-gray-700 hover:bg-gray-100'}`}>
                    {t}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={() => toggleTheme(isDarkMode, setIsDarkMode)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition shadow-md
            ${isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-white/90 hover:bg-gray-200 text-gray-700'}`}>
            {isDarkMode ? <Moon size={18} /> : <Sun size={18} className="text-orange-500" />}
          </button>

          <button onClick={() => setShowShareModal(true)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition shadow-md
            ${isDarkMode ? 'bg-slate-800 text-gray-200 hover:bg-slate-700 hover:text-blue-400'
                : 'bg-white/90 text-gray-700 hover:bg-gray-200 hover:text-blue-600'}`}>
            <Share2 size={18} />
            <span className="hidden sm:inline font-medium">Share</span>
          </button>

          <button onClick={calculateStats}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition shadow-md
            ${isDarkMode ? 'bg-slate-800 text-gray-200 hover:bg-slate-700 hover:text-green-400'
                : 'bg-white/90 text-gray-700 hover:bg-gray-200 hover:text-green-600'}`}>
            <PieChart size={18} />
            <span className="hidden sm:inline font-medium">Stats</span>
          </button>
        </div>
      </div>

      <div
        ref={divRef}
        className={`flex-1 w-full h-full ${isDarkMode ? 'bg-[#1b1b1b]' : 'bg-gray-50'}`}
      />

      {sidebarOpen && (
        <div className="absolute inset-0 z-50 flex">
          <div
            className="flex-1 bg-black/40"
            onClick={() => setSidebarOpen(false)}
          />

          <div
            className={`w-[350px] h-full border-l p-4 overflow-y-auto shadow-2xl animate-slide-in ${isDarkMode ? 'bg-slate-900 border-slate-700 text-gray-100'
              : 'bg-white text-gray-800 border-gray-200'}`}
            style={{ marginLeft: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className={`text-sm mb-3 transition font-medium
              ${isDarkMode ? 'text-red-400 hover:text-red-500' : 'text-red-600 hover:text-red-800'}`}
              onClick={() => setSidebarOpen(false)}>
              ✕ Close
            </button>

            {sidebarMode === "view" && selectedNode && (
              <div>
                <img src={selectedNode.img || DEFAULT_IMG}
                  className="w-36 h-36 rounded-full mx-auto shadow-md mb-4 object-cover" />
                <h2 className="text-2xl font-bold text-center">{selectedNode.name}</h2>

                <p className={`text-center mb-3 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {selectedNode.gender === 'male' ? '♂ Male' :
                    selectedNode.gender === 'female' ? '♀ Female' : '⚧ Other'}
                  <br />
                  {selectedNode.isAlive
                    ? `${calculateAge(selectedNode.birthDate)} yrs old`
                    : 'Deceased'}
                </p>

                <div className={`text-sm p-3 rounded-lg mb-4
                  ${isDarkMode ? 'bg-slate-800 text-gray-300' : 'bg-gray-50 text-gray-700'}`}>
                  {parents.length > 0 && (
                    <div>
                      <strong className="text-xs uppercase block opacity-70">Parents</strong>
                      {parents.map(p => (
                        <div key={p.id} className="cursor-pointer hover:underline text-blue-400" onClick={() => openSidebar(p)}>
                          {p.name}
                        </div>
                      ))}
                    </div>
                  )}
                  {spouses.length > 0 && (
                    <div className="mt-3">
                      <strong className="text-xs uppercase block opacity-70">Spouse</strong>
                      {spouses.map(s => (
                        <div key={s.id} className="cursor-pointer hover:underline text-pink-400" onClick={() => openSidebar(s)}>
                          ❤️ {s.name}
                        </div>
                      ))}
                    </div>
                  )}
                  {siblings.length > 0 && (
                    <div className="mt-3">
                      <strong className="text-xs uppercase block opacity-70">Siblings</strong>
                      {siblings.map(s => (
                        <div key={s.id} className="cursor-pointer hover:underline text-purple-400" onClick={() => openSidebar(s)}>
                          {s.gender === 'female' ? '🌸' : '🔹'} {s.name}
                        </div>
                      ))}
                    </div>
                  )}
                  {children.length > 0 && (
                    <div className="mt-3">
                      <strong className="text-xs uppercase block opacity-70">Children</strong>
                      {children.map(c => (
                        <div key={c.id} className="cursor-pointer hover:underline text-green-400" onClick={() => openSidebar(c)}>
                          👶 {c.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-4 space-y-2">
                  {canEdit && (
                    <button className={`w-full p-2 rounded transition font-medium ${isDarkMode ? 'bg-blue-700 hover:bg-blue-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`} onClick={() => setSidebarMode("edit")}>
                      Edit Profile
                    </button>
                  )}
                  {canEdit && (
                    <button className={`w-full p-2 rounded transition font-medium ${isDarkMode ? 'bg-green-700 hover:bg-green-600 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}`} onClick={() => setSidebarMode("add-select")}>
                      Add Relative
                    </button>
                  )}
                  {canDelete && (
                    <button className={`w-full p-2 rounded transition font-medium border ${isDarkMode ? 'border-red-700 text-red-400 hover:bg-red-900/30' : 'border-red-300 text-red-700 hover:bg-red-50'}`} onClick={removeMember}>
                      Remove Member
                    </button>
                  )}
                  {!canEdit && (
                    <div className={`text-center text-xs p-2 italic opacity-60 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      View only mode. <button onClick={requestAccess} className="underline text-blue-500">Request Edit Access</button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* --- EDIT / ADD FORMS (Sidebar content) --- */}
            {sidebarMode === "edit" && (
              <div className="space-y-4">
                <h3 className="font-bold text-lg mb-3">Edit Member</h3>

                {isReadOnly && (
                  <div className={`p-3 rounded text-sm flex justify-between items-center ${isDarkMode ? 'bg-orange-900/30 text-orange-200' : 'bg-orange-100 text-orange-800'}`}>
                    <span className="flex items-center gap-2"><Lock size={14} /> View Only Mode</span>
                    <button onClick={requestAccess} className="underline font-bold hover:opacity-80">Request Edit</button>
                  </div>
                )}

                <input
                  disabled={isReadOnly}
                  className={`border p-2 w-full rounded ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''} ${isDarkMode ? 'bg-slate-800 border-slate-700' : ''}`}
                  placeholder="Name" value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />

                <select
                  disabled={isReadOnly}
                  className={`border p-2 w-full rounded ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''} ${isDarkMode ? 'bg-slate-800 border-slate-700' : ''}`}
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}>
                  <option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
                </select>

                <label className={`flex items-center gap-2 text-sm ${isReadOnly ? 'opacity-50' : ''}`}>
                  <input type="checkbox" disabled={isReadOnly} checked={formData.isAlive} onChange={(e) => setFormData({ ...formData, isAlive: e.target.checked, deathDate: e.target.checked ? "" : formData.deathDate })} /> Is Alive
                </label>

                <input
                  type="date"
                  disabled={isReadOnly}
                  className={`border p-2 w-full rounded ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''} ${isDarkMode ? 'bg-slate-800 border-slate-700' : ''}`}
                  value={formData.birthDate}
                  onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                />

                {!formData.isAlive && (
                  <input
                    type="date"
                    disabled={isReadOnly}
                    className={`border p-2 w-full rounded ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''} ${isDarkMode ? 'bg-slate-800 border-slate-700' : ''}`}
                    value={formData.deathDate}
                    onChange={(e) => setFormData({ ...formData, deathDate: e.target.value })}
                  />
                )}

                <input
                  disabled={isReadOnly}
                  className={`border p-2 w-full rounded ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''} ${isDarkMode ? 'bg-slate-800 border-slate-700' : ''}`}
                  placeholder="Phone" value={formData.contactNo}
                  onChange={(e) => setFormData({ ...formData, contactNo: e.target.value })}
                />

                {!isReadOnly && (
                  <div className={`text-center p-4 rounded ${isDarkMode ? 'bg-slate-800' : 'bg-gray-50'}`}>
                    <div className="flex justify-center">
                      <FileUploaderRegular pubkey="8adc52d0c4bb04d5e668" classNameUploader="uc-light uc-purple" sourceList="local, camera, facebook" onFileUploadSuccess={(fileInfo) => { setFormData({ ...formData, img: fileInfo.cdnUrl }); toast.success("Image uploaded"); }} />
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <button className={`flex-1 p-2 rounded transition font-medium ${isDarkMode ? 'bg-slate-700 hover:bg-slate-600 text-gray-200' : 'bg-gray-300 hover:bg-gray-200 text-black'}`} onClick={() => setSidebarMode("view")}>Cancel</button>

                  {!isReadOnly && (
                    <button className={`flex-1 p-2 rounded transition font-medium ${isDarkMode ? 'bg-blue-700 hover:bg-blue-600 text:white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`} onClick={saveEdit}>Save</button>
                  )}
                </div>
              </div>
            )}

            {sidebarMode === "add-select" && canEdit && (
              <div className="space-y-3">
                <h3 className={`font-bold text-lg mb-4 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>What relationship?</h3>
                <button className={`w-full p-3 border rounded text-left flex items-center justify-between group transition ${isDarkMode ? 'bg-blue-900/30 border-blue-800 hover:bg-blue-900/50 text-blue-100' : 'bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-900'}`} onClick={handleAddChildClick}>
                  <span>Add Child</span><span className="group-hover:translate-x-1 transition">→</span>
                </button>
                {["spouse", "sibling", "father", "mother"].map((r) => (
                  <button key={r} className={`w-full p-3 border rounded text-left capitalize flex items-center justify-between group transition ${isDarkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-gray-300' : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-700'}`} onClick={() => openGenericAddForm(r)}>
                    <span>Add {r}</span><span className="opacity-50 group-hover:translate-x-1 transition">→</span>
                  </button>
                ))}
                <button className={`w-full p-2 mt-4 rounded transition ${isDarkMode ? 'text-gray-400 hover:bg-slate-800' : 'text-gray-500 hover:bg-gray-100'}`} onClick={() => setSidebarMode("view")}>Cancel</button>
              </div>
            )}

            {sidebarMode === "select-other-parent" && canEdit && (
              <div className="space-y-3">
                <h3 className={`font-bold text-lg ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Select Co-Parent</h3>
                {getSpouses(selectedNode).map(spouse => (
                  <button key={spouse.id} className={`flex items:center gap-3 w-full p-3 border rounded transition text-left ${isDarkMode ? 'border-slate-700 hover:bg-slate-800 text-gray-200' : 'border-gray-200 hover:bg-blue-50 text-gray-800'}`} onClick={() => openAddChildForm(spouse.id)}>
                    <img src={spouse.img || DEFAULT_IMG} className="w-10 h-10 rounded-full object-cover" /><span className="font-medium">{spouse.name}</span>
                  </button>
                ))}
                <button className={`w-full p-3 border border-dashed rounded mt-2 text-sm transition ${isDarkMode ? 'border-slate-700 text-gray-400 hover:bg-slate-800' : 'border-gray-300 text-gray-500 hover:bg-gray-100'}`} onClick={() => openAddChildForm(null)}>Unknown / Not Listed</button>
                <button className={`w-full p-2 mt-4 rounded transition ${isDarkMode ? 'text-gray-400 hover:bg-slate-800' : 'text-gray-500 hover:bg-gray-100'}`} onClick={() => setSidebarMode("add-select")}>Back</button>
              </div>
            )}

            {sidebarMode === "add-form" && canEdit && (
              <div className="space-y-4">
                <h3 className={`font-bold text-lg capitalize ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Add {relativeType || "Member"}</h3>
                {formData.mid && formData.fid && (<div className={`text-xs p-2 rounded border mb-2 ${isDarkMode ? 'bg-blue-900/30 text-blue-200 border-blue-800' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>Adding child to <b>{selectedNode.name}</b> and partner.</div>)}
                <input className={`border p-2 w-full rounded ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-gray-500' : ''}`} placeholder="Full Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                <select className={`border p-2 w-full rounded ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : ''}`} value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })}>
                  <option value="male">Male ♂</option><option value="female">Female ♀</option><option value="other">Other ⚧</option>
                </select>
                <input type="date" className={`border p-2 w-full rounded ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : ''}`} value={formData.birthDate} onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })} />
                <label className={`flex items-center gap-2 text-sm p-2 rounded ${isDarkMode ? 'bg-slate-800 text-gray-200' : 'bg-gray-50 text-gray-800'}`}><input type="checkbox" checked={formData.isAlive} onChange={(e) => setFormData({ ...formData, isAlive: e.target.checked, deathDate: e.target.checked ? "" : formData.deathDate })} />Is this person alive?</label>
                {!formData.isAlive && (<input type="date" className={`border p-2 w-full rounded ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : ''}`} value={formData.deathDate} onChange={(e) => setFormData({ ...formData, deathDate: e.target.value })} />)}
                <input className={`border p-2 w-full rounded ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-gray-500' : ''}`} placeholder="Phone Number" value={formData.contactNo} onChange={(e) => setFormData({ ...formData, contactNo: e.target.value })} />

                {relativeType === 'spouse' && getSingleParentChildren().length > 0 && (
                  <div className={`p-3 rounded border ${isDarkMode ? 'bg-yellow-900/20 border-yellow-800' : 'bg-yellow-50 border-yellow-200'}`}>
                    <p className={`text-sm font-bold mb-2 ${isDarkMode ? 'text-yellow-500' : 'text-yellow-800'}`}>Link existing children?</p>
                    <div className="space-y-2">{getSingleParentChildren().map(child => (
                      <label key={child.id} className={`flex items-center gap-2 cursor-pointer ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}><input type="checkbox" checked={linkChildrenIds.includes(child.id)} onChange={(e) => { if (e.target.checked) setLinkChildrenIds([...linkChildrenIds, child.id]); else setLinkChildrenIds(linkChildrenIds.filter(id => id !== child.id)); }} /><span className="text-sm">{child.name}</span></label>
                    ))}</div>
                  </div>
                )}

                <div className={`text-center p-4 rounded ${isDarkMode ? 'bg-slate-800' : 'bg-gray-50'}`}><div className="flex justify-center"><FileUploaderRegular pubkey="8adc52d0c4bb04d5e668" classNameUploader="uc-light uc-purple" sourceList="local, camera, facebook" onFileUploadSuccess={(fileInfo) => { setFormData({ ...formData, img: fileInfo.cdnUrl }); toast.success("Image uploaded"); }} /></div></div>
                <div className="flex gap-2 pt-4"><button className={`flex-1 p-2 rounded transition font-medium ${isDarkMode ? 'bg-slate-700 hover:bg-slate-600 text-gray-200' : 'bg-gray-300 hover:bg-gray-200 text-black'}`} onClick={() => setSidebarMode("view")}>Cancel</button><button className={`flex-1 p-2 rounded transition font-medium ${isDarkMode ? 'bg-green-700 hover:bg-green-600 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}`} onClick={saveNewMember}>Save</button></div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* --- ✅ NEW: STATS MODAL (Extracted) --- */}
      <StatsModal
        isOpen={showStats}
        onClose={() => setShowStats(false)}
        stats={stats}
        isDarkMode={isDarkMode}
      />

      {/* --- SHARE MODAL --- */}
      {showShareModal && <ShareModal treeId={treeId} onClose={() => setShowShareModal(false)} />}

      {/* --- EMPTY STATE --- */}
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          {canEdit ? (
            <button className="pointer-events-auto bg-blue-600 text-white px-8 py-4 rounded-full shadow-2xl text-lg font-bold hover:bg-blue-700 transition animate-bounce"
              onClick={() => { setSelectedNode({ id: null }); setSidebarMode("add-form"); setFormData({ name: "Root Ancestor", gender: "male", birthDate: "", isAlive: true, img: DEFAULT_IMG, contactNo: "", fid: null, mid: null, pids: [], relativeId: null, relationType: null }); setSidebarOpen(true); }}>
              + Start Family Tree
            </button>
          ) : (
            <div className={`p-6 rounded-xl text-center pointer-events-auto shadow-lg border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-gray-300' : 'bg-white border-gray-200 text-gray-600'}`}>
              <Lock className="mx-auto mb-2 opacity-50" size={32} />
              <p className="font-medium text-lg">This family tree is empty.</p>
              <p className="text-sm opacity-75 mb-4">You do not have permission to add the first member.</p>

              {/* ✅ ADDED REQUEST BUTTON FOR VIEWERS */}
              <button
                onClick={requestAccess}
                className={`flex items-center gap-2 mx-auto px-4 py-2 rounded-lg font-medium transition shadow-md
                ${isDarkMode ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
                <Key size={16} /> Request Edit Access
              </button>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default TreeEditor;