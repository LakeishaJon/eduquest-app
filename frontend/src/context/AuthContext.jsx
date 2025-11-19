import { createContext, useState, useContext, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  //  Check for saved login on app startup
  useEffect(() => {
    const checkAuth = () => {
      try {
        // Try localStorage first (Remember Me)
        let token = localStorage.getItem('token');
        const tokenExpiry = localStorage.getItem('tokenExpiry');
        
        // Check if remembered token expired
        if (token && tokenExpiry) {
          if (Date.now() > parseInt(tokenExpiry)) {
            // Token expired, clear it
            console.log('🔒 Remembered token expired, clearing...');
            localStorage.removeItem('token');
            localStorage.removeItem('tokenExpiry');
            localStorage.removeItem('user');
            token = null;
          }
        }
        
        // If no localStorage token, try sessionStorage (current session only)
        if (!token) {
          token = sessionStorage.getItem('token');
        }
        
        // Load user data if token exists
        if (token) {
          const userData = localStorage.getItem('user');
          if (userData) {
            setUser(JSON.parse(userData));
            console.log('✅ User auto-logged in');
          }
        }
      } catch (error) {
        console.error('❌ Auth check failed:', error);
        // Clear everything on error
        localStorage.removeItem('token');
        localStorage.removeItem('tokenExpiry');
        sessionStorage.removeItem('token');
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  //  Login with Remember Me option
  const login = async (username, password, rememberMe = false) => {
    try {
      const { data } = await api.post('/users/login', { username, password });
      
      // Save user data
      setUser(data);
      localStorage.setItem('user', JSON.stringify(data));
      
      //  Save token based on Remember Me choice
      if (rememberMe) {
        // Remember for 30 days
        localStorage.setItem('token', data.token);
        const expiryTime = Date.now() + (30 * 24 * 60 * 60 * 1000); // 30 days
        localStorage.setItem('tokenExpiry', expiryTime.toString());
        console.log('🔒 Token saved for 30 days');
      } else {
        // Current session only (clears when browser closes)
        sessionStorage.setItem('token', data.token);
        console.log('🔒 Token saved for current session only');
      }
      
      return { success: true };
    } catch (error) {
      console.error('❌ Login error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  const register = async (username, email, password) => {
    try {
      const { data } = await api.post('/users/register', { 
        username, 
        email, 
        password 
      });
      
      // Save user data
      setUser(data);
      localStorage.setItem('user', JSON.stringify(data));
      
      // Default to session storage for new registrations
      sessionStorage.setItem('token', data.token);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Registration failed' 
      };
    }
  };

  //  Logout - clears EVERYTHING
  const logout = () => {
    console.log('👋 Logging out...');
    
    // Clear all auth data
    localStorage.removeItem('token');
    localStorage.removeItem('tokenExpiry');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    
    setUser(null);
  };

  const updateUserStars = (stars) => {
    if (user) {
      const updatedUser = { ...user, totalStars: stars };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateUserStars
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};