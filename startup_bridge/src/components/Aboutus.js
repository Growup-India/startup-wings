import React, { useState, useEffect } from "react";
import { ChevronRight } from "lucide-react";
import Navbar from "./Navbar.js";
import Footer from "./Footer.js";
import AuthModal from "./AuthModal";
import './css/about.css';

const About = ({ user, onLogout, onLogin, onOpenAuth }) => {
  const [loggedInUser, setLoggedInUser] = useState(user || null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

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
    <div className="about-page">
      <Navbar 
        user={loggedInUser} 
        onLogout={handleLogout}
        onOpenAuth={handleOpenAuthModal}
      />

      {/* About Us Section */}
      <section
        style={{
          padding: "6rem 0",
          position: "relative",
        }}
      >
        <div
          style={{
            maxWidth: "1400px",
            margin: "0 auto",
            padding: "0 2rem",
          }}
        >
          <h2
            style={{
              fontSize: "4rem",
              fontWeight: "800",
              textAlign: "center",
              marginBottom: "3rem",
              background:
                "linear-gradient(135deg, #1f2937 0%, #2563eb 50%, #0891b2 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            About Us
          </h2>

          <p
            style={{
              fontSize: "1.25rem",
              lineHeight: "1.8",
              color: "#4b5563",
              textAlign: "justify",
              margin: "0 auto 4rem",
              maxWidth: "90%",
              fontWeight: "400",
              letterSpacing: "0.3px",
            }}
          >
            At<span style={{ color: "#3B82F6" }}> Startup Wings</span>, we
            believe that every great idea deserves the right launchpad. Too many
            founders waste time, money, and energy on trial-and-error. That's
            why we built a guided platform that takes the guesswork out of
            building a startup. We help early-stage entrepreneurs validate
            ideas, research markets, register legally, build online presence,
            design marketing strategies, and connect with grants, mentors, and
            investors—all in one place. Our mission is simple: make starting up
            smarter, faster, and more affordable. With{" "}
            <span style={{ color: "#3B82F6" }}> Startup Wings</span>, you don't
            just launch a business—you launch with confidence.
          </p>

          {/* Extended About Content */}
          <div style={{ display: "flex", flexDirection: "column" }}>
            {/* Our Story Section */}
            <div
              style={{
                margin: "5rem 0",
                display: "flex",
                gap: "3rem",
                alignItems: "center",
                flexDirection: "row",
              }}
            >
              {/* Banner on the left */}
              <div
                style={{
                  flex: "0 0 45%",
                  height: "300px",
                  borderRadius: "20px",
                  overflow: "hidden",
                  order: 1,
                }}
              >
                <img
                  src="https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1074"
                  alt="Our Story Banner"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              </div>

              {/* Content on the right */}
              <div style={{ flex: "1", order: 2 }}>
                <h3
                  style={{
                    fontSize: "2rem",
                    fontWeight: "700",
                    color: "#1f2937",
                    marginBottom: "1.5rem",
                    position: "relative",
                    display: "inline-block",
                  }}
                >
                  Our Story
                </h3>
                <p
                  style={{
                    fontSize: "1.125rem",
                    lineHeight: "1.8",
                    color: "#6b7280",
                    paddingLeft: "1rem",
                  }}
                >
                  Founded by entrepreneurs who've been through the startup
                  journey themselves, Startup wing was born from frustration
                  with the scattered, confusing advice available to first-time
                  founders. We've distilled years of experience, countless
                  mistakes, and hard-won insights into a clear, actionable
                  platform.
                </p>
              </div>
            </div>

            {/* why we exist Section */}
            <div
              style={{
                margin: "5rem 0",
                display: "flex",
                gap: "3rem",
                alignItems: "center",
                flexDirection: "row",
              }}
            >
              {/* Content on the left */}
              <div style={{ flex: "1", order: 1 }}>
                <h3
                  style={{
                    fontSize: "2rem",
                    fontWeight: "700",
                    color: "#1f2937",
                    marginBottom: "1.5rem",
                    position: "relative",
                    display: "inline-block",
                  }}
                >
                  Why We Exist
                </h3>
                <p
                  style={{
                    fontSize: "1.125rem",
                    lineHeight: "1.8",
                    color: "#6b7280",
                    paddingLeft: "1rem",
                  }}
                >
                  Step-by-step guidance from idea to launch Access to resources,
                  mentors, and funding opportunities Smart tools to validate and
                  grow your startup A supportive ecosystem that saves time and
                  reduces risk Whether you're at the idea stage or preparing to
                  scale, Startup wing is your trusted partner on the journey
                  from vision to reality.
                </p>
              </div>

              {/* Banner on the right */}
              <div
                style={{
                  flex: "0 0 45%",
                  height: "300px",
                  borderRadius: "20px",
                  overflow: "hidden",
                  order: 2,
                }}
              >
                <img
                  src="https://images.unsplash.com/photo-1586936893354-362ad6ae47ba?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1170"
                  alt="Our Vision Banner"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              </div>
            </div>

            {/* Our Vision Section */}
            <div
              style={{
                margin: "5rem 0",
                display: "flex",
                gap: "3rem",
                alignItems: "center",
              }}
            >
              {/* Banner on the left */}
              <div
                style={{
                  flex: "0 0 45%",
                  height: "300px",
                  borderRadius: "20px",
                  overflow: "hidden",
                }}
              >
                <img
                  src="https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1170"
                  alt="Our Mission Banner"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              </div>

              {/* Content on the right */}
              <div style={{ flex: "1" }}>
                <h3
                  style={{
                    fontSize: "2rem",
                    fontWeight: "700",
                    color: "#1f2937",
                    marginBottom: "1.5rem",
                    position: "relative",
                    display: "inline-block",
                  }}
                >
                  Our Vision
                </h3>
                <p
                  style={{
                    fontSize: "1.125rem",
                    lineHeight: "1.8",
                    color: "#6b7280",
                    paddingLeft: "1rem",
                  }}
                >
                  To become the most trusted launchpad for early-stage
                  entrepreneurs—empowering them to transform ideas into
                  successful, scalable businesses through guidance, resources,
                  and connections. We envision a world where every founder,
                  regardless of background, has equal access to knowledge,
                  mentorship, and opportunities to build startups that create
                  impact and drive innovation.
                </p>
              </div>
            </div>

            {/* Our Mission Section */}
            <div
              style={{
                margin: "5rem 0",
                display: "flex",
                gap: "3rem",
                alignItems: "center",
                flexDirection: "row",
              }}
            >
              {/* Content on the left */}
              <div style={{ flex: "1", order: 1 }}>
                <h3
                  style={{
                    fontSize: "2rem",
                    fontWeight: "700",
                    color: "#1f2937",
                    marginBottom: "1.5rem",
                    position: "relative",
                    display: "inline-block",
                  }}
                >
                  Our Mission
                </h3>
                <p
                  style={{
                    fontSize: "1.125rem",
                    lineHeight: "1.8",
                    color: "#6b7280",
                    paddingLeft: "1rem",
                  }}
                >
                  At Startup wing, we empower founders to launch smarter,
                  faster, and more affordably. By providing step-by-step
                  guidance, resources, and connections, we help entrepreneurs
                  transform ideas into successful businesses with confidence.
                </p>
              </div>

              {/* Banner on the right */}
              <div
                style={{
                  flex: "0 0 45%",
                  height: "300px",
                  borderRadius: "20px",
                  overflow: "hidden",
                  order: 2,
                }}
              >
                <img
                  src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&q=80&w=1170"
                  alt="Our Vision Banner"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              </div>
            </div>
          </div>

          <button
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
              background: "linear-gradient(135deg, #2563eb, #0891b2)",
              color: "white",
              border: "none",
              padding: "1rem 2rem",
              borderRadius: "50px",
              fontSize: "1.125rem",
              fontWeight: "600",
              cursor: "pointer",
              margin: "3rem auto 0",
              boxShadow: "0 8px 25px rgba(37, 99, 235, 0.2)",
              transition: "all 0.4s ease",
            }}
          >
            Connect with our founding team
            <ChevronRight size={16} />
          </button>
        </div>
      </section>

      <style>{`
        @media (max-width: 768px) {
          section:first-of-type {
            height: 250px !important;
            margin-top: 60px !important;
          }
          
          h2 {
            font-size: 2.5rem !important;
          }
          
          h3 {
            font-size: 1.5rem !important;
          }
          
          p {
            font-size: 1rem !important;
            text-align: left !important;
          }
          
          div[style*="height: 300px"] {
            height: 200px !important;
          }
          
          div[style*="display: flex"][style*="gap: 3rem"] {
            flex-direction: column !important;
          }
          
          div[style*="flex: 0 0 45%"] {
            flex: 1 1 auto !important;
          }
        }
        
        button:hover {
          transform: translateY(-3px) scale(1.05);
          box-shadow: 0 15px 35px rgba(37, 99, 235, 0.3);
        }
      `}</style>

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