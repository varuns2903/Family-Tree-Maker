import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import TreeEditor from './pages/TreeEditor';
import JoinTree from './pages/JoinTree';
import ProtectedRoute from './components/ProtectedRoute'; // Keeps strangers OUT
import PublicRoute from './components/PublicRoute';       // Keeps members IN
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        
        {/* PUBLIC ROUTES (Accessible only if NOT logged in) */}
        {/* If logged in, these will redirect to /dashboard automatically */}
        <Route element={<PublicRoute />}>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* PROTECTED ROUTES (Accessible only if logged in) */}
        {/* If NOT logged in, these will redirect to / automatically */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/tree/:treeId" element={<TreeEditor />} />
          <Route path="/join/:token" element={<JoinTree />} />
        </Route>

      </Routes>
    </>
  );
}

export default App;