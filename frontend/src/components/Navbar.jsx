import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white/95 backdrop-blur-md shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2 group">
            <span className="text-3xl group-hover:scale-110 transition-transform">🎮</span>
            <span className="text-teal-600 text-2xl font-bold">EduQuest</span>
          </Link>

          <div className="flex items-center space-x-6">
            {user ? (
              <>
                <Link 
                  to="/" 
                  className="text-gray-700 hover:text-teal-600 transition font-medium flex items-center gap-1"
                >
                  <span>🏠</span> Home
                </Link>
                <Link 
                  to="/dashboard" 
                  className="text-gray-700 hover:text-teal-600 transition font-medium flex items-center gap-1"
                >
                  <span>📊</span> Dashboard
                </Link>
                <Link 
                  to="/leaderboard" 
                  className="text-gray-700 hover:text-teal-600 transition font-medium flex items-center gap-1"
                >
                  <span>🏆</span> Leaderboard
                </Link>
                <div className="flex items-center space-x-2 bg-amber-400 px-4 py-2 rounded-full shadow-md">
                  <span className="text-2xl">⭐</span>
                  <span className="font-bold text-gray-800">{user.totalStars}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-gray-700 font-medium">{user.username}</span>
                  <button
                    onClick={handleLogout}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition shadow-md"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link 
                  to="/" 
                  className="text-gray-700 hover:text-teal-600 transition font-medium flex items-center gap-1"
                >
                  <span>🏠</span> Home
                </Link>
                <Link 
                  to="/login" 
                  className="text-gray-700 hover:text-teal-600 transition font-medium"
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="bg-teal-500 hover:bg-teal-600 text-white px-6 py-2 rounded-lg font-semibold transition shadow-md"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;