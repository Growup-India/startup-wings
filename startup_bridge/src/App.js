import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import Homepage from './components/Homepage';
import Features from './components/Features';
import About from './components/Aboutus';
import Contact from './components/Contact';
import Services from './components/Services';
import UserDashboard from './components/UserDashboard';
import './App.css';

// Google OAuth Callback Handler Component
function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const userStr = params.get('user');
    const error = params.get('error');

    if (error) {
      alert('Authentication failed. Please try again.');
      navigate('/');
      return;
    }

    if (token && userStr) {
      try {
        const userData = JSON.parse(decodeURIComponent(userStr));
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        
        // Redirect to dashboard
        window.location.href = '/dashboard';
      } catch (error) {
        console.error('Error parsing OAuth response:', error);
        alert('Authentication failed. Please try again.');
        navigate('/');
      }
    } else {
      navigate('/');
    }
  }, [location, navigate]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      fontSize: '18px'
    }}>
      Processing authentication...
    </div>
  );
}

// Main App Content Component
function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for OAuth callback parameters on mount and check existing session
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get('token');
    const userStr = params.get('user');
    const error = params.get('error');

    if (error) {
      alert('Authentication failed. Please try again.');
      setLoading(false);
      return;
    }

    if (token && userStr) {
      try {
        const userData = JSON.parse(decodeURIComponent(userStr));
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        setUser(userData);
        
        // Clean URL and redirect to dashboard
        window.history.replaceState({}, document.title, '/dashboard');
        setLoading(false);
        return;
      } catch (error) {
        console.error('Error parsing OAuth response:', error);
      }
    }

    // Check existing session
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (savedToken && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    
    setLoading(false);
  }, [location, navigate]);

  const handleLogin = (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    navigate('/dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('startupProfile');
    setUser(null);
    navigate('/');
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <Routes>
      {/* Home routes - allow access even when logged in */}
      <Route 
        path="/" 
        element={<Homepage onLogin={handleLogin} user={user} onLogout={handleLogout} />} 
      />
      <Route 
        path="/home" 
        element={<Homepage onLogin={handleLogin} user={user} onLogout={handleLogout} />} 
      />
      

      {/* OAuth callback route */}
      <Route 
        path="/auth/callback" 
        element={<AuthCallback />} 
      />

      {/* Dashboard route - protected */}
      <Route 
        path="/dashboard" 
        element={
          user ? 
            <UserDashboard user={user} onLogout={handleLogout} /> : 
            <Navigate to="/" replace />
        } 
      />

      {/* Other routes - pass user state to maintain login status */}
      <Route 
        path="/features" 
        element={<Features onLogin={handleLogin} user={user} onLogout={handleLogout} />} 
      />
      <Route 
        path="/about" 
        element={<About onLogin={handleLogin} user={user} onLogout={handleLogout} />} 
      />
      <Route 
        path="/contact" 
        element={<Contact onLogin={handleLogin} user={user} onLogout={handleLogout} />} 
      />
      <Route 
        path="/services" 
        element={<Services onLogin={handleLogin} user={user} onLogout={handleLogout} />} 
      />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <div className="App">
      <Router>
        <AppContent />
      </Router>
    </div>
  );
}

export default App;