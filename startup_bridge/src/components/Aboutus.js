import React, { useState, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';
import './css/about.css';
import AuthModal from './AuthModal';
import Navbar from './Navbar';
import Footer from './Footer';

const About = ({ onLogin, user, onLogout }) => {
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
    <div className="about-page">
      {/* Navigation */}
      <Navbar 
        loggedInUser={loggedInUser}
        onLogout={handleLogout}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

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
          
          <h3 className="subsection-title">Our Mission</h3>
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

export default About;