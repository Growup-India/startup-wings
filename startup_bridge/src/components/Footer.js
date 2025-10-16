import React from 'react';
import img2 from './img/logo.jpeg';

const Footer = () => {
  return (
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
          <p className="footer-tagline" style={{ color: '#ffffff' }}>
            Startup Wing – Skip the Guesswork, Build Smarter.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;