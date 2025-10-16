import React, { useState, useEffect } from 'react';
import { CheckCircle, Users, Target, TrendingUp, Shield, Zap } from 'lucide-react';
import './css/features.css';
import AuthModal from './AuthModal';
import Navbar from './Navbar';
import Footer from './Footer';

const Features = ({ onLogin, user, onLogout }) => {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState(user || null);

  // Check for logged in user on component mount
  useEffect(() => {
    if (!user) {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        try {
          setLoggedInUser(JSON.parse(savedUser));
        } catch (error) {
          console.error('Error parsing saved user:', error);
        }
      }
    } else {
      setLoggedInUser(user);
    }
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('startupProfile');
    setLoggedInUser(null);
    if (onLogout) {
      onLogout();
    }
  };

  return (
    <div className="features-page">
      {/* Navigation */}
      <Navbar 
        loggedInUser={loggedInUser}
        onLogout={handleLogout}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Features Section */}
      <section id="features" className="features">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">What You Get</h2>
            <p className="section-subtitle">Everything you need to build smarter</p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <CheckCircle className="feature-icon" size={32} />
              <h3 className="feature-title">Idea Validation Checklist</h3>
              <p className="feature-description">Test your concept the smart way.</p>
            </div>

            <div className="feature-card">
              <Target className="feature-icon" size={32} />
              <h3 className="feature-title">Market Research Toolkit</h3>
              <p className="feature-description">Templates to size your market & study competitors.</p>
            </div>

            <div className="feature-card">
              <TrendingUp className="feature-icon" size={32} />
              <h3 className="feature-title">Step-by-Step Roadmap</h3>
              <p className="feature-description">Never ask "what's next?" again.</p>
            </div>

            <div className="feature-card">
              <Users className="feature-icon" size={32} />
              <h3 className="feature-title">Mentor & Grant Access</h3>
              <p className="feature-description">Real people, real opportunities.</p>
            </div>

            <div className="feature-card">
              <Shield className="feature-icon" size={32} />
              <h3 className="feature-title">Community Support</h3>
              <p className="feature-description">Learn, share, and grow with fellow founders.</p>
            </div>

            <div className="feature-card">
              <Zap className="feature-icon" size={32} />
              <h3 className="feature-title">Fast-Track Success</h3>
              <p className="feature-description">Skip months of trial and error.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
            
      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)} 
        onLogin={onLogin}
      />
    </div>
  );
};

export default Features;