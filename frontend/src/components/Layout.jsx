import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link, Outlet } from 'react-router-dom';

const Layout = () => {
  const { user, logout } = useContext(AuthContext);

  return (
    <div>
      {/* Navigation Bar */}
      <nav style={navStyle}>
        <div style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>
          <Link to="/" style={{ color: 'white', textDecoration: 'none' }}>
            🌳 FamilyTree App
          </Link>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <span>Welcome, {user?.name}</span>
          <button onClick={logout} style={logoutBtnStyle}>Logout</button>
        </div>
      </nav>

      {/* Page Content Renders Here */}
      <main>
        <Outlet />
      </main>
    </div>
  );
};

// Simple inline styles for the layout
const navStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '0 20px',
  height: '60px',
  backgroundColor: '#333',
  color: 'white',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
};

const logoutBtnStyle = {
  padding: '6px 12px',
  background: '#e74c3c',
  border: 'none',
  borderRadius: '4px',
  color: 'white',
  cursor: 'pointer',
  fontWeight: 'bold'
};

export default Layout;