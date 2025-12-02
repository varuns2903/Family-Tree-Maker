import React, { useState } from 'react';

const MemberForm = ({ onSubmit, initialData = {}, onCancel }) => {
  const [formData, setFormData] = useState({
    name: initialData.name || '',
    gender: initialData.gender || 'male',
    birthDate: initialData.birthDate || null,
    isAlive: initialData.isAlive !== undefined ? initialData.isAlive : true,
    deathDate: initialData.deathDate || null,
    contactInfo: initialData.contactInfo || ''
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Pass data back to parent
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
      
      {/* Name */}
      <div style={fieldGroup}>
        <label>Full Name *</label>
        <input 
          required 
          type="text" 
          name="name" 
          value={formData.name} 
          onChange={handleChange} 
          style={inputStyle} 
          placeholder="e.g. John Doe"
        />
      </div>

      {/* Gender */}
      <div style={fieldGroup}>
        <label>Gender *</label>
        <select name="gender" value={formData.gender} onChange={handleChange} style={inputStyle}>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>
      </div>

      {/* Birth Date */}
      <div style={fieldGroup}>
        <label>Date of Birth</label>
        <input 
          type="date" 
          name="birthDate" 
          value={formData.birthDate} 
          onChange={handleChange} 
          style={inputStyle} 
        />
      </div>

      {/* Is Alive Checkbox */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <input 
          type="checkbox" 
          id="isAlive" 
          name="isAlive" 
          checked={formData.isAlive} 
          onChange={handleChange}
        />
        <label htmlFor="isAlive" style={{ cursor: 'pointer' }}>Is this person living?</label>
      </div>

      {/* Death Date (Conditional) */}
      {!formData.isAlive && (
        <div style={fieldGroup}>
          <label>Date of Death</label>
          <input 
            type="date" 
            name="deathDate" 
            value={formData.deathDate} 
            onChange={handleChange} 
            style={inputStyle} 
          />
        </div>
      )}

      {/* Contact Info */}
      <div style={fieldGroup}>
        <label>Contact Info (Phone/Email)</label>
        <input 
          type="text" 
          name="contactInfo" 
          value={formData.contactInfo} 
          onChange={handleChange} 
          style={inputStyle} 
          placeholder="Optional"
        />
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
        <button type="button" onClick={onCancel} style={cancelBtnStyle}>Cancel</button>
        <button type="submit" style={submitBtnStyle}>Save Member</button>
      </div>

    </form>
  );
};

// --- Styles ---
const fieldGroup = { display: 'flex', flexDirection: 'column', gap: '5px' };
const inputStyle = { padding: '8px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '14px' };
const submitBtnStyle = { padding: '10px 20px', background: '#2196f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' };
const cancelBtnStyle = { padding: '10px 20px', background: '#eee', color: '#333', border: 'none', borderRadius: '4px', cursor: 'pointer' };

export default MemberForm;