import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";

import Homepage from "./components/Homepage";
import Features from "./components/Features";
import About from "./components/Aboutus";
import Contact from "./components/Contact";
import Services from "./components/Services";
import UserDashboard from "./components/UserDashboard";
import AdminDashboard from "./components/Admindashboard";
import Career from "./components/career";
import CareerForm from "./components/careerform";
import AuthModal from "./components/AuthModal";
import "./App.css";

// Helper function to decode JWT
const decodeJWT = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
};

// Helper to check if an email is the configured admin email
const isAdminEmail = (email) => {
  const adminEmail = process.env.REACT_APP_ADMIN_EMAIL;
  if (!adminEmail || !email) return false;
  try {
    return adminEmail.toLowerCase() === String(email).toLowerCase();
  } catch (e) {
    return false;
  }
};

// Helper to get user role from token or user object
const getUserRole = () => {
  const token = localStorage.getItem('token');
  const userStr = localStorage.getItem('user');

  if (token) {
    const decoded = decodeJWT(token);
    if (decoded?.role) return decoded.role;
  }

  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user.role) return user.role;
      if (isAdminEmail(user.email)) return 'admin';
      return 'user';
    } catch (e) {
      return 'user';
    }
  }

  return 'user';
};

// Google OAuth Callback Handler Component
function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const token = params.get("token");
    const userStr = params.get("user");
    const error = params.get("error");

    console.log("=== OAuth Callback ===", { token: !!token, userStr: !!userStr, error });

    if (error) {
      console.error("Authentication error:", error);
      alert("Authentication failed. Please try again.");
      navigate("/", { replace: true });
      return;
    }

    if (token && userStr) {
      try {
        const userData = JSON.parse(decodeURIComponent(userStr));
        console.log("OAuth userData:", userData);

        // persist session for the app to read
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(userData));

        // Determine role priority: JWT -> userData.role -> admin email env
        const decoded = decodeJWT(token);
        let userRole = 'user';
        if (decoded?.role) {
          userRole = decoded.role;
        } else if (userData.role) {
          userRole = userData.role;
        } else if (isAdminEmail(userData.email)) {
          userRole = 'admin';
        }

        console.log("Determined role:", userRole);

        // Navigate (SPA-friendly)
        if (userRole === 'admin') {
          navigate("/admin/dashboard", { replace: true });
        } else {
          navigate("/dashboard", { replace: true });
        }
      } catch (err) {
        console.error("Error parsing OAuth response in AuthCallback:", err);
        alert("Authentication failed. Please try again.");
        navigate("/", { replace: true });
      }
    } else {
      console.warn("Missing token or user in OAuth callback");
      navigate("/", { replace: true });
    }
  }, [location, navigate]);

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        fontSize: "18px",
      }}
    >
      Processing authentication...
    </div>
  );
}

// Protected Route Component
function ProtectedRoute({ children, requireAdmin = false }) {
  const token = localStorage.getItem('token');
  const userRole = getUserRole();

  if (!token) {
    console.log("ProtectedRoute: no token -> redirect /");
    return <Navigate to="/" replace />;
  }

  if (requireAdmin && userRole !== 'admin') {
    console.log("ProtectedRoute: requireAdmin but not admin -> redirect /dashboard");
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

// Main App Content Component
function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);

  const handleOpenAuth = () => {
    console.log("Opening auth modal");
    setAuthOpen(true);
  };

  const handleCloseAuth = () => {
    console.log("Closing auth modal");
    setAuthOpen(false);
  };

  // when app-level login is triggered (email/password + social if AuthModal used)
  const handleLogin = (userData) => {
    console.log("handleLogin called with:", userData);

    try {
      // AuthModal already stores token in localStorage for email flow,
      // but ensure user is stored and role logic is consistent
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
      setAuthOpen(false);

      // Determine role with the same priority as AuthCallback:
      // 1) token.role 2) userData.role 3) admin email env
      const token = localStorage.getItem('token');
      const decoded = token ? decodeJWT(token) : null;
      let userRole = 'user';
      if (decoded?.role) {
        userRole = decoded.role;
      } else if (userData.role) {
        userRole = userData.role;
      } else if (isAdminEmail(userData.email)) {
        userRole = 'admin';
      }

      console.log("handleLogin determined role:", userRole);

      if (userRole === 'admin') {
        navigate("/admin/dashboard", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch (e) {
      console.error("Error in handleLogin:", e);
    }
  };

  const handleLogout = () => {
    console.log("Logging out user");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("startupProfile");
    setUser(null);
    navigate("/");
  };

  // Check for existing session on mount
  useEffect(() => {
    console.log("AppContent mount: checking saved session");

    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (savedToken && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        console.log("Found saved session for:", parsedUser.email);
        setUser(parsedUser);
      } catch (error) {
        console.error("Error parsing saved user:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    } else {
      console.log("No existing session");
    }

    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          fontSize: "18px",
        }}
      >
        Loading...
      </div>
    );
  }

  return (
    <>
      <AuthModal
        isOpen={authOpen}
        onClose={handleCloseAuth}
        onLogin={handleLogin}
      />

      <Routes>
        {/* Accept both common callback routes from various backends */}
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/auth/google/callback" element={<AuthCallback />} />

        {/* Public routes */}
        <Route
          path="/"
          element={
            <Homepage
              onLogin={handleLogin}
              user={user}
              onLogout={handleLogout}
              onOpenAuth={handleOpenAuth}
            />
          }
        />
        <Route
          path="/home"
          element={
            <Homepage
              onLogin={handleLogin}
              user={user}
              onLogout={handleLogout}
              onOpenAuth={handleOpenAuth}
            />
          }
        />

        {/* User Dashboard - protected route */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <UserDashboard
                user={user}
                onLogout={handleLogout}
                onOpenAuth={handleOpenAuth}
              />
            </ProtectedRoute>
          }
        />

        {/* Admin Dashboard - protected route (admin only) */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute requireAdmin={true}>
              <AdminDashboard
                user={user}
                onLogout={handleLogout}
              />
            </ProtectedRoute>
          }
        />

        {/* Other public routes */}
        <Route
          path="/features"
          element={
            <Features
              onLogin={handleLogin}
              user={user}
              onLogout={handleLogout}
              onOpenAuth={handleOpenAuth}
            />
          }
        />
        <Route
          path="/about"
          element={
            <About
              onLogin={handleLogin}
              user={user}
              onLogout={handleLogout}
              onOpenAuth={handleOpenAuth}
            />
          }
        />
        <Route
          path="/contact"
          element={
            <Contact
              onLogin={handleLogin}
              user={user}
              onLogout={handleLogout}
              onOpenAuth={handleOpenAuth}
            />
          }
        />
        <Route
          path="/services"
          element={
            <Services
              onLogin={handleLogin}
              user={user}
              onLogout={handleLogout}
              onOpenAuth={handleOpenAuth}
            />
          }
        />
        <Route
          path="/career"
          element={
            <Career
              onLogin={handleLogin}
              user={user}
              onLogout={handleLogout}
              onOpenAuth={handleOpenAuth}
            />
          }
        />
        <Route
          path="/career-form"
          element={
            <CareerForm
              onLogin={handleLogin}
              user={user}
              onLogout={handleLogout}
              onOpenAuth={handleOpenAuth}
            />
          }
        />

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
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
