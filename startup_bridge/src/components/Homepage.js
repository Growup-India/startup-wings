// ALL IMPORTS AT THE TOP
import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Target,
  Lightbulb,
  TrendingUp,
  Users,
  ArrowRight,
  X,
  Star,
  DollarSign,
  BookOpen,
  TrendingUp as Growth,
} from "lucide-react";
import "../App.css";
import img1 from "./img/start-up-business-goals-strategy.jpg";
import AuthModal from "./AuthModal";
import EnhancedClientsCarousel from './clients';
import Navbar from "./Navbar";
import Footer from "./Footer";

// Main Homepage Component
const Homepage = ({ onLogin, user, onLogout }) => {
  const navigate = useNavigate();
  const [problemSolutionVisible, setProblemSolutionVisible] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [loggedInUser, setLoggedInUser] = useState(user || null);
  const [showPainPointsModal, setShowPainPointsModal] = useState(false);
  const [showSolutionModal, setShowSolutionModal] = useState(false);

  const problemSolutionRef = useRef(null);

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
        rootMargin: "0px 0px -50px 0px",
      }
    );

    if (problemSolutionRef.current) {
      observer.observe(problemSolutionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleDashboardClick = () => {
    navigate("/dashboard");
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
                into{" "}
                <span className="gradient-text">a Successful Startup</span>
              </h1>
              <p className="hero-subtitle">
                The guided platform that helps founders validate ideas, research
                markets, and launch with confidence — so you can build faster
                and avoid costly mistakes.
              </p>
              {loggedInUser ? (
                <button className="hero-cta" onClick={handleDashboardClick}>
                  Get Started
                  <ArrowRight className="arrow-icon" size={20} />
                </button>
              ) : (
                <button
                  className="hero-cta"
                  onClick={() => setIsAuthOpen(true)}
                >
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

      {/* Success Story Section - NEW */}
      <section className="success-story">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">How We Build Your Success Story</h2>
            <p className="section-subtitle">
              From concept to company, we provide everything founders need to launch, grow, and scale.
            </p>
          </div>

          <div className="success-features-grid">
            <div className="success-feature-card">
              <div className="feature-icon-wrapper mentorship-icon">
                <BookOpen size={32} />
              </div>
              <h3 className="feature-title">Mentorship</h3>
              <p className="feature-description">
                Learn directly from experienced startup experts who guide you at every stage of growth
              </p>
            </div>

            <div className="success-feature-card">
              <div className="feature-icon-wrapper resources-icon">
                <Growth size={32} />
              </div>
              <h3 className="feature-title">Resources</h3>
              <p className="feature-description">
                Access powerful tools, essential services, and startup networks that save time and drive results.
              </p>
            </div>

            <div className="success-feature-card">
              <div className="feature-icon-wrapper funding-icon">
                <DollarSign size={32} />
              </div>
              <h3 className="feature-title">Funding</h3>
              <p className="feature-description">
                Connect with investors, raise capital confidently, and fuel your business for long-term success.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Problem → Solution */}
      <section ref={problemSolutionRef} className="problem-solution">
        <div className="container">
          <div className="problem-solution-grid">
            <div
              className={`problem-card ${
                problemSolutionVisible ? "scroll-animate-in" : ""
              }`}
            >
              <h3 className="card-title problem-title">
                <Target className="card-icon" size={28} />
                Founder Pain Points
              </h3>
              <div className="pain-points">
                <div className="pain-point">
                  <div className="bullet"></div>
                  <span>
                    <b>Starting up shouldn't feel like guessing.</b>
                    <br />
                    But most founders struggle with the same roadblocks
                  </span>
                </div>
                <div className="pain-point">
                  <div className="bullet"></div>
                  <span>
                    <b> Wasted Time & Effort.</b>
                    <br />
                    Spending months figuring out what to do next — with no clear
                    direction.
                  </span>
                </div>
                <div className="pain-point">
                  <div className="bullet"></div>
                  <span>
                    <b>Limited Budget & Wrong Hires.</b>
                    <br />
                    Losing money on unverified developers, designers, and
                    marketing agencies.
                  </span>
                </div>
                <div className="pain-point">
                  <div className="bullet"></div>
                  <span>
                    <b>No Clear Guidance.</b>
                    <br />
                    Uncertain how to validate ideas, build MVPs, or reach early
                    customers.
                  </span>
                </div>
                <div className="pain-point">
                  <div className="bullet"></div>
                  <span>
                    <b>Funding Frustration.</b>
                    <br />
                    No roadmap for grants, investor connects, or pitch
                    readiness.
                  </span>
                </div>
                <div className="pain-point">
                  <div className="bullet"></div>
                  <span>
                    <b>Lack of Market Validation.</b>
                    <br />
                    Building products without confirming real demand — resulting
                    in features nobody actually needs.
                  </span>
                </div>
              </div>
              <button
                className="read-more-btn"
                onClick={() => setShowPainPointsModal(true)}
              >
                Read More
              </button>
            </div>

            <div
              className={`solution-card ${
                problemSolutionVisible ? "scroll-animate-in" : ""
              }`}
            >
              <h3 className="card-title solution-title">
                <Lightbulb className="card-icon" size={28} />
                Our Solution
              </h3>
              <div className="pain-points">
                <div className="pain-point">
                  <div className="bullet"></div>
                  <span>
                    <b>
                      Startup Wings simplifies your startup journey — helping
                      founders save time, save money, and build smarter.
                    </b>
                    <br />
                    No more guesswork — just clear steps, expert help, and
                    growth-focused tools.
                  </span>
                </div>
                <div className="pain-point">
                  <div className="bullet"></div>
                  <span>
                    <b>Save Time</b>
                    <br />
                    Structured roadmap and guided workflows show what to do next
                    — cutting months of trial and error.
                  </span>
                </div>
                <div className="pain-point">
                  <div className="bullet"></div>
                  <span>
                    <b>Save Money</b>
                    <br />
                    Access verified experts, templates, and affordable tools —
                    avoiding costly mistakes.
                  </span>
                </div>
                <div className="pain-point">
                  <div className="bullet"></div>
                  <span>
                    <b>Build Smarter.</b>
                    <br />
                    Validate ideas, research markets, and prepare investor-ready
                    plans with expert-backed frameworks.
                  </span>
                </div>
                <div className="pain-point">
                  <div className="bullet"></div>
                  <span>
                    <b> Get Funding-Ready</b>
                    <br />
                    Create powerful pitch decks, apply for grants, and connect
                    with investors or government programs.
                  </span>
                </div>
              </div>
              <button
                className="read-more-btn"
                onClick={() => setShowSolutionModal(true)}
              >
                Read More
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Pain Points Modal */}
      {showPainPointsModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowPainPointsModal(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setShowPainPointsModal(false)}
            >
              <X size={24} />
            </button>
            <h2 className="modal-title">The Reality Every Founder Faces</h2>
            <div className="modal-body">
              <p>
                Turning an idea into a startup sounds exciting — until you
                actually start. Many founders lose months of precious time — and
                often their savings — just trying to figure out what to do next.
                They jump from one tutorial to another, talk to multiple
                consultants, and still end up confused about what really matters
                for growth.
              </p>
              <p>
                It's also hard to find trusted partners who understand the
                unique needs of early-stage startups. Whether it's finding a
                reliable developer, a designer who gets your vision, or a
                marketer who can build traction — most founders waste money on
                inconsistent, low-quality work that slows them down.
              </p>
              <p>
                And when it comes to funding or grants, the challenge only gets
                bigger. Many don't know where to start, what documents investors
                expect, or how to present their idea in a way that gets noticed.
              </p>
              <p>
                As a result, great ideas never get the chance they deserve — not
                because the founders lacked potential, but because they lacked
                the right guidance, network, and roadmap.
              </p>
              <p className="modal-highlight">
                <strong>That's where Startup Wings comes in</strong> — A guided
                platform that helps you move from confusion to clarity,
                providing the tools, mentors, and resources you need to turn
                your idea into an investor-ready startup.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Solution Modal */}
      {showSolutionModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowSolutionModal(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setShowSolutionModal(false)}
            >
              <X size={24} />
            </button>
            <h2 className="modal-title">Why Choose Startup Wings</h2>
            <div className="modal-body">
              <p>
                At Startup Wings, we simplify the entire journey of building a
                startup — from idea validation to investor readiness. We know
                how frustrating and expensive it can be to figure everything out
                alone. That's why our guided platform helps founders save time,
                save money, and avoid costly mistakes.
              </p>

              <h3>From Confusion to Clarity</h3>
              <p>
                We help you validate your idea with structured tools and real
                market research — so you know your startup is solving the right
                problem before you invest heavily. Save time and resources by
                building what the market actually needs.
              </p>

              <h3>Build with the Right Team</h3>
              <p>
                Access verified developers, designers, and marketing experts who
                understand early-stage challenges. No more trial and error — we
                connect you with trusted professionals at startup-friendly
                prices.
              </p>

              <h3>Funding & Grant Assistance</h3>
              <p>
                Our experts help you prepare pitch decks, documentation, and
                applications for investor funds and government grants. Secure
                the right funding faster without wasting money on expensive
                consultants.
              </p>

              <h3>A Guided Platform for Every Stage</h3>
              <p>
                From company registration to go-to-market strategy — our
                platform gives you a step-by-step roadmap, mentorship, and
                resources tailored to your stage. Avoid confusion and guesswork
                — build smarter with expert guidance.
              </p>

              <p className="modal-highlight">
                <strong>The Result:</strong> You move from idea to execution
                with confidence — saving months of effort and thousands of
                rupees along the way. Startup Wings isn't just a service — it's
                your growth partner, helping you launch faster, smarter, and
                stronger.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* How It Works */}
      <section className="how-it-works">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">How It Works</h2>
            <p className="section-subtitle">
              Your Startup Journey in 3 Guided Steps
            </p>
          </div>

          <div className="steps-grid">
            <div className="step">
              <div className="step-number step-1">1</div>
              <h3 className="step-title">Validate Your Idea</h3>
              <p className="step-description">
                Turn your concept into a solid startup idea using our guided
                validation tools.
              </p>
            </div>

            <div className="step">
              <div className="step-number step-2">2</div>
              <h3 className="step-title">Research & Plan</h3>
              <p className="step-description">
                Discover your market, analyze competitors, and build a winning
                strategy.
              </p>
            </div>

            <div className="step">
              <div className="step-number step-3">3</div>
              <h3 className="step-title">Launch with Confidence</h3>
              <p className="step-description">
                Follow your step-by-step roadmap, connect with mentors, and
                unlock startup grants.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="social-proof">
        <div className="container">
          <h2 className="section-title">
            Built for Early-Stage Founders Across India
          </h2>

          <div className="testimonials">
            <div className="testimonial">
              <div className="stars">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="star filled" size={20} />
                ))}
              </div>
              <p className="testimonial-text">
                "Startup Wings saved me months of confusion. The validation
                toolkit is incredible!"
              </p>
              <div className="testimonial-author">- Priya S., Mumbai</div>
            </div>

            <div className="testimonial">
              <div className="stars">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="star filled" size={20} />
                ))}
              </div>
              <p className="testimonial-text">
                "Finally, a clear roadmap from idea to launch. Game changer for
                first-time founders."
              </p>
              <div className="testimonial-author">- Raj K., Bangalore</div>
            </div>

            <div className="testimonial">
              <div className="stars">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="star filled" size={20} />
                ))}
              </div>
              <p className="testimonial-text">
                "The mentor access and community support are worth their weight
                in gold."
              </p>
              <div className="testimonial-author">- Anita M., Delhi</div>
            </div>
          </div>
        </div>
      </section>

      {/* Clients Section */}
      <EnhancedClientsCarousel/>

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