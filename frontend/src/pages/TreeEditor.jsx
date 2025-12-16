import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import FamilyTree from '@balkangraph/familytree.js';
import api from '../api/axios';
import ShareModal from '../components/ShareModal';
import StatsModal from '../components/StatsModal';
import MemberSidebar from '../components/MemberSidebar'; // ✅ Integrated Sidebar
import toast from 'react-hot-toast';
import { 
  ArrowLeft, PieChart, Palette, X, Moon, Sun, Lock, Share2, Key, TreePine, 
  List, Menu, Home, Plus, Loader2
} from 'lucide-react';
import { getInitialTheme, toggleTheme } from '../utils/theme';

const TreeEditor = () => {
  const divRef = useRef(null);
  const treeRef = useRef(null);
  const nodesRef = useRef([]);
  const { treeId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams(); 

  // --- GLOBAL STATE ---
  const [nodes, setNodes] = useState([]);
  const [treeName, setTreeName] = useState("Family Tree");
  const [userRole, setUserRole] = useState('viewer');
  const [showShareModal, setShowShareModal] = useState(false);
  const [loading, setLoading] = useState(false); 

  // --- UI STATE ---
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);

  // --- THEME & STATS ---
  const [isDarkMode, setIsDarkMode] = useState(getInitialTheme);
  const [currentTemplate, setCurrentTemplate] = useState("hugo");
  const [showStats, setShowStats] = useState(false);
  const [stats, setStats] = useState({
    total: 0, male: 0, female: 0, living: 0,
    upcomingBirthdays: [], topZodiac: {}, decadeCounts: {}
  });

  const DEFAULT_IMG = "https://ucarecdn.com/db931dbd-59c5-4b4d-a86d-79d9791262ce/user.png";
  
  // Permissions
  const canEdit = ['owner', 'editor'].includes(userRole);

  // ==================================================================================
  // 1. HELPERS
  // ==================================================================================

  const calculateAge = (dob) => {
    if (!dob) return "";
    const diff = Date.now() - new Date(dob).getTime();
    return Math.floor(diff / 31556952000);
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
        age: calculateAge(n.birthDate) + 1,
        type: 'Birthday'
      }))
      .sort((a, b) => a.day - b.day);

    setStats({ total, male, female, other, living, deceased, upcomingBirthdays });
    setShowStats(true);
    setMobileMenuOpen(false);
  };

  // ==================================================================================
  // 2. API ACTIONS
  // ==================================================================================

  const loadTreeData = async () => {
    setLoading(true);
    try {
      const membersRes = await api.get(`/trees/${treeId}/members`);
      // Handle both formats (if backend returns object with role or just array)
      let fetchedNodes = membersRes.data.role ? membersRes.data.members : membersRes.data;
      
      const cleanNodes = fetchedNodes.map(n => ({
        ...n,
        description: n.description || "",
        weddings: n.weddings || [],
        mid: n.mid === n.id ? null : n.mid,
        fid: n.fid === n.id ? null : n.fid
      }));

      cleanNodes.sort((a, b) => {
        if (a.birthDate && b.birthDate) return new Date(a.birthDate) - new Date(b.birthDate);
        return 0;
      });

      setNodes(cleanNodes);

      if(membersRes.data.role) setUserRole(membersRes.data.role);
      else setUserRole('owner'); // Fallback

      // Update tree name
      try {
        const treeRes = await api.get(`/trees/${treeId}`);
        setTreeName(treeRes.data.name);
      } catch (err) {}

    } catch (error) {
      toast.error("Failed to load tree data");
    } finally {
      setLoading(false);
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

  // --- HANDLER: CREATE ROOT NODE (Empty State) ---
  const createRootNode = async () => {
    setLoading(true);
    try {
        const payload = {
            name: "Root Ancestor",
            gender: "male",
            isAlive: true,
            img: DEFAULT_IMG
        };
        await api.post(`/trees/${treeId}/members`, payload);
        toast.success("Tree started!");
        loadTreeData();
    } catch (error) {
        toast.error("Failed to create root member");
    } finally {
        setLoading(false);
    }
  };

  // --- HANDLER: ADD NEW MEMBER (From Sidebar) ---
  const handleAddNewMember = async (newMemberData) => {
    // 1. Date Validation
    if (newMemberData.birthDate && !newMemberData.isAlive && newMemberData.deathDate) {
      if (new Date(newMemberData.birthDate) > new Date(newMemberData.deathDate)) {
        toast.error("Date Error: Death date cannot be earlier than birth date!");
        throw new Error("Date validation failed"); 
      }
    }

    // 2. API Call
    await api.post(`/trees/${treeId}/members`, newMemberData);
    toast.success("Added Successfully");
    setSidebarOpen(false);
    loadTreeData(); 
  };

  // --- HANDLER: LINK EXISTING MEMBER (From Sidebar) ---
  const handleLinkMember = async (targetId, type) => {
    try {
      await api.put(`/trees/${treeId}/members/link`, {
        memberId: selectedNode.id, relativeId: targetId, relationship: type
      });
      toast.success("Members Linked!");
      setSidebarOpen(false);
      loadTreeData();
    } catch (err) { 
      toast.error(err.response?.data?.message || "Failed to link members"); 
    }
  };

  // ==================================================================================
  // 3. EFFECTS
  // ==================================================================================

  useEffect(() => { loadTreeData(); }, [treeId]);

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  // Focus Logic (URL Param)
  useEffect(() => {
    const focusId = searchParams.get('focus');
    if (focusId && nodes.length > 0) {
      const node = nodes.find(n => n.id === focusId);
      if (node) {
        setTimeout(() => {
           setSelectedNode(node);
           setSidebarOpen(true);
           // Optional: If you have access to FamilyTree instance method to center:
           // treeRef.current.center(focusId); 
        }, 800);
      }
    }
  }, [nodes, searchParams]);

  // Tree Rendering
  useEffect(() => {
    if (divRef.current) {
      nodesRef.current = nodes;
      if (nodes.length > 0) {
        const enriched = nodes.map((n) => ({
          ...n,
          ageDisplay: n.isAlive && n.birthDate ? `${calculateAge(n.birthDate)} yrs` : n.birthDate ? `Born ${new Date(n.birthDate).getFullYear()}` : "",
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
          if (full) {
              setSelectedNode(full);
              setSidebarOpen(true);
          }
          return false; // Prevent default behavior
        });
      } else {
        divRef.current.innerHTML = '';
        treeRef.current = null;
      }
    }
  }, [nodes, currentTemplate, isDarkMode]);

  // ==================================================================================
  // 4. RENDER
  // ==================================================================================

  return (
    <div className={`w-full h-screen flex overflow-hidden relative transition-colors duration-300
      ${isDarkMode ? 'bg-[#0e0e0e] text-gray-100' : 'bg-gray-100 text-gray-800'}`}>

      {/* --- TOOLBAR --- */}
      <div className="absolute top-4 left-4 right-4 z-30 flex justify-between items-center pointer-events-none">
        
        {/* Left Actions */}
        <div className="pointer-events-auto flex items-center gap-3">
          <button className="md:hidden p-3 rounded-xl shadow-md bg-white/90 dark:bg-slate-800 text-gray-700 dark:text-white" onClick={() => setMobileMenuOpen(true)}>
            <Menu size={20} />
          </button>
          <div className="hidden md:flex items-center gap-3">
            <button onClick={() => navigate('/dashboard')} className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow-md transition ${isDarkMode ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-white/90 text-gray-700 hover:bg-gray-200'}`}>
              <ArrowLeft size={18} /> <span className="hidden sm:inline">Back</span>
            </button>
            <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm ${userRole === 'owner' ? 'bg-amber-100 text-amber-800 border border-amber-300' : userRole === 'editor' ? 'bg-blue-100 text-blue-800 border border-blue-300' : 'bg-gray-200 text-gray-600 border border-gray-300'}`}>
              {userRole === 'viewer' && <Lock size={12} />} {userRole}
            </div>
          </div>
        </div>

        {/* Title */}
        <div className={`absolute left-1/2 -translate-x-1/2 pointer-events-auto flex items-center gap-2 px-6 py-2 rounded-xl shadow-lg border backdrop-blur-md ${isDarkMode ? 'bg-slate-900/80 border-slate-700 text-gray-100' : 'bg-white/80 border-gray-200 text-gray-800'}`}>
          <TreePine size={18} className="text-green-500" />
          <span className="font-bold text-lg max-w-[150px] sm:max-w-[200px] truncate">{treeName}</span>
        </div>

        {/* Right Actions */}
        <div className="pointer-events-auto hidden md:flex gap-3">
          <div className="relative group">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-pointer transition shadow-md ${isDarkMode ? 'bg-slate-800 text-gray-200 hover:bg-slate-700' : 'bg-white/90 text-gray-700 hover:bg-gray-200'}`}>
              <Palette size={18} className="text-purple-500" /> <span className="capitalize">{currentTemplate}</span>
            </div>
            <div className="absolute right-0 top-full pt-2 w-32 hidden group-hover:block z-50">
              <div className={`rounded-lg shadow-xl border overflow-hidden ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'}`}>
                {['hugo', 'tommy', 'john'].map(t => (<div key={t} onClick={() => setCurrentTemplate(t)} className={`px-4 py-2 text-sm cursor-pointer capitalize ${currentTemplate === t ? 'font-bold text-blue-500' : ''} ${isDarkMode ? 'text-gray-200 hover:bg-slate-700' : 'text-gray-700 hover:bg-gray-100'}`}>{t}</div>))}
              </div>
            </div>
          </div>
          <button onClick={() => toggleTheme(isDarkMode, setIsDarkMode)} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition shadow-md ${isDarkMode ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-white/90 hover:bg-gray-200 text-gray-700'}`}>{isDarkMode ? <Moon size={18} /> : <Sun size={18} className="text-orange-500" />}</button>
          <button onClick={() => setShowShareModal(true)} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition shadow-md ${isDarkMode ? 'bg-slate-800 text-gray-200 hover:bg-slate-700 hover:text-blue-400' : 'bg-white/90 text-gray-700 hover:bg-gray-200 hover:text-blue-600'}`}><Share2 size={18} /> <span className="hidden sm:inline font-medium">Share</span></button>
          <button onClick={calculateStats} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition shadow-md ${isDarkMode ? 'bg-slate-800 text-gray-200 hover:bg-slate-700 hover:text-green-400' : 'bg-white/90 text-gray-700 hover:bg-gray-200 hover:text-green-600'}`}><PieChart size={18} /> <span className="hidden sm:inline font-medium">Stats</span></button>
          <button onClick={() => navigate(`/tree/${treeId}/list`)} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition shadow-md ${isDarkMode ? 'bg-slate-800 text-gray-200 hover:bg-slate-700 hover:text-purple-400' : 'bg-white/90 text-gray-700 hover:bg-gray-200 hover:text-purple-600'}`}><List size={18} /> <span className="hidden sm:inline font-medium">List</span></button>
        </div>
      </div>

      {/* --- MOBILE MENU --- */}
      {mobileMenuOpen && (
        <div className="absolute inset-0 z-[100] flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <div className={`relative w-64 h-full shadow-2xl p-6 flex flex-col gap-2 transform transition-transform duration-300 ease-in-out ${isDarkMode ? 'bg-slate-900 text-gray-100 border-r border-slate-700' : 'bg-white text-gray-800 border-r border-gray-200'}`}>
            <div className="flex justify-between items-center mb-6"><span className="font-bold text-lg flex items-center gap-2"><TreePine className="text-green-500" /> Menu</span><button onClick={() => setMobileMenuOpen(false)}><X size={24} /></button></div>
            <button onClick={() => navigate('/dashboard')} className={`flex items-center gap-3 p-3 rounded-xl transition ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-gray-100'}`}><Home size={20} className="text-blue-500" /> Back to Dashboard</button>
            <button onClick={() => navigate(`/tree/${treeId}/list`)} className={`flex items-center gap-3 p-3 rounded-xl transition ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-gray-100'}`}><List size={20} className="text-purple-500" /> Members List</button>
            <button onClick={calculateStats} className={`flex items-center gap-3 p-3 rounded-xl transition ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-gray-100'}`}><PieChart size={20} className="text-green-500" /> Family Stats</button>
            <button onClick={() => { setMobileMenuOpen(false); setShowShareModal(true); }} className={`flex items-center gap-3 p-3 rounded-xl transition ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-gray-100'}`}><Share2 size={20} className="text-blue-400" /> Share Tree</button>
            <button onClick={() => toggleTheme(isDarkMode, setIsDarkMode)} className={`flex items-center gap-3 p-3 rounded-xl transition ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-gray-100'}`}>{isDarkMode ? <Moon size={20} /> : <Sun size={20} className="text-amber-500" />} {isDarkMode ? 'Dark Mode' : 'Light Mode'}</button>
          </div>
        </div>
      )}

      {/* --- CANVAS --- */}
      <div ref={divRef} className={`flex-1 w-full h-full ${isDarkMode ? 'bg-[#1b1b1b]' : 'bg-gray-50'}`} />

      {/* --- ✅ NEW SIDEBAR --- */}
      <MemberSidebar
          member={selectedNode}
          allMembers={nodes}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          userRole={userRole}
          
          onUpdate={(updatedMember) => {
              loadTreeData(); // Refresh to show updates
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
      <StatsModal isOpen={showStats} onClose={() => setShowStats(false)} stats={stats} isDarkMode={isDarkMode} />
      {showShareModal && <ShareModal treeId={treeId} onClose={() => setShowShareModal(false)} />}
      
      {/* --- EMPTY STATE --- */}
      {nodes.length === 0 && !loading && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          {canEdit ? (
            <button className="pointer-events-auto bg-blue-600 text-white px-8 py-4 rounded-full shadow-2xl text-lg font-bold hover:bg-blue-700 transition animate-bounce flex items-center gap-2"
              onClick={createRootNode}>
              <Plus size={24} /> Start Family Tree
            </button>
          ) : (
            <div className={`p-6 rounded-xl text-center pointer-events-auto shadow-lg border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-gray-300' : 'bg-white border-gray-200 text-gray-600'}`}>
              <Lock className="mx-auto mb-2 opacity-50" size={32} />
              <p className="font-medium text-lg">This family tree is empty.</p>
              <p className="text-sm opacity-75 mb-4">You do not have permission to add the first member.</p>
              <button onClick={requestAccess} className={`flex items-center gap-2 mx-auto px-4 py-2 rounded-lg font-medium transition shadow-md ${isDarkMode ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}><Key size={16} /> Request Edit Access</button>
            </div>
          )}
        </div>
      )}
      
      {/* --- LOADING OVERLAY (Optional) --- */}
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