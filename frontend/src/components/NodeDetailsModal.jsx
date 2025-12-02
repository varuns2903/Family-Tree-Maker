import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import Modal from './Modal';
import MemberForm from './MemberForm';

const NodeDetailsModal = ({ personId, isOpen, onClose, onUpdate }) => {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('view'); // 'view', 'edit', 'add_spouse', 'add_child', 'add_parent'
  
  // Fetch full details when modal opens
  useEffect(() => {
    if (isOpen && personId) {
      fetchDetails();
      setMode('view');
    }
  }, [isOpen, personId]);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/people/${personId}/details`);      
      setDetails(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // --- ACTIONS ---

  const handleEdit = async (formData) => {
    try {
      await api.put(`/people/${personId}`, formData);
      onUpdate(); // Refresh Tree
      fetchDetails(); // Refresh Modal
      setMode('view');
    } catch (err) {
      alert("Failed to update");
    }
  };

  const handleAddRelative = async (type, formData) => {
    try {
      let endpoint = '';
      if (type === 'add_spouse') endpoint = `/people/${personId}/spouse`;
      if (type === 'add_child') endpoint = `/people/${personId}/child`;
      if (type === 'add_parent') endpoint = `/people/${personId}/parent`;

      await api.post(endpoint, formData);
      onUpdate();
      onClose(); // Close modal on success
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add relative");
    }
  };

  const handleDelete = async (deleteMode) => {
    if(!window.confirm("Are you sure?")) return;
    try {
      await api.delete(`/people/${personId}?mode=${deleteMode}`);
      onUpdate();
      onClose();
    } catch (err) {
      alert("Failed to delete");
    }
  };

  // --- RENDERERS ---

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} title={getTitle(mode, details)} onClose={onClose}>
      {loading || !details ? (
        <div>Loading details...</div>
      ) : (
        <>
          {/* VIEW MODE */}
          {mode === 'view' && (
            <div style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
              
              {/* Header Info */}
              <div style={infoBoxStyle}>
                <div style={{fontSize: '18px', fontWeight: 'bold'}}>{details.name}</div>
                <div style={{color: '#666', fontSize: '14px'}}>
                   {details.gender} • Born: {details.birth_date ? new Date(details.birth_date).getFullYear() : '?'}
                   {!details.is_alive && ` • Died: ${new Date(details.death_date).getFullYear()}`}
                </div>
                {details.contact_info && (
                   <div style={{fontSize: '13px', marginTop: '5px'}}>📞 {details.contact_info}</div>
                )}
              </div>

              {/* Action Grid */}
              <div style={actionGridStyle}>
                <button style={actionBtnStyle} onClick={() => setMode('edit')}>✏️ Edit Details</button>
                <button style={actionBtnStyle} onClick={() => setMode('add_spouse')}>💍 Add Spouse</button>
                <button style={actionBtnStyle} onClick={() => setMode('add_child')}>👶 Add Child</button>
                <button style={actionBtnStyle} onClick={() => setMode('add_parent')}>👴 Add Parent</button>
              </div>

              {/* Delete Zone */}
              <div style={{borderTop: '1px solid #eee', paddingTop: '15px'}}>
                <div style={{fontSize: '12px', color: '#999', marginBottom: '5px'}}>Danger Zone</div>
                <div style={{display: 'flex', gap: '10px'}}>
                  <button style={deleteBtnStyle} onClick={() => handleDelete('keep')}>Remove (Keep Kids)</button>
                  <button style={deleteBtnStyle} onClick={() => handleDelete('cascade')}>Delete Branch</button>
                </div>
              </div>

              {/* Relatives List (Optional: Display Spouses/Children names) */}
              <div>
                <strong>Spouses: </strong> 
                {details.spouses.length > 0 ? details.spouses.map(s => s.name).join(', ') : 'None'}
              </div>
              <div>
                <strong>Children: </strong> 
                {details.children.length > 0 ? details.children.map(c => c.name).join(', ') : 'None'}
              </div>

            </div>
          )}

          {/* EDIT FORM */}
          {mode === 'edit' && (
            <MemberForm 
              initialData={{
                name: details.name,
                gender: details.gender,
                birthDate: details.birth_date?.split('T')[0],
                isAlive: details.is_alive,
                deathDate: details.death_date?.split('T')[0],
                contactInfo: details.contact_info
              }}
              onSubmit={handleEdit}
              onCancel={() => setMode('view')}
            />
          )}

          {/* ADD RELATIVE FORMS */}
          {['add_spouse', 'add_child', 'add_parent'].includes(mode) && (
             <RelativeFormWrapper 
               mode={mode}
               person={details}
               onSubmit={(data) => handleAddRelative(mode, data)}
               onCancel={() => setMode('view')}
             />
          )}
        </>
      )}
    </Modal>
  );
};

// Helper to wrap MemberForm with extra logic (like selecting Other Parent)
const RelativeFormWrapper = ({ mode, person, onSubmit, onCancel }) => {
  const [otherParentId, setOtherParentId] = useState('');

  const handleSubmit = (formData) => {
    // If adding child, include the selected other parent (if any)
    if (mode === 'add_child' && otherParentId) {
      formData.otherParentId = otherParentId;
    }
    onSubmit(formData);
  };

  return (
    <div>
      {/* Logic for selecting spouse when adding child */}
      {mode === 'add_child' && person.spouses.length > 1 && (
        <div style={{marginBottom: '15px', padding: '10px', background: '#fff3cd', borderRadius: '4px'}}>
          <label style={{display: 'block', fontSize: '12px', marginBottom: '5px'}}>Select the other parent:</label>
          <select 
            style={{width: '100%', padding: '5px'}}
            value={otherParentId} 
            onChange={(e) => setOtherParentId(e.target.value)}
          >
            <option value="">-- Auto Infer / Single Parent --</option>
            {person.spouses.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      )}

      <MemberForm onSubmit={handleSubmit} onCancel={onCancel} />
    </div>
  );
};

// Helper for Titles
const getTitle = (mode, details) => {
  if (!details) return "Loading...";
  switch(mode) {
    case 'view': return details.name;
    case 'edit': return `Edit ${details.name}`;
    case 'add_spouse': return `Add Spouse for ${details.name}`;
    case 'add_child': return `Add Child to ${details.name}`;
    case 'add_parent': return `Add Parent to ${details.name}`;
    default: return "";
  }
};

// --- Styles ---
const infoBoxStyle = { background: '#f8f9fa', padding: '15px', borderRadius: '6px', marginBottom: '20px', border: '1px solid #e9ecef' };
const actionGridStyle = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' };
const actionBtnStyle = { padding: '10px', background: 'white', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' };
const deleteBtnStyle = { padding: '5px 10px', background: '#ffebee', color: '#c62828', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' };

export default NodeDetailsModal;