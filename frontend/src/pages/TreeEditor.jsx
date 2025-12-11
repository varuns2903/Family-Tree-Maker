import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import FamilyTree from '@balkangraph/familytree.js';
import { FileUploaderRegular } from '@uploadcare/react-uploader';
import '@uploadcare/react-uploader/core.css';
import api from '../api/axios';
import ShareModal from '../components/ShareModal';
import StatsModal from '../components/StatsModal';
import toast from 'react-hot-toast';
import { ArrowLeft, PieChart, Palette, X, Moon, Sun, Lock, Share2, Key, TreePine, Link as LinkIcon, Search, AlertTriangle, List } from 'lucide-react'; // ✅ Added List Icon
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

  // ✅ DELETE CONFIRMATION STATE
  const [deleteTargetNode, setDeleteTargetNode] = useState(null);

  // --- ADD/EDIT CONTEXT STATE ---
  const [relativeType, setRelativeType] = useState("");
  const [linkChildrenIds, setLinkChildrenIds] = useState([]);

  // --- LINK SEARCH STATE ---
  const [searchLinkQuery, setSearchLinkQuery] = useState("");

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
        const year = new Date(n.birthDate).getFullYear();
        const decade = Math.floor(year / 10) * 10;
        decadeCounts[decade] = (decadeCounts[decade] || 0) + 1;
      }
    });

    setStats({
      total, male, female, other, living, deceased,
      upcomingBirthdays, decadeCounts
    });
    setShowStats(true);
  };

  // ==================================================================================
  // 3. API ACTIONS
  // ==================================================================================

  const hasCycle = (nodes) => {
    const parentMap = new Map();
    nodes.forEach(n => parentMap.set(n.id, { mid: n.mid, fid: n.fid }));
    const visit = (id, visited = new Set()) => {
      if (!id) return false;
      if (visited.has(id)) return true;
      const nextVisited = new Set(visited);
      nextVisited.add(id);
      const parents = parentMap.get(id);
      if (!parents) return false;
      if (visit(parents.mid, nextVisited)) return true;
      if (visit(parents.fid, nextVisited)) return true;
      return false;
    };
    for (const node of nodes) {
      if (visit(node.id)) return true;
    }
    return false;
  };

  const loadTreeData = async () => {
    try {
      const membersRes = await api.get(`/trees/${treeId}/members`);
      let fetchedNodes = [];
      if (membersRes.data.role) {
        setUserRole(membersRes.data.role);
        fetchedNodes = membersRes.data.members;
      } else {
        setUserRole('owner');
        fetchedNodes = membersRes.data;
      }

      const cleanNodes = fetchedNodes.map(n => ({
        ...n,
        mid: n.mid === n.id ? null : n.mid,
        fid: n.fid === n.id ? null : n.fid
      }));

      cleanNodes.sort((a, b) => {
        if (a.birthDate && b.birthDate) return new Date(a.birthDate) - new Date(b.birthDate);
        return 0;
      });

      if (hasCycle(cleanNodes)) {
        toast.error("Critical Error: Infinite Loop detected!", { duration: 6000 });
        setNodes([]);
        return;
      }

      setNodes(cleanNodes);

      try {
        const treeRes = await api.get(`/trees/${treeId}`);
        setTreeName(treeRes.data.name);
      } catch (err) { }

    } catch {
      toast.error("Failed to load tree data");
    }
  };

  const requestAccess = async () => {
    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) { toast.error("Please login."); return; }
      const user = JSON.parse(userStr);
      await api.put(`/trees/${treeId}/role`, { userId: user.id, action: 'request' });
      toast.success("Request sent to owner");
    } catch (e) { toast.error("Failed to send request"); }
  };

  const saveEdit = async () => {
    if (formData.birthDate && !formData.isAlive && formData.deathDate) {
      if (new Date(formData.birthDate) > new Date(formData.deathDate)) {
        toast.error("Date Error: Death date cannot be earlier than birth date!");
        return;
      }
    }

    try {
      const payload = {
        name: formData.name, gender: formData.gender, birthDate: formData.birthDate,
        deathDate: formData.deathDate, isAlive: formData.isAlive, img: formData.img,
        contactNo: formData.contactNo, mid: formData.mid, fid: formData.fid, pids: formData.pids
      };
      await api.put(`/trees/${treeId}/members/${selectedNode.id}`, payload);
      toast.success("Updated");
      setSidebarOpen(false);
      loadTreeData();
    } catch { toast.error("Update failed"); }
  };

  const saveNewMember = async () => {
    if (formData.birthDate && !formData.isAlive && formData.deathDate) {
      if (new Date(formData.birthDate) > new Date(formData.deathDate)) {
        toast.error("Date Error: Death date cannot be earlier than birth date!");
        return;
      }
    }

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
    } catch (error) { console.error(error); toast.error("Failed to add member"); }
  };

  const confirmDelete = async () => {
    if (!deleteTargetNode) return;
    try {
      await api.delete(`/trees/${treeId}/members/${deleteTargetNode.id}`);
      toast.success("Removed");
      setSidebarOpen(false);
      loadTreeData();
    } catch { toast.error("Delete failed"); }
    finally { setDeleteTargetNode(null); }
  };

  const initiateDelete = () => { setDeleteTargetNode(selectedNode); };

  const handleLinkMember = async (targetId) => {
    try {
      await api.put(`/trees/${treeId}/members/link`, {
        memberId: selectedNode.id, relativeId: targetId, relationship: relativeType
      });
      toast.success("Members Linked!");
      setSidebarOpen(false);
      loadTreeData();
    } catch (err) { toast.error(err.response?.data?.message || "Failed to link members"); }
  };

  // ==================================================================================
  // 4. UI HANDLERS
  // ==================================================================================

  const getLinkCandidates = () => {
    return nodes.filter(n => {
      if (n.id === selectedNode.id) return false;
      if (!n.name.toLowerCase().includes(searchLinkQuery.toLowerCase())) return false;
      if (relativeType === 'father' && n.gender !== 'male') return false;
      if (relativeType === 'mother' && n.gender !== 'female') return false;
      if (selectedNode.pids && selectedNode.pids.includes(n.id)) return false;
      if (selectedNode.mid === n.id || selectedNode.fid === n.id) return false;
      if (n.mid === selectedNode.id || n.fid === selectedNode.id) return false;
      return true;
    });
  };

  const openSidebar = (node) => {
    if (!node) return;
    setSelectedNode(node);
    setFormData({
      name: node.name, gender: node.gender, birthDate: node.birthDate || "",
      deathDate: node.deathDate || "", isAlive: node.isAlive ?? true,
      img: node.img || DEFAULT_IMG, contactNo: node.contactNo || "",
      mid: node.mid || null, fid: node.fid || null, pids: node.pids || [],
      relativeId: null, relationType: null,
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
    let fatherId = null, motherId = null;
    if (selectedNode.gender === 'male') { fatherId = selectedNode.id; motherId = otherParentId; }
    else { motherId = selectedNode.id; fatherId = otherParentId; }
    setRelativeType("child");
    setFormData({
      name: "", gender: "male", birthDate: "", deathDate: "", isAlive: true, img: DEFAULT_IMG,
      contactNo: "", fid: fatherId, mid: motherId, relativeId: null, relationType: "child", pids: []
    });
    setSidebarMode("add-form");
  };

  const openGenericAddForm = (type) => {
    if (type === "sibling") {
      if (!selectedNode.fid && !selectedNode.mid) {
        toast.error("Cannot add sibling: This member has no parents recorded. Please add a Father or Mother first.", { duration: 4000, icon: '⚠️' });
        return;
      }
    }
    setRelativeType(type);
    setLinkChildrenIds([]);
    let defaultGender = "male";
    if (type === "mother") defaultGender = "female";
    if (type === "father") defaultGender = "male";
    if (type === "spouse") defaultGender = selectedNode.gender === "male" ? "female" : "male";

    setFormData({
      name: "", gender: defaultGender, birthDate: "", deathDate: "", isAlive: true, img: DEFAULT_IMG,
      contactNo: "", relativeId: selectedNode.id, relationType: type, mid: null, fid: null, pids: []
    });
    setSidebarMode("add-form");
  };

  // ==================================================================================
  // 5. EFFECTS
  // ==================================================================================

  useEffect(() => { loadTreeData(); }, [treeId]);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  useEffect(() => {
    if (divRef.current) {
      nodesRef.current = nodes;
      if (nodes.length > 0) {
        const enriched = nodes.map((n) => ({
          ...n,
          ageDisplay: n.isAlive && n.birthDate ? `${calculateAge(n.birthDate)} yrs` : n.birthDate ? `Born ${formatDate(n.birthDate)}` : "",
        }));
        divRef.current.innerHTML = '';
        treeRef.current = new FamilyTree(divRef.current, {
          template: currentTemplate,
          mode: isDarkMode ? 'dark' : 'light',
          enableSearch: false, toolbar: false,
          mouseScrool: FamilyTree.action.zoom,
          scaleInitial: FamilyTree.match.boundary, scaleMin: 0.2, scaleMax: 2.5,
          enableDrag: true, editForm: { readOnly: true }, nodeMenu: null,
          levelSeparation: 50, siblingSeparation: 50, subtreeSeparation: 50,
          layout: FamilyTree.layout.normal,
          nodeBinding: { field_0: "name", field_1: "ageDisplay", img_0: "img" },
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
        
        {/* LEFT: Back + Permission */}
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

        {/* CENTER: Title */}
        <div className={`absolute left-1/2 -translate-x-1/2 pointer-events-auto hidden md:flex items-center gap-2 px-6 py-2 rounded-xl shadow-lg border backdrop-blur-md
          ${isDarkMode ? 'bg-slate-900/80 border-slate-700 text-gray-100' : 'bg-white/80 border-gray-200 text-gray-800'}`}>
          <TreePine size={18} className="text-green-500" />
          <span className="font-bold text-lg max-w-[200px] truncate">{treeName}</span>
        </div>

        {/* RIGHT: Actions */}
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
          
          <button onClick={() => toggleTheme(isDarkMode, setIsDarkMode)} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition shadow-md ${isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-white/90 hover:bg-gray-200 text-gray-700'}`}>
            {isDarkMode ? <Moon size={18} /> : <Sun size={18} className="text-orange-500" />}
          </button>
          
          <button onClick={() => setShowShareModal(true)} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition shadow-md ${isDarkMode ? 'bg-slate-800 text-gray-200 hover:bg-slate-700 hover:text-blue-400' : 'bg-white/90 text-gray-700 hover:bg-gray-200 hover:text-blue-600'}`}>
            <Share2 size={18} /> <span className="hidden sm:inline font-medium">Share</span>
          </button>
          
          <button onClick={calculateStats} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition shadow-md ${isDarkMode ? 'bg-slate-800 text-gray-200 hover:bg-slate-700 hover:text-green-400' : 'bg-white/90 text-gray-700 hover:bg-gray-200 hover:text-green-600'}`}>
            <PieChart size={18} /> <span className="hidden sm:inline font-medium">Stats</span>
          </button>

          {/* ✅ LIST VIEW BUTTON */}
          <button 
            onClick={() => navigate(`/tree/${treeId}/list`)} 
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition shadow-md 
            ${isDarkMode ? 'bg-slate-800 text-gray-200 hover:bg-slate-700 hover:text-purple-400' : 'bg-white/90 text-gray-700 hover:bg-gray-200 hover:text-purple-600'}`}
            title="List View"
          >
            <List size={18} /> <span className="hidden sm:inline font-medium">List</span>
          </button>
        </div>
      </div>

      <div ref={divRef} className={`flex-1 w-full h-full ${isDarkMode ? 'bg-[#1b1b1b]' : 'bg-gray-50'}`} />

      {/* --- SIDEBAR --- */}
      {sidebarOpen && (
        <div className="absolute inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className={`relative w-full max-w-[380px] h-full shadow-2xl transform transition-transform duration-300 ease-in-out
              ${isDarkMode ? 'bg-slate-900 border-l border-slate-700 text-gray-100' : 'bg-white border-l border-gray-200 text-gray-800'}`} onClick={(e) => e.stopPropagation()}>
            <div className="h-full overflow-y-auto p-6 custom-scrollbar">
              
              <button className={`flex items-center gap-1 text-sm mb-6 font-medium transition-colors px-3 py-1.5 rounded-lg w-fit
                  ${isDarkMode ? 'text-red-400 hover:text-red-300 hover:bg-red-900/20' : 'text-red-600 hover:text-red-700 hover:bg-red-50'}`} onClick={() => setSidebarOpen(false)}>
                <X size={16} /> Close
              </button>

              {/* VIEW MODE */}
              {sidebarMode === "view" && selectedNode && (
                <div className="animate-fade-in">
                  <div className="flex flex-col items-center mb-6">
                    <div className="relative group cursor-pointer">
                      <img src={selectedNode.img || DEFAULT_IMG} className={`w-32 h-32 rounded-full object-cover shadow-lg mb-4 border-4 transition-all ${isDarkMode ? 'border-slate-800 group-hover:border-slate-700' : 'border-white group-hover:border-blue-50'}`} />
                      <span className={`absolute bottom-4 right-2 w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] shadow-sm ${isDarkMode ? 'border-slate-900' : 'border-white'} ${selectedNode.isAlive ? 'bg-green-500' : 'bg-gray-400'}`} title={selectedNode.isAlive ? "Alive" : "Deceased"} />
                    </div>
                    <h2 className="text-2xl font-bold text-center leading-tight">{selectedNode.name}</h2>
                    <div className={`flex flex-wrap justify-center gap-2 mt-3 text-xs font-medium px-4 py-1.5 rounded-full border w-fit mx-auto ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-gray-100 border-gray-200 text-gray-600'}`}>
                      <span>{selectedNode.gender === 'male' ? 'Male ♂' : selectedNode.gender === 'female' ? 'Female ♀' : 'Other ⚧'}</span>
                      <span className="opacity-50">•</span>
                      <span>{selectedNode.isAlive ? `${calculateAge(selectedNode.birthDate)} yrs` : 'Deceased'}</span>
                    </div>
                  </div>

                  <div className={`p-4 rounded-xl mb-6 text-sm border space-y-4 ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-gray-50 border-gray-100'}`}>
                    {parents.length > 0 && (<div><strong className="text-xs uppercase tracking-wider opacity-50 block mb-2">Parents</strong><div className="flex flex-wrap gap-2">{parents.map(p => (<span key={p.id} className="cursor-pointer hover:underline text-blue-500 font-medium" onClick={() => openSidebar(p)}>{p.name}</span>))}</div></div>)}
                    {spouses.length > 0 && (<div><strong className="text-xs uppercase tracking-wider opacity-50 block mb-2">Spouse</strong><div className="flex flex-wrap gap-2">{spouses.map(s => (<span key={s.id} className="cursor-pointer hover:underline text-pink-500 font-medium flex items-center gap-1" onClick={() => openSidebar(s)}>❤️ {s.name}</span>))}</div></div>)}
                    {children.length > 0 && (<div><strong className="text-xs uppercase tracking-wider opacity-50 block mb-2">Children</strong><div className="flex flex-wrap gap-2">{children.map(c => (<span key={c.id} className="cursor-pointer hover:underline text-green-500 font-medium" onClick={() => openSidebar(c)}>{c.name}</span>))}</div></div>)}
                    {siblings.length > 0 && (<div><strong className="text-xs uppercase tracking-wider opacity-50 block mb-2">Siblings</strong><div className="flex flex-wrap gap-2">{siblings.map(s => (<span key={s.id} className="cursor-pointer hover:underline text-purple-500 font-medium" onClick={() => openSidebar(s)}>{s.name}</span>))}</div></div>)}
                  </div>

                  <div className="space-y-3">
                    {canEdit && (
                      <div className="grid grid-cols-2 gap-3">
                        <button className={`p-2.5 rounded-lg transition font-medium text-sm flex justify-center items-center gap-2 ${isDarkMode ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-blue-100 hover:bg-blue-200 text-blue-700'}`} onClick={() => setSidebarMode("edit")}>Edit Profile</button>
                        <button className={`p-2.5 rounded-lg transition font-medium text-sm flex justify-center items-center gap-2 ${isDarkMode ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-green-100 hover:bg-green-200 text-green-700'}`} onClick={() => setSidebarMode("add-select")}>Add Relative</button>
                      </div>
                    )}
                    {canDelete && (<button className={`w-full p-2.5 rounded-lg transition font-medium text-sm border flex justify-center items-center gap-2 ${isDarkMode ? 'border-red-900 text-red-400 hover:bg-red-900/20' : 'border-red-200 text-red-600 hover:bg-red-50'}`} onClick={initiateDelete}>Remove Member</button>)}
                    {!canEdit && (<div className={`text-center text-xs p-3 rounded-lg border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-gray-400' : 'bg-gray-50 border-gray-100 text-gray-500'}`}>View only mode. <button onClick={requestAccess} className="underline text-blue-500 hover:text-blue-600">Request Edit Access</button></div>)}
                  </div>
                </div>
              )}

              {/* ... (EDIT / ADD / LINK SEARCH MODES from previous step - no changes needed there) ... */}
              {/* EDIT MODE */}
              {sidebarMode === "edit" && (
                <div className="space-y-5 animate-fade-in">
                  <h3 className="font-bold text-xl mb-4">Edit Profile</h3>
                  {isReadOnly && (<div className={`p-3 rounded-lg text-sm flex justify-between items-center ${isDarkMode ? 'bg-orange-900/30 text-orange-200 border border-orange-800' : 'bg-orange-50 text-orange-800 border border-orange-100'}`}><span className="flex items-center gap-2"><Lock size={14} /> Read Only</span><button onClick={requestAccess} className="underline font-bold text-xs hover:opacity-80">Request Edit</button></div>)}
                  <div className="space-y-4">
                    <div><label className="text-xs font-semibold uppercase opacity-50 mb-1 block">Full Name</label><input disabled={isReadOnly} className={`w-full p-3 rounded-lg outline-none border transition-all focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-transparent' : 'bg-gray-50 border-gray-200 text-gray-900'}`} placeholder="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
                    <div><label className="text-xs font-semibold uppercase opacity-50 mb-1 block">Gender</label><select disabled={isReadOnly} className={`w-full p-3 rounded-lg outline-none border transition-all focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-transparent' : 'bg-gray-50 border-gray-200 text-gray-900'}`} value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })}><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></div>
                    <label className={`flex items-center gap-2 text-sm p-3 rounded-lg border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-200'}`}><input type="checkbox" disabled={isReadOnly} checked={formData.isAlive} onChange={(e) => setFormData({ ...formData, isAlive: e.target.checked, deathDate: e.target.checked ? "" : formData.deathDate })} /> Is this person alive?</label>
                    <div><label className="text-xs font-semibold uppercase opacity-50 mb-1 block">Birth Date</label><input type="date" disabled={isReadOnly} className={`w-full p-3 rounded-lg outline-none border transition-all focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-transparent' : 'bg-gray-50 border-gray-200 text-gray-900'}`} value={formData.birthDate} onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })} /></div>
                    {!formData.isAlive && (<div><label className="text-xs font-semibold uppercase opacity-50 mb-1 block">Death Date</label><input type="date" disabled={isReadOnly} className={`w-full p-3 rounded-lg outline-none border transition-all focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-transparent' : 'bg-gray-50 border-gray-200 text-gray-900'}`} value={formData.deathDate} onChange={(e) => setFormData({ ...formData, deathDate: e.target.value })} /></div>)}
                    <div><label className="text-xs font-semibold uppercase opacity-50 mb-1 block">Phone</label><input disabled={isReadOnly} className={`w-full p-3 rounded-lg outline-none border transition-all focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-transparent' : 'bg-gray-50 border-gray-200 text-gray-900'}`} placeholder="Phone" value={formData.contactNo} onChange={(e) => setFormData({ ...formData, contactNo: e.target.value })} /></div>
                    {!isReadOnly && (<div className={`text-center p-4 rounded-lg border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-200'}`}><FileUploaderRegular pubkey="8adc52d0c4bb04d5e668" classNameUploader="uc-light uc-purple" sourceList="local, camera, facebook" onFileUploadSuccess={(fileInfo) => { setFormData({ ...formData, img: fileInfo.cdnUrl }); toast.success("Image uploaded"); }} /></div>)}
                    <div className="flex gap-3 pt-2"><button className={`flex-1 p-3 rounded-lg font-medium transition-colors ${isDarkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-gray-200 hover:bg-gray-300'}`} onClick={() => setSidebarMode("view")}>Cancel</button>{!isReadOnly && (<button className={`flex-1 p-3 rounded-lg font-medium transition-colors bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30`} onClick={saveEdit}>Save Changes</button>)}</div>
                  </div>
                </div>
              )}

              {/* ADD SELECT MODE */}
              {sidebarMode === "add-select" && canEdit && (
                <div className="space-y-4 animate-fade-in">
                  <h3 className="font-bold text-xl mb-4">Add Relative</h3>
                  
                  {/* Child */}
                  <div className="flex gap-2">
                    <button className={`flex-1 p-4 border rounded-xl text-left flex items-center justify-between group transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 hover:border-blue-500 hover:bg-slate-750' : 'bg-white border-gray-200 hover:border-blue-400 hover:shadow-md'}`} onClick={handleAddChildClick}>
                      <span className="font-medium">Add Child (New)</span>
                    </button>
                    <button onClick={() => { setRelativeType("child"); setSearchLinkQuery(""); setSidebarMode("link-search"); }} className={`p-4 border rounded-xl hover:scale-105 transition-all ${isDarkMode ? 'border-slate-700 bg-slate-800 hover:bg-blue-900/30 text-blue-400' : 'border-gray-200 bg-white hover:bg-blue-50 text-blue-600'}`} title="Link existing child">
                      <LinkIcon size={20} />
                    </button>
                  </div>

                  {/* Spouse, Father, Mother */}
                  {["spouse", "father", "mother"].map((r) => (
                    <div key={r} className="flex gap-2">
                      <button className={`flex-1 p-4 border rounded-xl text-left flex items-center justify-between group transition-all capitalize ${isDarkMode ? 'bg-slate-800 border-slate-700 hover:border-blue-500 hover:bg-slate-750' : 'bg-white border-gray-200 hover:border-blue-400 hover:shadow-md'}`} onClick={() => openGenericAddForm(r)}>
                        <span className="font-medium">Add {r}</span>
                      </button>
                      <button onClick={() => { setRelativeType(r); setSearchLinkQuery(""); setSidebarMode("link-search"); }} className={`p-4 border rounded-xl hover:scale-105 transition-all ${isDarkMode ? 'border-slate-700 bg-slate-800 hover:bg-blue-900/30 text-blue-400' : 'border-gray-200 bg-white hover:bg-blue-50 text-blue-600'}`} title={`Link existing ${r}`}>
                        <LinkIcon size={20} />
                      </button>
                    </div>
                  ))}

                  {/* Sibling */}
                  <button className={`w-full p-4 border rounded-xl text-left flex items-center justify-between group transition-all capitalize ${isDarkMode ? 'bg-slate-800 border-slate-700 hover:border-blue-500 hover:bg-slate-750' : 'bg-white border-gray-200 hover:border-blue-400 hover:shadow-md'}`} onClick={() => openGenericAddForm("sibling")}>
                    <span className="font-medium">Add Sibling</span>
                  </button>

                  <button className={`w-full p-3 mt-2 rounded-lg font-medium transition-colors ${isDarkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-gray-200 hover:bg-gray-300'}`} onClick={() => setSidebarMode("view")}>Cancel</button>
                </div>
              )}

              {/* LINK SEARCH MODE */}
              {sidebarMode === "link-search" && (
                <div className="space-y-5 animate-fade-in">
                  <h3 className={`font-bold text-xl capitalize`}>Link Existing {relativeType}</h3>
                  <div className="relative">
                    <input autoFocus placeholder="Search member name..." value={searchLinkQuery} onChange={(e) => setSearchLinkQuery(e.target.value)} className={`w-full pl-10 pr-4 py-3 rounded-lg outline-none border transition-all focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-gray-50 border-gray-200'}`} />
                    <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
                  </div>
                  <div className="space-y-2 max-h-[50vh] overflow-y-auto custom-scrollbar pr-1">
                    {getLinkCandidates().map(candidate => (
                      <div key={candidate.id} className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all hover:scale-[1.02] ${isDarkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-750' : 'bg-white border-gray-200 hover:shadow-md'}`} onClick={() => handleLinkMember(candidate.id)}>
                        <img src={candidate.img || DEFAULT_IMG} className="w-10 h-10 rounded-full object-cover" />
                        <div><p className="font-bold text-sm">{candidate.name}</p><p className="text-xs opacity-60">{candidate.birthDate ? `Born: ${new Date(candidate.birthDate).getFullYear()}` : 'No birth date'}</p></div>
                      </div>
                    ))}
                    {getLinkCandidates().length === 0 && (<p className="text-center text-sm opacity-50 py-4 italic">No eligible members found.</p>)}
                  </div>
                  <button className={`w-full p-3 rounded-lg font-medium transition-colors ${isDarkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-gray-200 hover:bg-gray-300'}`} onClick={() => setSidebarMode("add-select")}>Back</button>
                </div>
              )}

              {/* SELECT OTHER PARENT & ADD FORM (Styled same as Edit) */}
              {(sidebarMode === "select-other-parent" || sidebarMode === "add-form") && (
                <div className="space-y-5 animate-fade-in">
                  <h3 className="font-bold text-xl mb-4">{sidebarMode === "select-other-parent" ? "Select Co-Parent" : `Add ${relativeType || "Member"}`}</h3>
                  
                  {sidebarMode === "select-other-parent" ? (
                    <div className="space-y-3">
                      {getSpouses(selectedNode).map(spouse => (<button key={spouse.id} className={`flex items-center gap-3 w-full p-3 border rounded-xl transition-all hover:shadow-md ${isDarkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-750' : 'bg-white border-gray-200'}`} onClick={() => openAddChildForm(spouse.id)}><img src={spouse.img || DEFAULT_IMG} className="w-10 h-10 rounded-full object-cover" /><span className="font-medium">{spouse.name}</span></button>))}
                      <button className={`w-full p-3 border border-dashed rounded-xl text-sm transition-colors ${isDarkMode ? 'border-slate-700 text-gray-400 hover:bg-slate-800' : 'border-gray-300 text-gray-500 hover:bg-gray-50'}`} onClick={() => openAddChildForm(null)}>Unknown / Not Listed</button>
                      <button className={`w-full p-3 mt-2 rounded-lg font-medium transition-colors ${isDarkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-gray-200 hover:bg-gray-300'}`} onClick={() => setSidebarMode("add-select")}>Back</button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {formData.mid && formData.fid && (<div className={`text-xs p-3 rounded-lg border ${isDarkMode ? 'bg-blue-900/20 border-blue-800 text-blue-300' : 'bg-blue-50 border-blue-100 text-blue-700'}`}>Adding child to <b>{selectedNode.name}</b> and partner.</div>)}
                      <div><label className="text-xs font-semibold uppercase opacity-50 mb-1 block">Full Name</label><input className={`w-full p-3 rounded-lg outline-none border transition-all focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-transparent' : 'bg-gray-50 border-gray-200 text-gray-900'}`} placeholder="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></div>
                      <div><label className="text-xs font-semibold uppercase opacity-50 mb-1 block">Gender</label><select className={`w-full p-3 rounded-lg outline-none border transition-all focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-transparent' : 'bg-gray-50 border-gray-200 text-gray-900'}`} value={formData.gender} onChange={(e) => setFormData({ ...formData, gender: e.target.value })}><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></div>
                      <label className={`flex items-center gap-2 text-sm p-3 rounded-lg border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-200'}`}><input type="checkbox" checked={formData.isAlive} onChange={(e) => setFormData({ ...formData, isAlive: e.target.checked, deathDate: e.target.checked ? "" : formData.deathDate })} /> Is this person alive?</label>
                      <div><label className="text-xs font-semibold uppercase opacity-50 mb-1 block">Birth Date</label><input type="date" className={`w-full p-3 rounded-lg outline-none border transition-all focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-transparent' : 'bg-gray-50 border-gray-200 text-gray-900'}`} value={formData.birthDate} onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })} /></div>
                      {!formData.isAlive && (<div><label className="text-xs font-semibold uppercase opacity-50 mb-1 block">Death Date</label><input type="date" className={`w-full p-3 rounded-lg outline-none border transition-all focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-transparent' : 'bg-gray-50 border-gray-200 text-gray-900'}`} value={formData.deathDate} onChange={(e) => setFormData({ ...formData, deathDate: e.target.value })} /></div>)}
                      <div><label className="text-xs font-semibold uppercase opacity-50 mb-1 block">Phone</label><input className={`w-full p-3 rounded-lg outline-none border transition-all focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-transparent' : 'bg-gray-50 border-gray-200 text-gray-900'}`} placeholder="Phone" value={formData.contactNo} onChange={(e) => setFormData({ ...formData, contactNo: e.target.value })} /></div>
                      
                      {relativeType === 'spouse' && getSingleParentChildren().length > 0 && (
                        <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-yellow-900/20 border-yellow-800' : 'bg-yellow-50 border-yellow-200'}`}>
                          <p className={`text-sm font-bold mb-2 ${isDarkMode ? 'text-yellow-500' : 'text-yellow-800'}`}>Link existing children?</p>
                          <div className="space-y-2">{getSingleParentChildren().map(child => (
                            <label key={child.id} className={`flex items-center gap-2 cursor-pointer ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}><input type="checkbox" checked={linkChildrenIds.includes(child.id)} onChange={(e) => { if (e.target.checked) setLinkChildrenIds([...linkChildrenIds, child.id]); else setLinkChildrenIds(linkChildrenIds.filter(id => id !== child.id)); }} /><span className="text-sm">{child.name}</span></label>
                          ))}</div>
                        </div>
                      )}

                      <div className={`text-center p-4 rounded-lg border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-200'}`}><FileUploaderRegular pubkey="8adc52d0c4bb04d5e668" classNameUploader="uc-light uc-purple" sourceList="local, camera, facebook" onFileUploadSuccess={(fileInfo) => { setFormData({ ...formData, img: fileInfo.cdnUrl }); toast.success("Image uploaded"); }} /></div>
                      <div className="flex gap-3 pt-2"><button className={`flex-1 p-3 rounded-lg font-medium transition-colors ${isDarkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-gray-200 hover:bg-gray-300'}`} onClick={() => setSidebarMode("view")}>Cancel</button><button className={`flex-1 p-3 rounded-lg font-medium transition-colors bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/30`} onClick={saveNewMember}>Save</button></div>
                    </div>
                  )}
                </div>
              )}

            </div>
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

      {/* --- ✅ DELETE CONFIRMATION MODAL --- */}
      {deleteTargetNode && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm" onClick={() => setDeleteTargetNode(null)}>
          <div className={`p-6 rounded-2xl w-full max-w-sm shadow-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-gray-100'}`} onClick={e => e.stopPropagation()}>
            <div className="text-center"><div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle size={24} /></div><h3 className="text-xl font-bold mb-2">Delete Member?</h3><p className="text-sm opacity-70 mb-6">Are you sure you want to remove <b>{deleteTargetNode.name}</b>? <br />This will disconnect them from the family tree structure.</p><div className="flex gap-3"><button onClick={() => setDeleteTargetNode(null)} className={`flex-1 py-2.5 rounded-lg font-medium transition ${isDarkMode ? 'bg-slate-800 hover:bg-slate-700' : 'bg-gray-100 hover:bg-gray-200'}`}>Cancel</button><button onClick={confirmDelete} className="flex-1 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition shadow-lg shadow-red-500/30">Delete</button></div></div>
          </div>
        </div>
      )}

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