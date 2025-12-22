import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import TreeEditor from './pages/TreeEditor';
import MembersList from './pages/MembersList';
import JoinTree from './pages/JoinTree';

// Auth Pages (New)
import OAuthSuccess from './pages/OAuthSuccess';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// Route Guards
import ProtectedRoute from './components/ProtectedRoute'; // Keeps strangers OUT
import PublicRoute from './components/PublicRoute';       // Keeps members IN

function App() {
  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      
      <Routes>
        
        {/* --- PUBLIC ROUTES --- */}
        {/* Accessible only if NOT logged in. If logged in, redirects to /dashboard */}
        <Route element={<PublicRoute />}>
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
        </Route>

        {/* --- OAUTH CALLBACK --- */}
        {/* This must be accessible to handle the token exchange */}
        <Route path="/oauth-success" element={<OAuthSuccess />} />

        {/* --- PROTECTED ROUTES --- */}
        {/* Accessible only if logged in. If not, redirects to / */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/tree/:treeId" element={<TreeEditor />} />
          <Route path="/tree/:treeId/list" element={<MembersList />} />
          <Route path="/join/:token" element={<JoinTree />} />
        </Route>

      </Routes>
    </>
  );
}

export default App;