import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import FamilyTree from '@balkangraph/familytree.js';
import { FileUploaderRegular } from '@uploadcare/react-uploader';
import '@uploadcare/react-uploader/core.css';
import api from '../api/axios';
import toast from 'react-hot-toast';

const TreeEditor = () => {
  const divRef = useRef(null);
  const treeRef = useRef(null);
  // Ref to track nodes without stale closures in event listeners
  const nodesRef = useRef([]); 
  const { treeId } = useParams();

  const [nodes, setNodes] = useState([]);

  // Sidebar UI states
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarMode, setSidebarMode] = useState("view"); 
  const [selectedNode, setSelectedNode] = useState(null);
  const [relativeType, setRelativeType] = useState("");
  const [linkChildrenIds, setLinkChildrenIds] = useState([]);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    gender: "male",
    birthDate: "",
    deathDate: "",
    isAlive: true,
    img: "",
    contactNo: "",
    relativeId: null, 
    relationType: null, 
    mid: null, 
    fid: null, 
    pids: [] // Store existing partners to prevent unlinking
  });

  const DEFAULT_IMG = "https://ucarecdn.com/db931dbd-59c5-4b4d-a86d-79d9791262ce/user.png";

  // --- HELPERS ---

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
    
    const siblings = nodes.filter(n => 
      n.id !== id && 
      ((n.mid && n.mid === mid) || (n.fid && n.fid === fid))
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
      if (selectedNode.gender === 'male') {
        return !child.mid; // Dad selected, find kids with no Mom
      } else {
        return !child.fid; // Mom selected, find kids with no Dad
      }
    });
  };

  // --- LOADING & RENDERING ---

  useEffect(() => { loadMembers(); }, [treeId]);

  const loadMembers = async () => {
    try {
      const { data } = await api.get(`/trees/${treeId}/members`);
      setNodes(data);
      nodesRef.current = data; // Keep Ref in sync for click listeners
    } catch {
      toast.error("Failed to load family members");
    }
  };

  // Separate useEffect to handle Chart updates when nodes change
  useEffect(() => {
    if (treeRef.current && nodes.length > 0) {
        const enriched = nodes.map((n) => ({
            ...n,
            ageDisplay: n.isAlive && n.birthDate
              ? `${calculateAge(n.birthDate)} yrs`
              : n.birthDate ? `Born ${formatDate(n.birthDate)}` : "",
          }));
      treeRef.current.load(enriched);
    }
  }, [nodes]);

  // --- HANDLERS ---

  const openSidebar = (node) => {
    if (!node) return;
    setSelectedNode(node);
    
    // Populate form with ALL existing data (including relationships)
    setFormData({
      name: node.name,
      gender: node.gender,
      birthDate: node.birthDate || "",
      deathDate: node.deathDate || "",
      isAlive: node.isAlive ?? true,
      img: node.img || DEFAULT_IMG,
      contactNo: node.contactNo || "",
      
      // CRITICAL: Preserve existing links so they aren't wiped on save
      mid: node.mid || null,
      fid: node.fid || null,
      pids: node.pids || [],

      relativeId: null,
      relationType: null,
    });
    setSidebarMode("view");
    setSidebarOpen(true);
  };

  // 1. ADD CHILD LOGIC
  const handleAddChildClick = () => {
    const spouses = getSpouses(selectedNode);

    if (spouses.length === 0) {
      openAddChildForm(null); // Single Parent
    }
    else if (spouses.length === 1) {
      openAddChildForm(spouses[0].id); // Auto-select spouse
    }
    else {
      setSidebarMode("select-other-parent"); // Ask user
    }
  };

  // 2. OPEN FORM WITH PARENTS PRE-FILLED
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
      name: "",
      gender: "male",
      birthDate: "",
      deathDate: "",
      isAlive: true,
      img: DEFAULT_IMG,
      contactNo: "",
      fid: fatherId,
      mid: motherId,
      relativeId: null,
      relationType: "child",
      pids: [] 
    });
    setSidebarMode("add-form");
  };

  // 3. GENERIC ADD
  const openGenericAddForm = (type) => {
    setRelativeType(type);
    setLinkChildrenIds([]);
    setFormData({
      name: "",
      gender: type === "mother" ? "female" : "male",
      birthDate: "",
      deathDate: "",
      isAlive: true,
      img: DEFAULT_IMG,
      contactNo: "",
      relativeId: selectedNode.id,
      relationType: type,
      mid: null,
      fid: null,
      pids: []
    });
    setSidebarMode("add-form");
  };

  // --- API ACTIONS ---

  const saveEdit = async () => {
    try {
      // Send back the preserved IDs to prevent unlinking
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
      loadMembers();
      setSidebarMode("view");
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
      loadMembers();
      setSidebarOpen(false);
      setSidebarMode("view");
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to add member");
    }
  };

  const removeMember = async () => {
    if (!window.confirm("Are you sure? This cannot be undone.")) return;
    try {
      await api.delete(`/trees/${treeId}/members/${selectedNode.id}`);
      toast.success("Deleted");
      setSidebarOpen(false);
      loadMembers();
    } catch {
      toast.error("Delete failed");
    }
  };

  // --- CHART INITIALIZATION (Runs Once) ---

  useEffect(() => {
    if (!divRef.current) return;

    treeRef.current = new FamilyTree(divRef.current, {
      template: "hugo",
      enableSearch: false,
      toolbar: false,
      mouseScrool: FamilyTree.none,
      editForm: null,
      nodeMenu: null,
      nodeBinding: {
        field_0: "name",
        field_1: "ageDisplay",
        img_0: "img",
      },
    });

    // Event Listener
    treeRef.current.on("click", (sender, args) => {
      if (args.node) {
        // Read from Ref to get fresh data without re-rendering chart
        const full = nodesRef.current.find((n) => n.id === args.node.id);
        const nodeData = full || sender.get(args.node.id);
        openSidebar(nodeData);
      }
      args.handled = true;
      return false;
    });

  }, []); // Empty dependency array = Runs once

  const { parents, spouses, children, siblings } = getRelatives();

  return (
    <div className="w-full h-screen flex overflow-hidden relative">

      <div ref={divRef} className="flex-1 bg-gray-100" />

      {/* EMPTY STATE TRIGGER */}
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <button
            className="pointer-events-auto bg-blue-600 text-white px-8 py-4 rounded-full shadow-2xl text-lg font-bold hover:bg-blue-700 transition animate-bounce"
            onClick={() => {
              setSelectedNode({ id: null });
              setSidebarMode("add-form");
              setFormData({
                name: "Root Ancestor",
                gender: "male",
                birthDate: "",
                isAlive: true,
                img: DEFAULT_IMG,
                contactNo: "",
                relativeId: null,
                relationType: null,
                mid: null,
                fid: null,
                pids: []
              });
              setSidebarOpen(true);
            }}
          >
            + Start Family Tree
          </button>
        </div>
      )}

      {/* SIDEBAR OVERLAY */}
      {sidebarOpen && selectedNode && (
        <>
          <div
            className="absolute inset-0 bg-black/20 z-40 backdrop-blur-[1px]"
            onClick={() => setSidebarOpen(false)}
          />

          <div
            className="absolute right-0 top-0 h-full w-[350px] bg-white shadow-2xl border-l p-4 overflow-y-auto z-50 animate-slide-in"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="text-red-500 text-sm mb-3 hover:text-red-700 font-medium"
              onClick={() => setSidebarOpen(false)}
            >
              ✕ Close
            </button>

            {/* --- VIEW MODE --- */}
            {sidebarMode === "view" && (
              <div>
                <img src={selectedNode.img || DEFAULT_IMG}
                  className="w-36 h-36 rounded-full mx-auto border mb-4 object-cover" />

                <h2 className="text-2xl font-bold text-center">{selectedNode.name}</h2>

                <p className="text-center text-gray-600 my-2">
                  {selectedNode.gender === "male" && "♂ "}
                  {selectedNode.gender === "female" && "♀ "}
                  {selectedNode.gender === "other" && "⚧ "}
                  {selectedNode.isAlive ? "Alive" : "Deceased"}
                </p>

                <p className="text-center text-gray-600 mb-4">
                  {selectedNode.birthDate && `Born: ${formatDate(selectedNode.birthDate)}`}<br />
                  {!selectedNode.isAlive && selectedNode.deathDate &&
                    `Died: ${formatDate(selectedNode.deathDate)}`}<br />
                  {selectedNode.isAlive && `${calculateAge(selectedNode.birthDate)} yrs old`}<br />
                  {selectedNode.contactNo && `📞 ${selectedNode.contactNo}`}<br />
                </p>

                {/* Relationships List */}
                {(parents.length > 0 || spouses.length > 0 || children.length > 0 || siblings.length > 0) && (
                  <div className="text-sm text-gray-700 space-y-3 bg-gray-50 p-3 rounded-lg">
                    {parents.length > 0 && (
                      <div>
                        <strong className="block text-gray-500 text-xs uppercase tracking-wide">Parents</strong>
                        {parents.map(p => (
                          <div key={p.id} className="cursor-pointer text-blue-600 hover:underline" onClick={() => openSidebar(p)}>
                            {p.name}
                          </div>
                        ))}
                      </div>
                    )}
                    {spouses.length > 0 && (
                      <div>
                        <strong className="block text-gray-500 text-xs uppercase tracking-wide">Spouse</strong>
                        {spouses.map(s => (
                          <div key={s.id} className="cursor-pointer text-blue-600 hover:underline" onClick={() => openSidebar(s)}>
                            ❤️ {s.name}
                          </div>
                        ))}
                      </div>
                    )}
                    {siblings.length > 0 && (
                      <div>
                        <strong className="block text-gray-500 text-xs uppercase tracking-wide">Siblings</strong>
                        {siblings.map(s => (
                          <div key={s.id} className="cursor-pointer text-blue-600 hover:underline" onClick={() => openSidebar(s)}>
                            {s.gender === 'female' ? '🌸' : '🔹'} {s.name}
                          </div>
                        ))}
                      </div>
                    )}
                    {children.length > 0 && (
                      <div>
                        <strong className="block text-gray-500 text-xs uppercase tracking-wide">Children</strong>
                        {children.map(c => (
                          <div key={c.id} className="cursor-pointer text-blue-600 hover:underline" onClick={() => openSidebar(c)}>
                            👶 {c.name}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-6 space-y-2">
                  <button className="w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    onClick={() => setSidebarMode("edit")}>
                    Edit Profile
                  </button>
                  <button className="w-full p-2 bg-green-600 text-white rounded hover:bg-green-700"
                    onClick={() => setSidebarMode("add-select")}>
                    Add Relative
                  </button>
                  <button className="w-full p-2 border border-red-200 text-red-600 rounded hover:bg-red-50"
                    onClick={removeMember}>
                    Remove Member
                  </button>
                </div>
              </div>
            )}

            {/* --- EDIT MODE --- */}
            {sidebarMode === "edit" && (
              <div className="space-y-4">
                <h3 className="font-bold text-lg">Edit Member</h3>

                <input className="border p-2 w-full rounded" placeholder="Full Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />

                <select className="border p-2 w-full rounded"
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                >
                  <option value="male">Male ♂</option>
                  <option value="female">Female ♀</option>
                  <option value="other">Other ⚧</option>
                </select>

                <label className="flex items-center gap-2 text-sm bg-gray-50 p-2 rounded">
                  <input type="checkbox" checked={formData.isAlive}
                    onChange={(e) => setFormData({ ...formData, isAlive: e.target.checked, deathDate: e.target.checked ? "" : formData.deathDate })}
                  />
                  Is this person alive?
                </label>

                <div>
                  <label className="text-xs text-gray-500">Birth Date</label>
                  <input type="date" className="border p-2 w-full rounded"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                  />
                </div>

                {!formData.isAlive && (
                  <div>
                    <label className="text-xs text-gray-500">Death Date</label>
                    <input type="date" className="border p-2 w-full rounded"
                      value={formData.deathDate}
                      onChange={(e) => setFormData({ ...formData, deathDate: e.target.value })}
                    />
                  </div>
                )}

                <input className="border p-2 w-full rounded" placeholder="Phone Number"
                  value={formData.contactNo}
                  onChange={(e) => setFormData({ ...formData, contactNo: e.target.value })}
                />

                {/* UPLOADER */}
                <div className="text-center p-4 bg-gray-50 rounded">
                  <img src={formData.img || DEFAULT_IMG} className="w-16 h-16 rounded-full mx-auto mb-2 object-cover" />
                  <div className="flex justify-center">
                    <FileUploaderRegular
                      pubkey="8adc52d0c4bb04d5e668"
                      classNameUploader="uc-light uc-purple"
                      sourceList="local, camera, facebook"
                      onFileUploadSuccess={(fileInfo) => {
                        setFormData({ ...formData, img: fileInfo.cdnUrl });
                        toast.success("Image uploaded");
                      }}
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <button className="flex-1 bg-gray-300 text-black p-2 rounded" onClick={() => setSidebarMode("view")}>Cancel</button>
                  <button className="flex-1 bg-blue-600 text-white p-2 rounded" onClick={saveEdit}>Save Changes</button>
                </div>
              </div>
            )}

            {/* --- ADD SELECT MODE --- */}
            {sidebarMode === "add-select" && (
              <div className="space-y-3">
                <h3 className="font-bold text-lg mb-4">What relationship?</h3>

                {/* 1. Add Child (Special Logic) */}
                <button className="w-full p-3 bg-blue-50 border border-blue-200 rounded text-left hover:bg-blue-100 flex items-center justify-between group"
                  onClick={handleAddChildClick}>
                  <span>Add Child</span>
                  <span className="text-blue-400 group-hover:translate-x-1 transition">→</span>
                </button>

                {/* 2. Other Relatives */}
                {["spouse", "sibling", "father", "mother"].map((r) => (
                  <button
                    key={r}
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded text-left hover:bg-gray-100 flex items-center justify-between capitalize group"
                    onClick={() => openGenericAddForm(r)}
                  >
                    <span>Add {r}</span>
                    <span className="text-gray-400 group-hover:translate-x-1 transition">→</span>
                  </button>
                ))}

                <button className="w-full p-2 text-gray-500 mt-4" onClick={() => setSidebarMode("view")}>Cancel</button>
              </div>
            )}

            {/* --- SELECT OTHER PARENT MODE --- */}
            {sidebarMode === "select-other-parent" && (
              <div className="space-y-3">
                <h3 className="font-bold text-lg">Select Co-Parent</h3>
                <p className="text-sm text-gray-500 mb-4">Who is the other parent of this child?</p>

                {getSpouses(selectedNode).map(spouse => (
                  <button
                    key={spouse.id}
                    className="flex items-center gap-3 w-full p-3 border rounded hover:bg-blue-50 transition text-left"
                    onClick={() => openAddChildForm(spouse.id)}
                  >
                    <img src={spouse.img || DEFAULT_IMG} className="w-10 h-10 rounded-full object-cover" />
                    <span className="font-medium">{spouse.name}</span>
                  </button>
                ))}

                <button
                  className="w-full p-3 border border-dashed rounded text-gray-500 hover:bg-gray-100 mt-2 text-sm"
                  onClick={() => openAddChildForm(null)}
                >
                  Unknown / Not Listed
                </button>

                <button className="w-full p-2 text-gray-500 mt-4" onClick={() => setSidebarMode("add-select")}>Back</button>
              </div>
            )}

            {/* --- ADD FORM MODE --- */}
            {sidebarMode === "add-form" && (
              <div className="space-y-4">
                <h3 className="font-bold text-lg capitalize">Add {relativeType || "Member"}</h3>

                {formData.mid && formData.fid && (
                  <div className="text-xs bg-blue-50 text-blue-700 p-2 rounded border border-blue-100 mb-2">
                    Adding child to <b>{selectedNode.name}</b> and partner.
                  </div>
                )}

                <input className="border p-2 w-full rounded" placeholder="Full Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />

                <select className="border p-2 w-full rounded"
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                >
                  <option value="male">Male ♂</option>
                  <option value="female">Female ♀</option>
                  <option value="other">Other ⚧</option>
                </select>

                <div className="space-y-1">
                  <label className="text-xs text-gray-500">Birth Date</label>
                  <input type="date" className="border p-2 w-full rounded"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                  />
                </div>

                <label className="flex items-center gap-2 text-sm bg-gray-50 p-2 rounded">
                  <input type="checkbox" checked={formData.isAlive}
                    onChange={(e) => setFormData({ ...formData, isAlive: e.target.checked, deathDate: e.target.checked ? "" : formData.deathDate })}
                  />
                  Is this person alive?
                </label>

                {!formData.isAlive && (
                  <div className="space-y-1">
                    <label className="text-xs text-gray-500">Death Date</label>
                    <input type="date" className="border p-2 w-full rounded"
                      value={formData.deathDate}
                      onChange={(e) => setFormData({ ...formData, deathDate: e.target.value })}
                    />
                  </div>
                )}

                <input className="border p-2 w-full rounded" placeholder="Phone Number"
                  value={formData.contactNo}
                  onChange={(e) => setFormData({ ...formData, contactNo: e.target.value })}
                />

                {/* LINK EXISTING CHILDREN (Spouse Mode) */}
                {relativeType === 'spouse' && getSingleParentChildren().length > 0 && (
                  <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                    <p className="text-sm font-bold text-yellow-800 mb-2">
                      Is this new spouse the parent of these existing children?
                    </p>
                    <div className="space-y-2">
                      {getSingleParentChildren().map(child => (
                        <label key={child.id} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={linkChildrenIds.includes(child.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setLinkChildrenIds([...linkChildrenIds, child.id]);
                              } else {
                                setLinkChildrenIds(linkChildrenIds.filter(id => id !== child.id));
                              }
                            }}
                          />
                          <span className="text-sm">
                            {child.name} <span className="text-gray-400 text-xs">({calculateAge(child.birthDate) || '?'})</span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="text-center p-4 bg-gray-50 rounded">
                  <div className="flex justify-center">
                    <FileUploaderRegular
                      pubkey="8adc52d0c4bb04d5e668"
                      classNameUploader="uc-light uc-purple"
                      sourceList="local, camera, facebook"
                      onFileUploadSuccess={(fileInfo) => {
                        setFormData({ ...formData, img: fileInfo.cdnUrl });
                        toast.success("Image uploaded");
                      }}
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <button className="flex-1 bg-gray-300 text-black p-2 rounded" onClick={() => setSidebarMode("view")}>Cancel</button>
                  <button className="flex-1 bg-green-600 text-white p-2 rounded" onClick={saveNewMember}>Save Member</button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default TreeEditor;