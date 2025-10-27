import React, { useState, useEffect } from 'react';
import { Menu, X, User, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import img2 from './img/logo.png';

const Navbar = ({ loggedInUser, onLogout, onOpenAuth }) => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogoClick = () => {
    navigate('/');
    setIsMenuOpen(false);
  };

  const handleDashboardClick = () => {
    navigate('/dashboard');
    setIsMenuOpen(false);
  };

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      if (onLogout) {
        onLogout();
      }
    }
  };

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="nav-container">
        <div className="nav-content">
          <div className="logo" onClick={handleLogoClick} style={{ cursor: 'pointer' }}>
            <div className="logo-icon">
              <img
                src={img2}
                alt="Startup Bridge Logo"
                className="navbar-logo"
              />
            </div>
            <span className="logo-text">Startup Wing</span>
          </div>
          
          <div className="nav-links desktop-nav">
            <a href="/">Home</a>
            <a href="/features">Features</a>
            <a href="/about">About</a>
            <a href="/Services">Services</a>
            {loggedInUser ? (
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <button 
                  className="cta-button" 
                  onClick={handleDashboardClick} 
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px' }}
                >
                  <User className="icon" size={18} />
                </button>
                <button 
                  className="cta-button" 
                  onClick={handleLogout} 
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px', background: '#ef4444' }}
                >
                  <LogOut className="icon" size={18} />
                </button>
              </div>
            ) : (
              <button className="cta-button" onClick={onOpenAuth}>
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
                  onClick={handleDashboardClick}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%' }}
                >
                  <User className="icon" size={18} />
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
                </button>
              </div>
            ) : (
              <button 
                className="cta-button mobile-user"
                onClick={() => {
                  onOpenAuth();
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
  );
};

export default Navbar;