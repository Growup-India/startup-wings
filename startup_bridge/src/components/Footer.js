import React from 'react';
import img2 from './img/logo.png';

const Footer = () => {
  const socialLinks = [
    {
      id: 1,
      label: 'LinkedIn',
      icon: 'in',
      url: 'https://www.linkedin.com/company/grow-up-india/posts/?feedView=all',
      target: '_blank'
    },
    {
      id: 2,
      label: 'Instagram',
      icon: 'IG',
      url: 'https://www.instagram.com/startup.wings/',
      target: '_blank'
    },
    {
      id: 3,
      label: 'Facebook',
      icon: 'f',
      url: 'https://www.facebook.com/startupwings/',
      target: '_blank'
    }
  ];

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
            <a href="/contact" style={{ color: '#ffffff' }}>Contact</a>
          </div>
          
          <div className="social-icons">
            {socialLinks.map((social) => (
              <a
                key={social.id}
                href={social.url}
                target={social.target}
                rel="noopener noreferrer"
                className="social-icon"
                title={social.label}
                style={{ textDecoration: 'none', cursor: 'pointer' }}
              >
                {social.icon}
              </a>
            ))}
          </div>
        </div>
        
        <div className="footer-bottom">
          <p className="footer-tagline" style={{ color: '#ffffff' }}>
             Built with Love to help founders build smarter startups.
          </p>
          <p style={{ 
            color: '#9ca3af', 
            fontSize: '0.875rem', 
            marginTop: '1rem',
            transition: 'all 0.3s ease'
          }}>
            © {new Date().getFullYear()} Startup Wing. All rights reserved.
          </p>
          <p style={{ 
            color: '#9ca3af', 
            fontSize: '0.875rem', 
            marginTop: '0.5rem'
          }}>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;