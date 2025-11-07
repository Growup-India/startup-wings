import React, { useState, useEffect, useRef } from 'react';
import { Star, ArrowRight, Target, Users, Lightbulb, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import img1 from './img/start-up-business-goals-strategy.jpg';
import img2 from './img/GrowupLogo1.jpeg.jpg';
import img3 from './img/Swamika.jpg';
import img4 from './img/clients1.jpg';
import img5 from './img/aceInfra.jpg';
import img6 from './img/clients2.jpg';
import img7 from './img/mg.jpg';

import AuthModal from './AuthModal';
import Navbar from './Navbar';
import Footer from './Footer';

const clients = [
  {
    id: 1,
    name: "GrowUp",
    logo: img2,
  },
  {
    id: 2,
    name: "SwamiKaLife",
    logo: img3,
  },
  {
    id: 3,
    name: "Infinity Vision Overseas",
    logo: img4,
  },
  {
    id: 4,
    name: "Ace Infra",
    logo: img5,
  },
  {
    id: 5,
    name: "MG",
    logo: img7,
  },
  {
    id: 6,
    name: "Shree Swami Samarth",
    logo: img6,
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
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('startupProfile');
    setLoggedInUser(null);
    if (onLogout) {
      onLogout();
    }
  };

  return (
    <div className="homepage">
      {/* Navigation */}
      <Navbar 
        loggedInUser={loggedInUser}
        onLogout={handleLogout}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <div className="hero-text">
              <h1 className="hero-title">
                Turn Your <span className="gradient-text">Idea</span>
                <br />
                into <span className="gradient-text">a Successful Startup.</span>
              </h1>
              <p className="hero-subtitle">
                The guided platform that helps founders validate ideas, research markets, and launch with confidence — so you can build faster and avoid costly mistakes.
              </p>
              {loggedInUser ? (
                <button className="hero-cta" onClick={handleDashboardClick}>
                  Get Started
                  <ArrowRight className="arrow-icon" size={20} />
                </button>
              ) : (
                <button className="hero-cta" onClick={() => setIsAuthOpen(true)}>
                  Get Started
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
                  <span><b>Starting up shouldn't feel like guessing.</b><br/>
                   But most founders struggle with the same roadblocks
                  </span>
                </div>
                <div className="pain-point">
                  <div className="bullet"></div>
                  <span><b> Wasted Time & Effort.</b><br/>
                   Spending months figuring out what to do next — with no clear direction.</span>
                </div>
                <div className="pain-point">
                  <div className="bullet"></div>
                  <span><b>Limited Budget & Wrong Hires.</b><br/>
                  Losing money on unverified developers, designers, and marketing agencies.</span>
                </div>
                <div className="pain-point">
                  <div className="bullet"></div>
                  <span><b>No Clear Guidance.</b><br/>
                  Uncertain how to validate ideas, build MVPs, or reach early customers.</span>
                </div>
                <div className="pain-point">
                  <div className="bullet"></div>
                  <span><b>Funding Frustration.</b><br/>
                   No roadmap for grants, investor connects, or pitch readiness.</span>
                </div>
              </div>
            </div>

            <div className={`solution-card ${problemSolutionVisible ? 'scroll-animate-in' : ''}`}>
              <h3 className="card-title solution-title">
                <Lightbulb className="card-icon" size={28} />
                Our Solution
              </h3>
              <div className="pain-points">
                <div className="pain-point">
                  <div className="bullet"></div>
                  <span><b>Startup Wings simplifies your startup journey — helping founders save time, save money, and build smarter.</b><br/>
                  No more guesswork — just clear steps, expert help, and growth-focused tools.
                  </span>
                </div>
                <div className="pain-point">
                  <div className="bullet"></div>
                  <span><b>Save Time</b><br/>
                  Structured roadmap and guided workflows show what to do next — cutting months of trial and error.</span>
                </div>
                <div className="pain-point">
                  <div className="bullet"></div>
                  <span><b>Save Money</b><br/>
                   Access verified experts, templates, and affordable tools — avoiding costly mistakes.</span>
                </div>
                <div className="pain-point">
                  <div className="bullet"></div>
                  <span><b>Build Smarter.</b><br/>
                  Validate ideas, research markets, and prepare investor-ready plans with expert-backed frameworks.</span>
                </div>
                <div className="pain-point">
                  <div className="bullet"></div>
                  <span><b> Get Funding-Ready</b><br/>
                   Create powerful pitch decks, apply for grants, and connect with investors or government programs.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">How It Works</h2>
            <p className="section-subtitle">Your Startup Journey in 3 Guided Steps</p>
          </div>

          <div className="steps-grid">
            <div className="step">
              <div className="step-number step-1">1</div>
              <h3 className="step-title">Validate Your Idea</h3>
              <p className="step-description">Turn your concept into a solid startup idea using our guided validation tools.</p>
            </div>

            <div className="step">
              <div className="step-number step-2">2</div>
              <h3 className="step-title">Research & Plan</h3>
              <p className="step-description">Discover your market, analyze competitors, and build a winning strategy.</p>
            </div>

            <div className="step">
              <div className="step-number step-3">3</div>
              <h3 className="step-title">Launch with Confidence</h3>
              <p className="step-description"> Follow your step-by-step roadmap, connect with mentors, and unlock startup grants.</p>
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
              <p className="testimonial-text">"Startup Wing saved me months of confusion. The validation toolkit is incredible!"</p>
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

export default Homepage;