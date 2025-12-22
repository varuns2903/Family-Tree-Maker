import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import FamilyTree from "@balkangraph/familytree.js";
import api from "../api/axios";
import ShareModal from "../components/ShareModal";
import StatsModal from "../components/StatsModal";
import MemberSidebar from "../components/MemberSidebar";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  PieChart,
  Palette,
  X,
  Moon,
  Sun,
  Lock,
  Share2,
  Key,
  TreePine,
  List,
  Menu,
  Home,
  Plus,
  Loader2,
  Unlock,
  User,
  Calendar,
  Phone,
  FileText,
  Image as ImageIcon,
  Settings
} from "lucide-react";
import { getInitialTheme, toggleTheme } from "../utils/theme";

// ✅ 1. Import Uploadcare
import { FileUploaderRegular } from "@uploadcare/react-uploader";
import "@uploadcare/react-uploader/core.css";

// --- INTERNAL COMPONENT: ROOT CREATION MODAL (FULL FIELDS) ---
const RootModal = ({ onClose, onCreate, isDarkMode }) => {
  const [formData, setFormData] = useState({
    name: "",
    gender: "male",
    birthDate: "",
    isAlive: true,
    deathDate: "",
    contactNo: "",
    description: "",
    img: "https://ucarecdn.com/db931dbd-59c5-4b4d-a86d-79d9791262ce/user.png"
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return toast.error("Name is required");
    onCreate(formData);
  };

  // Styles
  const inputClass = `w-full p-3 rounded-xl border outline-none focus:ring-2 focus:ring-green-500 transition-all ${
    isDarkMode ? "bg-slate-800 border-slate-700 text-white placeholder-slate-500" : "bg-white border-gray-200 text-gray-900 placeholder-gray-400"
  }`;
  
  const labelClass = `text-xs font-bold uppercase opacity-60 mb-1.5 block ml-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`;
  
  const sectionClass = `space-y-4 pt-4 border-t ${isDarkMode ? 'border-slate-800' : 'border-gray-100'}`;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] backdrop-blur-sm p-4" onClick={onClose}>
      <div 
        className={`w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${isDarkMode ? 'bg-slate-900 text-white border border-slate-800' : 'bg-white text-slate-800'}`} 
        onClick={e => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className={`p-6 pb-4 flex justify-between items-center ${isDarkMode ? 'bg-slate-900' : 'bg-white'}`}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
              <TreePine size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold">Start Your Tree</h2>
              <p className="opacity-60 text-xs">Create the first family member</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition"><X size={20}/></button>
        </div>

        {/* Scrollable Form */}
        <div className="overflow-y-auto custom-scrollbar p-6 pt-0 space-y-5">
          <form id="root-form" onSubmit={handleSubmit} className="space-y-5">
            
            {/* ✅ 2. Image Upload Section (Replaced Input with Uploader) */}
            <div className="flex flex-col items-center justify-center gap-4 mb-2">
              <img 
                src={formData.img} 
                alt="Preview" 
                className={`w-24 h-24 rounded-full object-cover border-4 shadow-md ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}
              />
              <div className={isDarkMode ? "uc-dark" : "uc-light"}>
                <FileUploaderRegular
                  pubkey="8adc52d0c4bb04d5e668"
                  classNameUploader="uc-purple"
                  sourceList="local, camera, facebook"
                  onFileUploadSuccess={(fileInfo) => {
                    setFormData({ ...formData, img: fileInfo.cdnUrl });
                    toast.success("Photo uploaded!");
                  }}
                />
              </div>
            </div>

            {/* Identity Section */}
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Full Name</label>
                <div className="relative">
                  <User className={`absolute left-3 top-3.5 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`} size={18}/>
                  <input 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className={`${inputClass} pl-10 font-medium`}
                    placeholder="e.g. John Doe"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Gender</label>
                <div className="grid grid-cols-3 gap-2">
                  {['male', 'female', 'other'].map(g => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setFormData({...formData, gender: g})}
                      className={`py-2.5 rounded-xl font-bold text-sm capitalize transition border ${
                        formData.gender === g 
                          ? (g === 'male' ? 'border-blue-500 bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' 
                            : g === 'female' ? 'border-pink-500 bg-pink-50 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400'
                            : 'border-purple-500 bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400')
                          : `border-transparent ${isDarkMode ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Vital Statistics */}
            <div className={sectionClass}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Birth Date</label>
                  <input type="date" value={formData.birthDate} onChange={e => setFormData({...formData, birthDate: e.target.value})} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Vital Status</label>
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, isAlive: !formData.isAlive})}
                    className={`w-full py-3 rounded-xl font-bold text-sm border transition ${
                      formData.isAlive 
                        ? 'border-green-500 text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400' 
                        : 'border-slate-300 text-slate-500 bg-slate-100 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {formData.isAlive ? "Living" : "Deceased"}
                  </button>
                </div>
              </div>

              {!formData.isAlive && (
                <div className="animate-fade-in">
                  <label className={labelClass}>Death Date</label>
                  <input type="date" value={formData.deathDate} onChange={e => setFormData({...formData, deathDate: e.target.value})} className={inputClass} />
                </div>
              )}
            </div>

            {/* Details Section */}
            <div className={sectionClass}>
              <div>
                <label className={labelClass}>Contact No.</label>
                <div className="relative">
                  <Phone className={`absolute left-3 top-3.5 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`} size={18}/>
                  <input 
                    type="text"
                    value={formData.contactNo} 
                    onChange={e => setFormData({...formData, contactNo: e.target.value})}
                    className={`${inputClass} pl-10`}
                    placeholder="+1 234..."
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Bio / Description</label>
                <div className="relative">
                  <FileText className={`absolute left-3 top-3.5 ${isDarkMode ? 'text-slate-500' : 'text-gray-400'}`} size={18}/>
                  <textarea 
                    value={formData.description} 
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    className={`${inputClass} pl-10 min-h-[80px] resize-none`}
                    placeholder="Add a short biography..."
                  />
                </div>
              </div>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className={`p-4 border-t ${isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-gray-100 bg-white'}`}>
          <button 
            type="submit" 
            form="root-form"
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-green-500/30 transition transform active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Plus size={20} /> Create First Member
          </button>
        </div>

      </div>
    </div>
  );
};


// --- MAIN TREE EDITOR COMPONENT ---
const TreeEditor = () => {
  const divRef = useRef(null);
  const treeRef = useRef(null);
  const nodesRef = useRef([]);
  const { treeId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Global State
  const [nodes, setNodes] = useState([]);
  const [treeName, setTreeName] = useState("Family Tree");
  const [currentUserRole, setCurrentUserRole] = useState("viewer");
  const [loading, setLoading] = useState(false);

  // UI State
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(getInitialTheme);
  const [currentTemplate, setCurrentTemplate] = useState("hugo");
  
  // Modals
  const [showShareModal, setShowShareModal] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showRootModal, setShowRootModal] = useState(false);

  const [stats, setStats] = useState({
    total: 0, male: 0, female: 0, living: 0,
    upcomingEvents: [], topZodiac: {}, decadeCounts: {},
  });

  const canEdit = ["owner", "editor"].includes(currentUserRole);

  // --- HELPERS ---
  const calculateAge = (dob) => {
    if (!dob) return "";
    const diff = Date.now() - new Date(dob).getTime();
    return Math.floor(diff / 31556952000);
  };

  const calculateStats = () => {
    const total = nodes.length;
    const male = nodes.filter((n) => n.gender === "male").length;
    const female = nodes.filter((n) => n.gender === "female").length;
    const other = nodes.filter((n) => n.gender === "other").length;
    const living = nodes.filter((n) => n.isAlive).length;
    const deceased = total - living;
    
    setStats({ total, male, female, other, living, deceased, upcomingEvents: [], decadeCounts: {} });
    setShowStats(true);
    setMobileMenuOpen(false);
  };

  const handleStatsNodeClick = (nodeId) => {
    setShowStats(false);
    const node = nodes.find((n) => String(n.id) === String(nodeId));
    if (node) {
      setTimeout(() => {
        setSelectedNode(node);
        setSidebarOpen(true);
      }, 150);
    }
  };

  // --- API ACTIONS ---
  const loadTreeData = async () => {
    setLoading(true);
    try {
      const membersRes = await api.get(`/trees/${treeId}/members`);
      let fetchedNodes = membersRes.data.role ? membersRes.data.members : membersRes.data;

      const cleanNodes = fetchedNodes.map((n) => ({
        ...n,
        description: n.description || "",
        weddings: n.weddings || [],
        mid: n.mid === n.id ? null : n.mid,
        fid: n.fid === n.id ? null : n.fid,
      }));

      setNodes(cleanNodes);

      if (membersRes.data.role) setCurrentUserRole(membersRes.data.role);
      else setCurrentUserRole("owner");

      try {
        const treeRes = await api.get(`/trees/${treeId}`);
        setTreeName(treeRes.data.name);
      } catch (err) { console.log(err); }
    } catch (error) {
      toast.error("Failed to load tree data");
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAccess = async () => {
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) {
        toast.error("Please login.");
        return;
      }
      await api.put(`/trees/${treeId}/role`, { action: "request" });
      toast.success("Request sent to owner!");
    } catch (e) {
      toast.error(e.response?.data?.message || "Failed to send request");
    }
  };

  const handleCreateRoot = async (memberData) => {
    setLoading(true);
    try {
      await api.post(`/trees/${treeId}/members`, memberData);
      toast.success("Tree started successfully!");
      setShowRootModal(false); 
      loadTreeData(); 
    } catch (error) {
      console.log(error);
      toast.error("Failed to create root member");
    } finally {
      setLoading(false);
    }
  };

  const handleAddNewMember = async (newMemberData) => {
    await api.post(`/trees/${treeId}/members`, newMemberData);
    toast.success("Added Successfully");
    setSidebarOpen(false);
    loadTreeData();
  };

  const handleLinkMember = async (targetId, type) => {
    try {
      await api.put(`/trees/${treeId}/members/link`, {
        memberId: selectedNode.id,
        relativeId: targetId,
        relationship: type,
      });
      toast.success("Members Linked!");
      setSidebarOpen(false);
      loadTreeData();
    } catch (err) {
      toast.error("Failed to link members");
    }
  };

  // --- EFFECTS ---
  useEffect(() => { loadTreeData(); }, [treeId]);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  }, [isDarkMode]);

  useEffect(() => {
    if (divRef.current) {
      nodesRef.current = nodes;
      if (nodes.length > 0) {
        const enriched = nodes.map((n) => ({
          ...n,
          ageDisplay: n.isAlive && n.birthDate ? `${calculateAge(n.birthDate)} yrs` : "",
        }));

        divRef.current.innerHTML = "";
        const isReadOnly = currentUserRole === "viewer";

        treeRef.current = new FamilyTree(divRef.current, {
          template: currentTemplate,
          mode: isDarkMode ? "dark" : "light",
          exportUrl: null,
          menu: null,
          enableSearch: false,
          toolbar: false,
          mouseScrool: FamilyTree.action.zoom,
          enableDrag: true,
          enableEdit: !isReadOnly,
          nodeMenu: null,
          nodeBinding: { field_0: "name", field_1: "ageDisplay", img_0: "img" },
          nodes: enriched,
        });

        treeRef.current.on("click", (sender, args) => {
          const nodeId = args?.node?.id;
          if (!nodeId) return false;
          const full = nodesRef.current.find((n) => n.id === nodeId);
          if (full) {
            setSelectedNode(full);
            setSidebarOpen(true);
          }
          return false;
        });
      } else {
        divRef.current.innerHTML = "";
        treeRef.current = null;
      }
    }
  }, [nodes, currentTemplate, isDarkMode, currentUserRole]);

  return (
    <div className={`w-full h-screen flex overflow-hidden relative transition-colors duration-300 ${isDarkMode ? "bg-[#0e0e0e] text-gray-100" : "bg-gray-100 text-gray-800"}`}>
      
      {/* --- TOOLBAR --- */}
      <div className="absolute top-4 left-4 right-4 z-30 flex justify-between items-center pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-3">
          <button className="md:hidden p-3 rounded-xl shadow-md bg-white/90 dark:bg-slate-800 text-gray-700 dark:text-white" onClick={() => setMobileMenuOpen(true)}><Menu size={20} /></button>
          <div className="hidden md:flex items-center gap-3">
            <button onClick={() => navigate("/dashboard")} className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow-md transition ${isDarkMode ? "bg-slate-800 text-white hover:bg-slate-700" : "bg-white/90 text-gray-700 hover:bg-gray-200"}`}>
              <ArrowLeft size={18} /> <span className="hidden sm:inline">Back</span>
            </button>
            <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm ${currentUserRole === "owner" ? "bg-amber-100 text-amber-800 border border-amber-300" : currentUserRole === "editor" ? "bg-blue-100 text-blue-800 border border-blue-300" : "bg-gray-200 text-gray-600 border border-gray-300"}`}>
              {currentUserRole === "viewer" && <Lock size={12} />} {currentUserRole}
            </div>
          </div>
        </div>

        <div className={`absolute left-1/2 -translate-x-1/2 pointer-events-auto flex items-center gap-2 px-6 py-2 rounded-xl shadow-lg border backdrop-blur-md ${isDarkMode ? "bg-slate-900/80 border-slate-700 text-gray-100" : "bg-white/80 border-gray-200 text-gray-800"}`}>
          <TreePine size={18} className="text-green-500" />
          <span className="font-bold text-lg max-w-[150px] sm:max-w-[200px] truncate">{treeName}</span>
        </div>

        <div className="pointer-events-auto hidden md:flex gap-3">
          {currentUserRole === "viewer" && (
            <button onClick={handleRequestAccess} className="flex items-center gap-2 px-4 py-2 rounded-lg transition shadow-md bg-amber-500 hover:bg-amber-600 text-white">
              <Unlock size={18} /> <span className="hidden sm:inline font-bold">Request Edit</span>
            </button>
          )}
          <button onClick={() => toggleTheme(isDarkMode, setIsDarkMode)} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition shadow-md ${isDarkMode ? "bg-slate-800 hover:bg-slate-700 text-white" : "bg-white/90 hover:bg-gray-200 text-gray-700"}`}>
            {isDarkMode ? <Moon size={18} /> : <Sun size={18} className="text-orange-500" />}
          </button>
          <button onClick={() => setShowShareModal(true)} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition shadow-md ${isDarkMode ? "bg-slate-800 text-gray-200 hover:bg-slate-700 hover:text-blue-400" : "bg-white/90 text-gray-700 hover:bg-gray-200 hover:text-blue-600"}`}>
            <Share2 size={18} /> <span className="hidden sm:inline font-medium">Share</span>
          </button>
          <button onClick={calculateStats} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition shadow-md ${isDarkMode ? "bg-slate-800 text-gray-200 hover:bg-slate-700 hover:text-green-400" : "bg-white/90 text-gray-700 hover:bg-gray-200 hover:text-green-600"}`}>
            <PieChart size={18} /> <span className="hidden sm:inline font-medium">Stats</span>
          </button>
          <button onClick={() => navigate(`/tree/${treeId}/list`)} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition shadow-md ${isDarkMode ? "bg-slate-800 text-gray-200 hover:bg-slate-700 hover:text-purple-400" : "bg-white/90 text-gray-700 hover:bg-gray-200 hover:text-purple-600"}`}>
            <List size={18} /> <span className="hidden sm:inline font-medium">List</span>
          </button>
        </div>
      </div>

      {/* --- MOBILE MENU --- */}
      {mobileMenuOpen && (
        <div className="absolute inset-0 z-[100] flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className={`relative w-64 h-full shadow-2xl p-6 flex flex-col gap-2 transform transition-transform duration-300 ease-in-out ${isDarkMode ? "bg-slate-900 text-gray-100 border-r border-slate-700" : "bg-white text-gray-800 border-r border-gray-200"}`}>
            <div className="flex justify-between items-center mb-6">
              <span className="font-bold text-lg flex items-center gap-2"><TreePine className="text-green-500" /> Menu</span>
              <button onClick={() => setMobileMenuOpen(false)}><X size={24} /></button>
            </div>
            <button onClick={() => navigate("/dashboard")} className={`flex items-center gap-3 p-3 rounded-xl transition ${isDarkMode ? "hover:bg-slate-800" : "hover:bg-gray-100"}`}><Home size={20} className="text-blue-500" /> Back to Dashboard</button>
            {currentUserRole === "viewer" && (
              <button onClick={handleRequestAccess} className={`flex items-center gap-3 p-3 rounded-xl transition bg-amber-100 text-amber-900 font-bold`}><Unlock size={20} /> Request Access</button>
            )}
            <button onClick={() => navigate(`/tree/${treeId}/list`)} className={`flex items-center gap-3 p-3 rounded-xl transition ${isDarkMode ? "hover:bg-slate-800" : "hover:bg-gray-100"}`}><List size={20} className="text-purple-500" /> Members List</button>
            <button onClick={calculateStats} className={`flex items-center gap-3 p-3 rounded-xl transition ${isDarkMode ? "hover:bg-slate-800" : "hover:bg-gray-100"}`}><PieChart size={20} className="text-green-500" /> Family Stats</button>
            <button onClick={() => { setMobileMenuOpen(false); setShowShareModal(true); }} className={`flex items-center gap-3 p-3 rounded-xl transition ${isDarkMode ? "hover:bg-slate-800" : "hover:bg-gray-100"}`}><Share2 size={20} className="text-blue-400" /> Share Tree</button>
            <button onClick={() => toggleTheme(isDarkMode, setIsDarkMode)} className={`flex items-center gap-3 p-3 rounded-xl transition ${isDarkMode ? "hover:bg-slate-800" : "hover:bg-gray-100"}`}>{isDarkMode ? <Moon size={20} /> : <Sun size={20} className="text-amber-500" />} {isDarkMode ? "Dark Mode" : "Light Mode"}</button>
          </div>
        </div>
      )}

      {/* --- CANVAS --- */}
      <div ref={divRef} className={`flex-1 w-full h-full ${isDarkMode ? "bg-[#1b1b1b]" : "bg-gray-50"}`} />

      {/* --- SIDEBAR --- */}
      <MemberSidebar
        member={selectedNode}
        allMembers={nodes}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        userRole={currentUserRole}
        onUpdate={(updatedMember) => {
          loadTreeData();
          setSelectedNode(updatedMember);
        }}
        onDelete={() => {
          loadTreeData();
          setSidebarOpen(false);
        }}
        onAddNew={handleAddNewMember}
        onLinkRelative={handleLinkMember}
      />

      {/* --- MODALS --- */}
      <StatsModal isOpen={showStats} onClose={() => setShowStats(false)} stats={stats} isDarkMode={isDarkMode} onNodeClick={handleStatsNodeClick} />
      {showShareModal && <ShareModal treeId={treeId} onClose={() => setShowShareModal(false)} currentUserRole={currentUserRole} />}
      
      {/* ✅ ROOT CREATION MODAL */}
      {showRootModal && (
        <RootModal 
          onClose={() => setShowRootModal(false)} 
          onCreate={handleCreateRoot} 
          isDarkMode={isDarkMode} 
        />
      )}

      {/* --- EMPTY STATE --- */}
      {nodes.length === 0 && !loading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          {canEdit ? (
            <button
              className="pointer-events-auto bg-blue-600 text-white px-8 py-4 rounded-full shadow-2xl text-lg font-bold hover:bg-blue-700 transition animate-bounce flex items-center gap-2"
              onClick={() => setShowRootModal(true)} 
            >
              <Plus size={24} /> Start Family Tree
            </button>
          ) : (
            <div className={`p-6 rounded-xl text-center pointer-events-auto shadow-lg border ${isDarkMode ? "bg-slate-800 border-slate-700 text-gray-300" : "bg-white border-gray-200 text-gray-600"}`}>
              <Lock className="mx-auto mb-2 opacity-50" size={32} />
              <p className="font-medium text-lg">This family tree is empty.</p>
              <p className="text-sm opacity-75 mb-4">You do not have permission to add the first member.</p>
              <button onClick={handleRequestAccess} className={`flex items-center gap-2 mx-auto px-4 py-2 rounded-lg font-medium transition shadow-md ${isDarkMode ? "bg-blue-600 hover:bg-blue-500 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}`}>
                <Key size={16} /> Request Edit Access
              </button>
            </div>
          )}
        </div>
      )}

      {/* --- LOADING OVERLAY --- */}
      {loading && nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/20 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-xl flex items-center gap-3">
            <Loader2 className="animate-spin text-blue-500" size={24} />
            <span className="font-bold dark:text-white">Loading Tree...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TreeEditor;