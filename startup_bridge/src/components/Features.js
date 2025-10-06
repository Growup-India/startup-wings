import React, { useState, useEffect } from 'react';
import { CheckCircle, Users, Target, TrendingUp, Shield, Zap, Menu, X, User, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './css/features.css'
import AuthModal from './AuthModal';
import img2 from './img/logo.jpeg';

const Features = ({ onLogin, user, onLogout }) => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
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

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleDashboardClick = () => {
    navigate('/dashboard');
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('startupProfile');
      setLoggedInUser(null);
      if (onLogout) {
        onLogout();
      }
    }
  };

  return (
    <div className="features-page">
      {/* Navigation */}
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-container">
          <div className="nav-content">
            <div className="logo">
              <div className="logo-icon">
                <img 
                  src={img2} 
                  alt="Company Logo" 
                  className="navbar-logo"
                />
              </div>
              <span className="logo-text">Startup Wings</span>
            </div>
            
            <div className="nav-links desktop-nav">
              <a href="/">Home</a>
              <a href="/features">Features</a>
              <a href="/about">About</a>
              <a href="/Services">Services</a>
              {loggedInUser ? (
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <button className="cta-button" onClick={handleDashboardClick} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px' }}>
                    <User className="icon" size={18} />
                    <span>Dashboard</span>
                  </button>
                  <button className="cta-button" onClick={handleLogout} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px', background: '#ef4444' }}>
                    <LogOut className="icon" size={18} />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <button className="cta-button" onClick={() => setIsAuthOpen(true)}>
                  <User className="icon" />
                </button>
              )}
            </div>

            <button 
              className="mobile-menu-btn"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="mobile-menu">
            <div className="mobile-menu-content">
              <a href="/" onClick={() => setIsMenuOpen(false)}>Home</a>
              <a href="/features" onClick={() => setIsMenuOpen(false)}>Features</a>
              <a href="/about" onClick={() => setIsMenuOpen(false)}>About</a>
              <a href="/Services" onClick={() => setIsMenuOpen(false)}>Services</a>
              {loggedInUser ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                  <button 
                    className="cta-button mobile-user"
                    onClick={() => {
                      handleDashboardClick();
                      setIsMenuOpen(false);
                    }}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%' }}
                  >
                    <User className="icon" size={18} />
                    <span>Dashboard</span>
                  </button>
                  <button 
                    className="cta-button mobile-user"
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', background: '#ef4444' }}
                  >
                    <LogOut className="icon" size={18} />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <button 
                  className="cta-button mobile-cta"
                  onClick={() => {
                    setIsAuthOpen(true);
                    setIsMenuOpen(false);
                  }}
                >
                  <User className="icon" />
                </button>
              )}
            </div>
          </div>
        )}
      </nav>

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

      <footer className="footer">
              <div className="container">
                <div className="footer-content">
                  <div className="footer-logo">
                    <div className="logo-icon">
                      <img
                        src={img2}
                        alt="Startup Wings Logo"
                        className="navbar-logo"
                        style={{ width: '40px', height: '40px', objectFit: 'contain' }}
                      />
                    </div>
                    <span className="logo-text" style={{ color: '#ffffff' }}>Startup Wings</span>
                  </div>
                  
                  <div className="footer-links">
                    <a href="/about" style={{ color: '#ffffff' }}>About</a>
                    <a href="/features" style={{ color: '#ffffff' }}>Features</a>
                    <a href="#blog" style={{ color: '#ffffff' }}>Blog</a>
                    <a href="#contact" style={{ color: '#ffffff' }}>Contact</a>
                  </div>
                  
                  <div className="social-icons">
                    <div className="social-icon">in</div>
                    <div className="social-icon">YT</div>
                    <div className="social-icon">X</div>
                  </div>
                </div>
                
                <div className="footer-bottom">
                  <p className="footer-tagline" style={{ color: '#ffffff' }}>Startup Wings – Skip the Guesswork, Build Smarter.</p>
                </div>
              </div>
            </footer>
            
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