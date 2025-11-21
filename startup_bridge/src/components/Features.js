import React, { useState, useEffect } from 'react';
import { CheckCircle, Users, Target, TrendingUp, Shield, Zap } from 'lucide-react';
import './css/features.css';
import AuthModal from './AuthModal';
import Navbar from './Navbar';
import Footer from './Footer';

const Features = ({ onLogin, user, onLogout, onOpenAuth }) => {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState(user || null);

  // Check for logged in user on component mount
  useEffect(() => {
    if (!user) {
      const savedUser = localStorage.getItem("user");
      if (savedUser) {
        try {
          setLoggedInUser(JSON.parse(savedUser));
        } catch (error) {
          console.error("Error parsing saved user:", error);
        }
      }
    } else {
      setLoggedInUser(user);
    }
  }, [user]);

  const features = [
    {
      icon: CheckCircle,
      title: 'Idea Validation Checklist',
      subtitle: 'Turn your idea into proof — not a gamble.',
      description:
        'Every founder starts with an idea, but not every idea finds a market. Our guided validation checklist helps you discover whether your concept solves a real problem, identify your first users, and shape a strong foundation before investing time or money. Start right — build what people actually need.',
      gradient: 'linear-gradient(135deg, #2563eb, #0891b2)',
    },
    {
      icon: Target,
      title: 'Market Research Toolkit',
      subtitle: 'Understand your market before you enter it.',
      description:
        'With ready-to-use templates and research frameworks, you can size your opportunity, map competitors, and uncover insights that drive smart positioning. Because guessing the market is risky — but knowing it is power.',
      gradient: 'linear-gradient(135deg, #7c3aed, #2563eb)',
    },
    {
      icon: TrendingUp,
      title: 'Step-by-Step Roadmap',
      subtitle: "No more 'What's next?' confusion.",
      description:
        'We guide you through every stage — from registration and MVP creation to launch and investor outreach. Each step is clear, actionable, and designed to keep you moving forward. Build your startup with direction, not doubt.',
      gradient: 'linear-gradient(135deg, #10b981, #059669)',
    },
    {
      icon: Shield,
      title: 'Mentor & Grant Access',
      subtitle: "You don't have to figure it all out alone.",
      description:
        'Access experienced mentors who built and scaled startups — plus verified government grants and funding programs. Get real advice, real feedback, and real opportunities that push your idea forward. Because the right guidance saves years of struggle.',
      gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
    },
    {
      icon: Users,
      title: 'Community Support',
      subtitle: 'Grow with people who get it.',
      description:
        'Surround yourself with founders walking the same path. Learn, share, and get honest feedback in a trusted space that keeps you motivated and accountable. Your community is your competitive advantage.',
      gradient: 'linear-gradient(135deg, #ec4899, #db2777)',
    },
    {
      icon: Zap,
      title: 'Fast-Track Success',
      subtitle: 'Why take the long route when you can fly?',
      description:
        'We turned the chaos of startup building into a clear path — saving you months of trial and error. With Startup Wings, you focus only on what moves your business forward. Smarter steps. Faster growth. Stronger results.',
      gradient: 'linear-gradient(135deg, #06b6d4, #0891b2)',
    },
  ];

  const handleOpenAuthModal = () => {
    if (onOpenAuth) {
      onOpenAuth();
    } else {
      setIsAuthOpen(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("startupProfile");
    setLoggedInUser(null);
    if (onLogout) {
      onLogout();
    }
  };

  return (
    <div className="features-page">
      {/* Navigation */}
      <Navbar 
        user={loggedInUser} 
        onLogout={handleLogout} 
        onOpenAuth={handleOpenAuthModal}
      />

      {/* Features Section */}
      <div className="features">
        <div className="container">
          <div className="section-header">
            <h1 className="section-title">Everything You Need to Build Smarter, Launch Faster</h1>
            <p className="section-subtitle">
              Startup Wings gives you the right tools, guidance, and community to turn your idea
              into a successful startup — without wasting time or money. From validation to launch,
              we help founders skip the guesswork and focus on what really drives growth.
            </p>
          </div>

          {/* Features Grid */}
          <div className="features-grid">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="feature-card">
                  {/* Main Card Content */}
                  <div className="feature-card-main">
                    <div className="feature-icon" style={{ background: feature.gradient }}>
                      <Icon size={32} />
                    </div>

                    <h3 className="feature-title">{feature.title}</h3>

                    <p className="feature-description">{feature.subtitle}</p>
                  </div>

                  {/* Slide-Up Overlay */}
                  <div className="feature-card-overlay" style={{ background: feature.gradient }}>
                    <div className="feature-overlay-content">
                      <h3 className="feature-overlay-title">{feature.title}</h3>
                      <p className="feature-overlay-description">{feature.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

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