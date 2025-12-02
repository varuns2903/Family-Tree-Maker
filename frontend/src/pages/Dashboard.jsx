import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [trees, setTrees] = useState([]);
  const [newTreeName, setNewTreeName] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch Trees on Mount
  useEffect(() => {
    fetchTrees();
  }, []);

  const fetchTrees = async () => {
    try {
      const res = await api.get('/trees');
      setTrees(res.data);
    } catch (err) {
      console.error("Failed to fetch trees", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newTreeName.trim()) return;

    try {
      const res = await api.post('/trees', { name: newTreeName });
      const newTree = { ...res.data, role: 'owner' };
      setTrees([...trees, newTree]); // Update UI instantly
      setNewTreeName(''); // Reset input
    } catch (err) {
      alert("Error creating tree");
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '20px', color: '#444' }}>My Family Trees</h2>

      {/* Create Tree Section */}
      <div style={createBoxStyle}>
        <input 
          type="text" 
          placeholder="New Tree Name (e.g. The Smiths)"
          value={newTreeName}
          onChange={(e) => setNewTreeName(e.target.value)}
          style={inputStyle}
        />
        <button onClick={handleCreate} style={btnStyle}>+ Create Tree</button>
      </div>

      {/* List Trees */}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div style={gridStyle}>
          {trees.length === 0 && <p style={{color:'#888'}}>No trees yet. Create one above!</p>}
          
          {trees.map((tree) => (
            <div 
              key={tree.id} 
              style={cardStyle} 
              onClick={() => navigate(`/tree/${tree.id}`)}
            >
              <h3 style={{ margin: '0 0 10px 0' }}>{tree.name}</h3>
              <p style={{ fontSize: '12px', color: '#666' }}>
                {/* FIX: Add a safe check just in case */}
                Role: {tree.role ? tree.role.toUpperCase() : 'OWNER'}
              </p>
              <p style={{ fontSize: '12px', color: '#999' }}>
                Created: {new Date(tree.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Styles
const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
  gap: '20px',
  marginTop: '30px'
};

const cardStyle = {
  background: 'white',
  padding: '20px',
  borderRadius: '8px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  cursor: 'pointer',
  transition: 'transform 0.2s',
  border: '1px solid #eee'
};

const createBoxStyle = {
  background: '#f8f9fa',
  padding: '20px',
  borderRadius: '8px',
  display: 'flex',
  gap: '10px',
  alignItems: 'center'
};

const inputStyle = {
  flex: 1,
  padding: '10px',
  borderRadius: '4px',
  border: '1px solid #ccc'
};

const btnStyle = {
  padding: '10px 20px',
  background: '#2196f3',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontWeight: 'bold'
};

export default Dashboard;