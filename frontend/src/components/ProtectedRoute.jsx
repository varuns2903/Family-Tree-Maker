import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = () => {
  // Check if token exists in localStorage (or use your AuthContext)
  const token = localStorage.getItem('token'); 

  // If token exists, render the child route (Outlet)
  // Otherwise, redirect to the login page ("/")
  return token ? <Outlet /> : <Navigate to="/" replace />;
};

export default ProtectedRoute;