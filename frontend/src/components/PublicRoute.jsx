import { Navigate, Outlet } from 'react-router-dom';

const PublicRoute = () => {
  const token = localStorage.getItem('token');

  // If token exists, send them to dashboard immediately
  // If no token, allow them to view the child route (Login/Register)
  return token ? <Navigate to="/dashboard" replace /> : <Outlet />;
};

export default PublicRoute;