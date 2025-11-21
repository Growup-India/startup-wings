"use client";

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./css/career.css";
import careerBanner from "./img/Careerpage.jpg";
import handshake from "./img/handshake.jpg";
import Navbar from "./Navbar";
import Footer from "./Footer.js";
import AuthModal from "./AuthModal";

// SVG Icons as components
const CodeIcon = () => (
  <svg
    className="w-12 h-12 text-blue-500"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
    />
  </svg>
);

const MegaphoneIcon = () => (
  <svg
    className="w-12 h-12 text-blue-500"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    strokeWidth="2"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 11l18-5v12l-18-5v-2z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M11 12v8a3 3 0 01-6 0v-9"
    />
  </svg>
);

const PaletteIcon = () => (
  <svg
    className="w-12 h-12 text-blue-500"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
    />
  </svg>
);

const RocketIcon = () => (
  <svg
    className="w-12 h-12 text-blue-500"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13 10V3L4 14h7v7l9-11h-7z"
    />
  </svg>
);

const HandshakeIcon = () => (
  <svg
    className="w-12 h-12 text-blue-500"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M14 10h4.764a2 2 0 011.789 2.894l-3.646 7.23a2 2 0 01-1.788 1.106H2a2 2 0 01-2-2V8a2 2 0 012-2h15.25a2 2 0 012 2v4"
    />
  </svg>
);

const TargetIcon = () => (
  <svg
    className="w-12 h-12 text-blue-500"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
    />
  </svg>
);

const LightbulbIcon = () => (
  <svg
    className="w-12 h-12 text-blue-500"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5.657 5.657l-.707.707M9 12a3 3 0 11 6 0 3 3 0 01-6 0z"
    />
  </svg>
);

export default function CareerPage({ user, onLogout, onLogin, onOpenAuth }) {
  const navigate = useNavigate();
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

  const handleApplyClick = () => {
    navigate("/career-form");
  };

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

  const jobs = [
    {
      title: "Web development",
      description:
        "Build dynamic, responsive websites and real-world projects using modern technologies.",
      skills:
        "Skills: HTML, CSS, JavaScript, React, Express, J.S, node.js, SQL.",
      workWith: "Work with: Real startup clients & live projects.",
      icon: <CodeIcon />,
    },
    {
      title: "Social media marketing",
      description:
        "Elevate brand presence through strategic content and authentic engagement across platforms.",
      skills: "Skills: Branding, content strategy, analytics.",
      workWith: "Work with: Real brand accounts & digital teams.",
      icon: <MegaphoneIcon />,
    },
    {
      title: "Graphic designer",
      description:
        "Design creative visuals, logos, and social media content that tell brand stories.",
      skills: "Skills: Photoshop, Illustrator, Canva, Figma.",
      workWith: "Work with: Startup design team & client campaigns.",
      icon: <PaletteIcon />,
    },
  ];

  const benefits = [
    {
      title: "Real-World experience",
      description:
        "Work directly on live startup projects and build impactful Solutions.",
      icon: <RocketIcon />,
    },
    {
      title: "Team collaboration",
      description:
        "Learn teamwork, communication and project work flow like a company.",
      icon: <HandshakeIcon />,
    },
    {
      title: "Career Growth",
      description:
        "Gain hand-on experience and strengthen your portfolio for future Opportunities.",
      icon: <TargetIcon />,
    },
    {
      title: "Creative Freedom",
      description:
        "Bring your ideas to your life- innovate, design and code with flexibility.",
      icon: <LightbulbIcon />,
    },
  ];

  return (
    <main className="career-page">
      <Navbar 
        user={loggedInUser} 
        onLogout={handleLogout}
        onOpenAuth={handleOpenAuthModal}
      />
      
      {/* HERO / JOIN US SECTION */}
      <section className="career-impact-section">
        <div className="career-impact-container">
          <div className="career-impact-image-wrapper">
            <img className="career-impact-image" src={careerBanner} alt="..." />
          </div>
          <div className="career-impact-text">
            <h2 className="career-impact-title">Join us</h2>
            <h1 className="career-impact-description">
              Meet the dreamers, doers, and innovators behind Startup Wings —
              the force that helps every startup take flight.
            </h1>
          </div>
        </div>
      </section>

      {/* Jobs We Offer Section */}
      <section className="jobs-section">
        <div className="jobs-container">
          <h1 className="jobs-title">
            <span className="jobs-title-normal">Career</span>{" "}
            <span className="jobs-title-highlight">Options</span>
          </h1>

          <div className="jobs-grid">
            {jobs.map((job, index) => (
              <div
                key={index}
                className="job-card"
                style={{ "--animation-delay": `${index * 150}ms` }}
              >
                <div className="job-icon">{job.icon}</div>
                <h3 className="job-title">{job.title}</h3>
                <p className="job-description">{job.description}</p>
                <p className="job-details">{job.skills}</p>
                <p className="job-details">{job.workWith}</p>
                <button className="apply-button" onClick={handleApplyClick}>
                  Apply Now
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Join Us Section */}
      <section className="benefits-section">
        <div className="benefits-container">
          <h2 className="benefits-title">
            <span className="benefits-title-normal">Why</span>{" "}
            <span className="benefits-title-highlight">Join Us?</span>
          </h2>

          {/* Center image */}
          <div
            className="benefit-image-container"
            style={{ "--animation-delay": "0ms" }}
          >
            <img
              src={handshake}
              alt="Business collaboration"
              className="benefit-image"
            />
          </div>

          <div className="benefits-grid">
            {/* Top left card */}
            <div
              className="benefit-card"
              style={{ "--animation-delay": "0ms" }}
            >
              <div className="benefit-icon">{benefits[0].icon}</div>
              <h3 className="benefit-title">{benefits[0].title}</h3>
              <p className="benefit-description">{benefits[0].description}</p>
            </div>

            {/* Top right card */}
            <div
              className="benefit-card"
              style={{ "--animation-delay": "0ms" }}
            >
              <div className="benefit-icon">{benefits[1].icon}</div>
              <h3 className="benefit-title">{benefits[1].title}</h3>
              <p className="benefit-description">{benefits[1].description}</p>
            </div>

            {/* Bottom left card */}
            <div
              className="benefit-card"
              style={{ "--animation-delay": "0ms" }}
            >
              <div className="benefit-icon">{benefits[2].icon}</div>
              <h3 className="benefit-title">{benefits[2].title}</h3>
              <p className="benefit-description">{benefits[2].description}</p>
            </div>

            {/* Bottom right card */}
            <div
              className="benefit-card"
              style={{ "--animation-delay": "0ms" }}
            >
              <div className="benefit-icon">{benefits[3].icon}</div>
              <h3 className="benefit-title">{benefits[3].title}</h3>
              <p className="benefit-description">{benefits[3].description}</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)} 
        onLogin={onLogin} 
      />
    </main>
  );
}