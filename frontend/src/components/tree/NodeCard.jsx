import React from 'react';

const NodeCard = ({ person, spouses, activeSpouseIndex, onToggleSpouse, onClick }) => {
  const count = spouses ? spouses.length : 0;
  
  // Detect Placeholder
  const isPlaceholder = !person.id || person.name === "Unknown";

  const getAge = () => {
    if (!person.birth_date) return null;
    const birth = new Date(person.birth_date);
    const end = person.death_date ? new Date(person.death_date) : new Date();
    let age = end.getFullYear() - birth.getFullYear();
    const m = end.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && end.getDate() < birth.getDate())) age--;
    return age;
  };

  const age = getAge();

  // Define Colors based on Gender
  const getGenderStyle = () => {
    if (isPlaceholder) return {}; // CSS class handles this now
    
    if (person.gender === 'male') {
      return { backgroundColor: '#e3f2fd', borderColor: '#90caf9', color: '#1565c0' };
    } 
    if (person.gender === 'female') {
      return { backgroundColor: '#fce4ec', borderColor: '#f48fb1', color: '#ad1457' };
    }
    return { backgroundColor: '#ffffff', borderColor: '#ddd', color: '#333' };
  };

  return (
    <div 
      className={`person-node ${isPlaceholder ? 'placeholder' : ''}`} 
      style={{
        ...getGenderStyle(),
        transition: 'all 0.2s ease',
        cursor: isPlaceholder ? 'default' : 'pointer'
      }}
      onClick={(e) => {
        e.stopPropagation(); 
        if (!isPlaceholder) onClick(person); 
      }}
    >
      <div className="person-name">
        {isPlaceholder ? "?" : person.name}
      </div>
      
      {!isPlaceholder && (
        <>
          <div style={{ fontSize: '11px', opacity: 0.9, marginTop: '4px' }}>
            {age !== null ? `${age} Yrs` : ''}
            {!person.is_alive && ' (Deceased)'}
          </div>

          {/* Spouse Controls */}
          {count > 1 && (
            <div 
              className="spouse-controls" 
              onClick={(e) => e.stopPropagation()}
              style={{ marginTop: '8px', borderColor: 'rgba(0,0,0,0.1)' }}
            >
              <span className="control-btn" onClick={() => onToggleSpouse(-1)}>&lt;</span>
              <span>{activeSpouseIndex + 1} / {count}</span>
              <span className="control-btn" onClick={() => onToggleSpouse(1)}>&gt;</span>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default NodeCard;