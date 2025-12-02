import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import Modal from './Modal';

const ShareModal = ({ isOpen, onClose, treeId }) => {
  const [collaborators, setCollaborators] = useState([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('viewer'); // Default role
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copySuccess, setCopySuccess] = useState('');
  const [requests, setRequests] = useState([]);

  // Fetch list when modal opens
  useEffect(() => {
    if (isOpen && treeId) {
      fetchCollaborators();
      fetchRequests();
    }
  }, [isOpen, treeId]);

  const fetchCollaborators = async () => {
    try {
      const res = await api.get(`/trees/${treeId}/share`);
      setCollaborators(res.data);
    } catch (err) {
      console.error("Failed to load collaborators");
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await api.get(`/trees/${treeId}/share/requests`);
      setRequests(res.data);
    } catch (err) { console.error(err); }
  };

  const handleRequestAction = async (requestId, action) => {
    try {
      await api.post(`/trees/${treeId}/share/requests/${requestId}`, { action });
      fetchRequests();      // Refresh requests list
      fetchCollaborators(); // Refresh collaborators list (if approved)
    } catch (err) {
      alert("Action failed");
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api.post(`/trees/${treeId}/share`, { email, role });
      setEmail(''); // Clear input
      fetchCollaborators(); // Refresh list
    } catch (err) {
      setError(err.response?.data?.message || "Failed to invite user");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    const link = `${window.location.origin}/tree/${treeId}`;
    navigator.clipboard.writeText(link);
    setCopySuccess('Copied!');
    setTimeout(() => setCopySuccess(''), 2000);
  };

  const handleRemove = async (userId) => {
    if(!window.confirm("Remove this user?")) return;
    try {
      await api.delete(`/trees/${treeId}/share/${userId}`);
      fetchCollaborators();
    } catch (err) {
      alert("Failed to remove user");
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} title="Share Tree" onClose={onClose}>
      <div style={{ paddingBottom: '10px' }}>

        {/* --- NEW: PENDING REQUESTS SECTION --- */}
        {requests.length > 0 && (
          <div style={{ marginBottom: '20px', background: '#fff3cd', padding: '10px', borderRadius: '4px' }}>
            <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#856404' }}>⚠️ Pending Requests</h4>
            <ul style={listStyle}>
              {requests.map(req => (
                <li key={req.id} style={listItemStyle}>
                  <div>
                    <span style={{fontWeight:'bold'}}>{req.name}</span> <br/>
                    <span style={{fontSize:'11px'}}>{req.email}</span>
                  </div>
                  <div style={{display:'flex', gap:'5px'}}>
                    <button 
                      onClick={() => handleRequestAction(req.id, 'approve')}
                      style={{...actionBtnStyle, background: '#28a745', color: 'white', borderColor: '#28a745'}}
                    >
                      Approve
                    </button>
                    <button 
                      onClick={() => handleRequestAction(req.id, 'reject')}
                      style={{...actionBtnStyle, background: '#dc3545', color: 'white', borderColor: '#dc3545'}}
                    >
                      Reject
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* COPY LINK SECTION */}
        <div style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: '12px', color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '250px' }}>
             {window.location.origin}/tree/{treeId}
          </div>
          <button 
            onClick={handleCopyLink}
            style={{ fontSize: '12px', padding: '4px 8px', cursor: 'pointer', border: '1px solid #ccc', borderRadius: '4px', background: 'white' }}
          >
            {copySuccess || 'Copy Link'}
          </button>
        </div>
        
        {/* INVITE FORM */}
        <form onSubmit={handleInvite} style={formStyle}>
          <input 
            type="email" 
            placeholder="User Email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={inputStyle}
            required
          />
          <select 
            value={role} 
            onChange={(e) => setRole(e.target.value)}
            style={selectStyle}
          >
            <option value="viewer">Viewer</option>
            <option value="editor">Editor</option>
          </select>
          <button type="submit" disabled={loading} style={btnStyle}>
            {loading ? '...' : 'Invite'}
          </button>
        </form>

        {error && <div style={errorStyle}>{error}</div>}

        <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #eee' }} />

        {/* COLLABORATOR LIST */}
        <h4 style={{ margin: '0 0 10px 0', color: '#555' }}>Who has access</h4>
        
        {collaborators.length === 0 ? (
          <div style={{ color: '#999', fontSize: '14px' }}>No one yet. Invite someone above!</div>
        ) : (
          <ul style={listStyle}>
            {collaborators.map(collab => (
              <li key={collab.id} style={listItemStyle}>
                <div>
                  <div style={{ fontWeight: 'bold' }}>{collab.name || collab.email}</div>
                  <div style={{ fontSize: '12px', color: '#777' }}>{collab.email}</div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={roleBadgeStyle(collab.role)}>{collab.role.toUpperCase()}</span>
                  <button 
                    onClick={() => handleRemove(collab.user_id)} 
                    style={removeBtnStyle}
                  >
                    &times;
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

      </div>
    </Modal>
  );
};

// --- Styles ---
const formStyle = { display: 'flex', gap: '10px', marginBottom: '10px' };
const inputStyle = { flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid #ccc' };
const selectStyle = { padding: '8px', borderRadius: '4px', border: '1px solid #ccc' };
const btnStyle = { padding: '8px 16px', background: '#2196f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' };
const errorStyle = { color: 'red', fontSize: '12px', marginTop: '5px' };
const actionBtnStyle = {
  fontSize: '11px', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', border: '1px solid'
};
const listStyle = { listStyle: 'none', padding: 0, margin: 0, maxHeight: '200px', overflowY: 'auto' };
const listItemStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f9f9f9' };

const roleBadgeStyle = (role) => ({
  fontSize: '10px',
  padding: '3px 6px',
  borderRadius: '4px',
  background: role === 'editor' ? '#e3f2fd' : '#f5f5f5',
  color: role === 'editor' ? '#1565c0' : '#666',
  fontWeight: 'bold'
});

const removeBtnStyle = { background: 'none', border: 'none', color: '#c62828', fontSize: '18px', cursor: 'pointer', padding: '0 5px' };

export default ShareModal;