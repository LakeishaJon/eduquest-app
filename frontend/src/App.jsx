import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import MathQuest from './pages/MathQuest';
import WordQuest from './pages/WordQuest';
import MemoryQuest from './pages/MemoryQuest'; 
import Dashboard from './pages/Dashboard';
import Leaderboard from './pages/Leaderboard';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-6xl mb-4">⏳</div>
          <p className="text-white text-xl">Loading...</p>
        </div>
      </div>
    );
  }
  
  return user ? children : <Navigate to="/login" />;
};

function AppContent() {
  return (
    <Router>
      <div className="min-h-screen">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          
          {/* Math Game Route */}
          <Route
            path="/math"
            element={
              <ProtectedRoute>
                <MathQuest />
              </ProtectedRoute>
            }
          />
          
          {/* Word Game Route */}
          <Route
            path="/word"
            element={
              <ProtectedRoute>
                <WordQuest />
              </ProtectedRoute>
            }
          />
          
          {/* Memory Game Route - NEW! */}
          <Route
            path="/memory"
            element={
              <ProtectedRoute>
                <MemoryQuest />
              </ProtectedRoute>
            }
          />
          
          {/* Dashboard Route */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;