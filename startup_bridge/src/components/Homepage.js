import React, { useState, useEffect, useRef } from 'react';
import { Star, Menu, X, ArrowRight, Target, Users, Lightbulb, TrendingUp, User, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import img1 from './img/start-up-business-goals-strategy.jpg';
import img2 from './img/logo.jpeg';
import AuthModal from './AuthModal';

const clients = [
  {
    id: 1,
    name: "GrowUp",
    logo: "https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg",
  },
  {
    id: 2,
    name: "SwamiKaLife",
    logo: "https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg",
  },
  {
    id: 3,
    name: "TechStart",
    logo: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg",
  },
  {
    id: 4,
    name: "InnovateCorp",
    logo: "https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg",
  },
  {
    id: 5,
    name: "FutureBiz",
    logo: "https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg",
  },
  {
    id: 6,
    name: "NextGen",
    logo: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg",
  },
];

const Clients = () => {
  const [clientsVisible, setClientsVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const clientsRef = useRef(null);
  const intervalRef = useRef(null);

  const cardsPerView = 3;
  const totalSlides = Math.ceil(clients.length / cardsPerView);
  const maxIndex = totalSlides - 1;

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setClientsVisible(true);
          }
        });
      },
      {
        threshold: 0.2,
        rootMargin: '0px 0px -50px 0px'
      }
    );

    if (clientsRef.current) {
      observer.observe(clientsRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Auto-rotate carousel every 3 seconds
  useEffect(() => {
    if (clientsVisible && !isPaused && totalSlides > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % totalSlides);
      }, 3000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [clientsVisible, isPaused, totalSlides]);

  const handleMouseEnter = () => {
    setIsPaused(true);
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
  };

  const handleDotClick = (index) => {
    setCurrentIndex(index);
  };

  const handlePrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : maxIndex));
  };

  const handleNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex < maxIndex ? prevIndex + 1 : 0));
  };

  // Group clients into slides of 3
  const clientSlides = [];
  for (let i = 0; i < clients.length; i += cardsPerView) {
    clientSlides.push(clients.slice(i, i + cardsPerView));
  }

  return (
    <section ref={clientsRef} className="clients" aria-labelledby="clients-title">
      <div className="container">
        <h2 id="clients-title" className="section-title">
          Our Happy Clients
        </h2>
        <p className="section-subtitle">Trusted by leading startups & companies worldwide</p>
        
        <div className="clients-carousel-wrapper">
          <div 
            className="clients-carousel"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {totalSlides > 1 && (
              <button 
                className="carousel-nav prev-btn"
                onClick={handlePrevious}
                aria-label="Previous clients"
              >
                ‹
              </button>
            )}
            
            <div className="carousel-container">
              <div 
                className="carousel-track" 
                style={{ 
                  transform: `translateX(-${currentIndex * 100}%)`,
                  width: `${totalSlides * 100}%`
                }}
              >
                {clientSlides.map((slide, slideIndex) => (
                  <div key={slideIndex} className="carousel-slide">
                    <div className="clients-grid">
                      {slide.map((client) => (
                        <div key={client.id} className="client-card-wrapper">
                          <div className="client-card">
                            <div className="client-logo-wrapper">
                              <img
                                src={client.logo}
                                alt={`${client.name} logo`}
                                className="client-logo"
                                loading="lazy"
                              />
                            </div>
                            <p className="client-name">{client.name}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {totalSlides > 1 && (
              <button 
                className="carousel-nav next-btn"
                onClick={handleNext}
                aria-label="Next clients"
              >
                ›
              </button>
            )}
          </div>
          
          {/* Carousel Indicators */}
          {totalSlides > 1 && (
            <div className="carousel-indicators">
              {clientSlides.map((_, index) => (
                <button
                  key={index}
                  className={`indicator ${index === currentIndex ? 'active' : ''}`}
                  onClick={() => handleDotClick(index)}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

const Homepage = ({ onLogin, user, onLogout }) => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [problemSolutionVisible, setProblemSolutionVisible] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState(user || null);
  
  const problemSolutionRef = useRef(null);

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

  // Intersection Observer for problem-solution section
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setProblemSolutionVisible(entry.isIntersecting);
        });
      },
      {
        threshold: 0.3,
        rootMargin: '0px 0px -50px 0px'
      }
    );

    if (problemSolutionRef.current) {
      observer.observe(problemSolutionRef.current);
    }

    return () => observer.disconnect();
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
    <div className="homepage">
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

      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <div className="hero-text">
              <h1 className="hero-title">
                Skip the <span className="gradient-text">Guesswork.</span>
                <br />
                Build Your Startup <span className="gradient-text">Smarter.</span>
              </h1>
              <p className="hero-subtitle">
                The guided platform that helps founders validate ideas, research markets, and launch with confidence.
              </p>
              {loggedInUser ? (
                <button className="hero-cta" onClick={handleDashboardClick}>
                  Go to Dashboard
                  <ArrowRight className="arrow-icon" size={20} />
                </button>
              ) : (
                <button className="hero-cta" onClick={() => setIsAuthOpen(true)}>
                  Start Validating Your Idea
                  <ArrowRight className="arrow-icon" size={20} />
                </button>
              )}
            </div>
            
            <div className="hero-visual">
              <div className="hero-image-container">
                <div className="hero-image-card">
                  <img 
                    src={img1}
                    alt="Professional startup team collaboration"
                    className="hero-image"
                  />
                  
                  {/* Floating Metric Cards */}
                  <div className="floating-element element-1">
                    <div className="metric-card">
                      <TrendingUp className="metric-icon" size={24} />
                      <div className="metric-info">
                        <span className="metric-number">95%</span>
                        <span className="metric-label">Success Rate</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="floating-element element-2">
                    <div className="metric-card">
                      <Users className="metric-icon" size={24} />
                      <div className="metric-info">
                        <span className="metric-number">500+</span>
                        <span className="metric-label">Startups Launched</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem → Solution */}
      <section 
        ref={problemSolutionRef}
        className="problem-solution"
      >
        <div className="container">
          <div className="problem-solution-grid">
            <div className={`problem-card ${problemSolutionVisible ? 'scroll-animate-in' : ''}`}>
              <h3 className="card-title problem-title">
                <Target className="card-icon" size={28} />
                Founder Pain Points
              </h3>
              <div className="pain-points">
                <div className="pain-point">
                  <div className="bullet"></div>
                  <span>"Is my idea really solving a problem?"</span>
                </div>
                <div className="pain-point">
                  <div className="bullet"></div>
                  <span>"Where do I even start my journey?"</span>
                </div>
                <div className="pain-point">
                  <div className="bullet"></div>
                  <span>"How do I avoid legal & costly mistakes?"</span>
                </div>
                <div className="pain-point">
                  <div className="bullet"></div>
                  <span>"How can I raise my first round of funding or grants?"</span>
                </div>
                <div className="pain-point">
                  <div className="bullet"></div>
                  <span>"How do I build an MVP without burning all my savings?"</span>
                </div>
              </div>
            </div>

            <div className={`solution-card ${problemSolutionVisible ? 'scroll-animate-in' : ''}`}>
              <h3 className="card-title solution-title">
                <Lightbulb className="card-icon" size={28} />
                Our Solution
              </h3>
              <p className="solution-text">
               At Startup Wings, we simplify the messy early-stage journey. From idea validation to launch roadmap — we give you tools, templates, mentors, and step-by-step guidance.
              We make starting up smarter, faster, and more affordable by cutting out trial-and-error.
              With Startup Bridge, you don't just launch a startup—you launch with confidence. <span className="highlight">tools, templates, mentors, and step-by-step guidance.</span>

              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">How It Works</h2>
            <p className="section-subtitle">3 Simple Steps to Success</p>
          </div>

          <div className="steps-grid">
            <div className="step">
              <div className="step-number step-1">1</div>
              <h3 className="step-title">Validate Your Idea</h3>
              <p className="step-description">Use our checklist & toolkit to prove your idea solves a real problem.</p>
            </div>

            <div className="step">
              <div className="step-number step-2">2</div>
              <h3 className="step-title">Research & Plan</h3>
              <p className="step-description">Map your market, study competitors, and find your edge.</p>
            </div>

            <div className="step">
              <div className="step-number step-3">3</div>
              <h3 className="step-title">Launch with Confidence</h3>
              <p className="step-description">Follow our roadmap, connect to mentors, and access grants.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="social-proof">
        <div className="container">
          <h2 className="section-title">Built for Early-Stage Founders Across India</h2>
          
          <div className="testimonials">
            <div className="testimonial">
              <div className="stars">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="star filled" size={20} />
                ))}
              </div>
              <p className="testimonial-text">"Startup Wings saved me months of confusion. The validation toolkit is incredible!"</p>
              <div className="testimonial-author">- Priya S., Mumbai</div>
            </div>

            <div className="testimonial">
              <div className="stars">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="star filled" size={20} />
                ))}
              </div>
              <p className="testimonial-text">"Finally, a clear roadmap from idea to launch. Game changer for first-time founders."</p>
              <div className="testimonial-author">- Raj K., Bangalore</div>
            </div>

            <div className="testimonial">
              <div className="stars">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="star filled" size={20} />
                ))}
              </div>
              <p className="testimonial-text">"The mentor access and community support are worth their weight in gold."</p>
              <div className="testimonial-author">- Anita M., Delhi</div>
            </div>
          </div>
        </div>
      </section>

      {/* Clients Section */}
      <Clients />

      {/* Footer */}
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

export default Homepage;