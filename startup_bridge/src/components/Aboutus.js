import React, { useState, useEffect } from 'react';
import { ChevronRight, Menu, X, User, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './css/about.css';
import AuthModal from './AuthModal';
import img2 from './img/logo.jpeg';

const About = ({ onLogin, user, onLogout }) => {
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
    <div className="about-page">
      {/* Navigation */}
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-container">
          <div className="nav-content">
            <div className="logo">
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
                  className="cta-button mobile-user"
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

      {/* About Us Section */}
      <section id="about" className="about-preview">
        <div className="container">
          <h2 className="section-title">About Us</h2>
          <p className="about-text">
          At Startup wing, we believe that every great idea deserves the right launchpad. Too many founders waste time, money, and energy on trial-and-error. That's why we built a guided platform that takes the guesswork out of building a startup.

          We help early-stage entrepreneurs validate ideas, research markets, register legally, build online presence, design marketing strategies, and connect with grants, mentors, and investors—all in one place.

          Our mission is simple: make starting up smarter, faster, and more affordable. With Startup Bridge, you don't just launch a business—you launch with confidence.

          </p>
          
          {/* Extended About Content */}
          <div className="about-extended">
            <h3 className="subsection-title">Our Story</h3>
            <p className="about-description">
            Founded by entrepreneurs who've been through the startup journey themselves, Startup wing was born from frustration with the scattered, confusing advice available to first-time founders.
             We've distilled years of experience, countless mistakes, and hard-won insights into a clear, actionable platform.

            </p>
            
            <h3 className="subsection-title">Why We Exist</h3>
            <p className="about-description">
             Step-by-step guidance from idea to launch

              Access to resources, mentors, and funding opportunities

              Smart tools to validate and grow your startup

              A supportive ecosystem that saves time and reduces risk

              Whether you're at the idea stage or preparing to scale, Startup wing is your trusted partner on the journey from vision to reality.

            </p>
            
            <h3 className="subsection-title">Our Vision</h3>
            <p className="about-description">
            To become the most trusted launchpad for early-stage entrepreneurs—empowering them to transform ideas into successful, scalable businesses through guidance, resources, and connections.

            We envision a world where every founder, regardless of background, has equal access to knowledge, mentorship, and opportunities to build startups that create impact and drive innovation.

            </p>
          </div>
            <h3 className="subsection-title">Our Mision</h3>
            <p className="about-description">
              At Startup wing, we empower founders to launch smarter, faster, and more affordably.
              By providing step-by-step guidance, resources, and connections, we help entrepreneurs transform ideas into successful businesses with confidence.
              </p>

          
          <button className="link-button">
            Connect with our founding team
            <ChevronRight className="chevron-icon" size={16} />
          </button>
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
                    <span className="logo-text" style={{ color: '#ffffff' }}>Startup Wing</span>
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
                  <p className="footer-tagline" style={{ color: '#ffffff' }}>Startup Wing – Skip the Guesswork, Build Smarter.</p>
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

export default About;