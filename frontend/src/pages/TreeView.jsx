import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axios';

// Import New Components
import Modal from '../components/Modal';
import MemberForm from '../components/MemberForm';

import FamilyTree from '../components/tree/FamilyTree';
import NodeDetailsModal from '../components/NodeDetailsModal';

import ShareModal from '../components/ShareModal';

// Placeholder Canvas (Same as before)
const FamilyTreeCanvas = ({ data }) => {
  return <div style={{ textAlign: 'center', marginTop: '50px' }}>Tree Visualization Coming Soon...</div>;
};

const TreeView = () => {
  const { id } = useParams();
  const [treeData, setTreeData] = useState(null);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPersonId, setSelectedPersonId] = useState(null);

  // --- Modal State ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  const [requestSent, setRequestSent] = useState(false);

  const [accessDenied, setAccessDenied] = useState(false);
  const isOwner = meta?.currentUserRole === 'owner';
  const isViewer = meta?.currentUserRole === 'viewer';

  const fetchTree = async () => {
    try {
      const metaRes = await api.get(`/trees/${id}`);
      setMeta(metaRes.data);
      const treeRes = await api.get(`/trees/${id}/full`);
      if (treeRes.data.root === null) {
        setTreeData(null);
      } else {
        setTreeData(treeRes.data.root);
      }
    } catch (err) {
      if (err.response && err.response.status === 403) {
        setAccessDenied(true);
      } else {
        console.error("Error loading tree", err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTree(); }, [id]);

  // --- Form Handler ---
  const handleRootSubmit = async (formData) => {
    try {
      await api.post(`/trees/${id}/root`, formData);
      setIsModalOpen(false); // Close Modal
      fetchTree(); // Refresh Data
    } catch (err) {
      alert("Failed to create root member: " + (err.response?.data?.message || err.message));
    }
  };

  const handleNodeClick = (person) => {
    setSelectedPersonId(person.id); // Open Modal with this ID
  };

  const handleModalClose = () => {
    setSelectedPersonId(null);
  };

  const handleTreeUpdate = () => {
    fetchTree();
  };

  const handleRequestAccess = async () => {
    try {
      await api.post(`/trees/${id}/share/request`);
      setRequestSent(true);
      alert("Request sent to owner!");
    } catch (err) {
      alert("Failed to send request.");
    }
  };

  if (loading) return <div style={{ padding: '50px' }}>Loading Tree...</div>;

  if (accessDenied) {
    return (
      <div style={{ textAlign: 'center', marginTop: '100px', padding: '20px' }}>
        <h2>🔒 Access Denied</h2>
        <p>You do not have permission to view this family tree.</p>
        <p style={{ color: '#666' }}>Please ask the owner to invite you using your email address.</p>
        <button 
          onClick={() => navigate('/')}
          style={btnStyle}
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div style={{ height: 'calc(100vh - 60px)', display: 'flex', flexDirection: 'column' }}>

      <header style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <h2 style={{ margin: 0 }}>{meta?.name}</h2>
          {/* Permission Badge */}
          <span style={permissionBadgeStyle}>
            {meta?.currentUserRole?.toUpperCase()}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
         
         {/* SHARE BUTTON (Owner Only) */}
         {isOwner && (
           <button onClick={() => setIsShareModalOpen(true)} style={shareBtnStyle}>
             👥 Share & Requests
           </button>
         )}

         {/* REQUEST EDIT BUTTON (Viewer Only) */}
         {isViewer && (
           <button 
             onClick={handleRequestAccess} 
             disabled={requestSent}
             style={{...shareBtnStyle, background: requestSent ? '#ccc' : '#fff3cd', borderColor: '#e0a800'}}
           >
             {requestSent ? "Request Sent" : "🔓 Request Edit Access"}
           </button>
         )}
       </div>
      </header>

      <div style={{ flex: 1, overflow: 'auto', background: '#f4f4f9' }}>

        {/* Empty State */}
        {!treeData && (
          <div style={emptyStateStyle}>
            <h3>This tree is empty.</h3>
            <p>Start by adding the first family member.</p>
            {/* Opens the Modal instead of Prompt */}
            <button onClick={() => setIsModalOpen(true)} style={btnStyle}>
              + Add First Member
            </button>
          </div>
        )}

        {/* Tree Data */}
        {treeData && (
          <FamilyTree
            data={treeData}
            onNodeClick={handleNodeClick}
          />
        )}

      </div>

      {/* --- THE MODAL --- */}
      <Modal isOpen={isModalOpen} title="Add First Member" onClose={() => setIsModalOpen(false)}>
        <MemberForm onSubmit={handleRootSubmit} onCancel={() => setIsModalOpen(false)} />
      </Modal>

      {/* --- THE DETAILS MODAL --- */}
      <NodeDetailsModal
        isOpen={!!selectedPersonId}
        personId={selectedPersonId}
        onClose={handleModalClose}
        onUpdate={handleTreeUpdate}
      />

      {/* SHARE MODAL */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        treeId={id}
      />

    </div>
  );
};

// (Keep your existing styles: headerStyle, emptyStateStyle, btnStyle)
const shareBtnStyle = {
  padding: '8px 16px',
  background: 'white',
  border: '1px solid #ccc',
  borderRadius: '4px',
  cursor: 'pointer',
  fontWeight: 'bold',
  color: '#555',
  display: 'flex',
  alignItems: 'center',
  gap: '5px'
};

const permissionBadgeStyle = {
  fontSize: '10px',
  background: '#eee',
  padding: '2px 6px',
  borderRadius: '4px',
  color: '#666'
};
const headerStyle = { padding: '10px 30px', background: 'white', borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const emptyStateStyle = { textAlign: 'center', marginTop: '100px', color: '#555' };
const btnStyle = { marginTop: '20px', padding: '12px 24px', fontSize: '16px', background: '#2196f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' };

export default TreeView;