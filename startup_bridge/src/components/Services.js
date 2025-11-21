import React, { useState, useEffect } from "react";
import { ArrowRight, X } from "lucide-react";
import "./css/services.css";
import AuthModal from "./AuthModal";
import Navbar from "./Navbar";
import Footer from "./Footer";
import servicesBanner from "./img/services-banner.jpg"; // <-- add this import

const services = [
  {
    id: "1",
    emoji: "🏛",
    title: "Company Setup & Compliance",
    short:
      "Business registration, GST/PAN/trademark, legal templates, ongoing compliance.",
    detailed:
      " We simplify business registration, GST/PAN/trademark filings, and legal documentation — all in one place. From company incorporation to ongoing compliance, Startup Wings ensures your startup stays fully registered, protected, and audit-ready.",
    features: [
      "Business Registration & Incorporation",
      "GST Registration & Returns",
      "Trademark Registration",
      "Startup Registration",
    ],
  },
  {
    id: "2",
    emoji: "🌐",
    title: "Digital Presence & Technology",
    short:
      "No-code websites, domain & hosting, branding, MVP prototyping with no/low-code.",
    detailed:
      "Get a no-code or low-code website, secure domain & hosting, professional branding, and MVP development — all managed by experts. We help startups go online fast, affordably, and ready to scale.",
    features: [
      "Web Development",
      "Brand Identity & Logo Design",
      "MVP Prototyping",
      "Social Media Setup",
      "SEO Optimization",
    ],
  },
  {
    id: "3",
    emoji: "📢",
    title: "Marketing & Growth",
    short:
      "Social media starter, SEO & ads strategy, pitch decks and PR kit for founders.",
    detailed:
      "We design data-driven marketing strategies that include SEO, social media, paid ads, and PR campaigns — crafted to help early-stage startups grow visibility, traction, and trust.",
    features: [
      "Social Media Strategy & Setup",
      "SEO & Content Strategy",
      "Google Ads & Facebook Ads",
      "Pitch Deck Creation",
      "Growth Hacking Strategies",
    ],
  },
  {
    id: "4",
    emoji: "💸",
    title: "Funding & Investor Readiness",
    short:
      "Pitch deck review, financial projections, mock investor sessions, introductions.",
    detailed:
      " From pitch deck design and financial modeling to mock investor sessions and introductions — we make your startup investor-ready. Our team helps you secure grants, angel, or VC funding faster.",
    features: [
      "Pitch Deck Review & Enhancement",
      "Financial Model & Projections",
      "Investor Presentation Training",
      "Mock Investor Sessions",
      "Due Diligence Preparation",
      "Investor Network Introductions",
    ],
  },
  {
    id: "5",
    emoji: "🎓",
    title: "Mentorship & Ecosystem Support",
    short:
      "1:1 mentorship, startup credits/tools, founder community & accelerator guidance.",
    detailed:
      "Access 1:1 mentorship, accelerator resources, and exclusive founder communities. We connect you with the right mentors, tools, and ecosystem partners to accelerate your startup journey.",
    features: [
      "1:1 Mentorship Sessions",
      "Startup Credits & Tools Access",
      "Founder Community Network",
      "Accelerator Program Guidance",
      "Industry Expert Connections",
      "Ongoing Strategic Support",
    ],
  },
];

export default function Services({ onLogin, user, onLogout }) {
  const [selectedService, setSelectedService] = useState(null);
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

  const handleCardClick = (service) => {
    setSelectedService(service);
  };

  const handleCloseModal = () => {
    setSelectedService(null);
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
    <div className="services-page">
      {/* Navigation */}
      <Navbar
        loggedInUser={loggedInUser}
        onLogout={handleLogout}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Banner Section */}
      <div className="services-banner">
        <img src={servicesBanner} alt="Our Services" />
        <div className="services-banner-overlay">
          <h1>Our Services</h1>
          <p>
            {" "}
            End-to-end support for founders — from company setup to growth,
            funding, and mentorship
          </p>
        </div>
      </div>

      {/* Services Hero Banner */}
      <div className="services-hero">
        <div className="container">
          {/* <h1>Our Services</h1> */}
          {/* <p>
            End-to-end support for founders — from company setup to growth,
            funding, and mentorship.
          </p> */}
        </div>
      </div>

      {/* Services Grid */}
      <div className="container">
        <div className="services-grid">
          {services.map((service, index) => (
            <div
              key={service.id}
              className="service-card"
              onClick={() => handleCardClick(service)}
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <div className="service-emoji">{service.emoji}</div>
              <h3>{service.title}</h3>
              <p>{service.short}</p>
              <div className="explore-btn">
                Explore Service
                <ArrowRight size={16} style={{ marginLeft: "8px" }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Popup */}
      {selectedService && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <button className="close-btn" onClick={handleCloseModal}>
                <X size={20} />
              </button>
              <div className="modal-title">
                <span className="modal-emoji">{selectedService.emoji}</span>
                <h2>{selectedService.title}</h2>
              </div>
              <p>{selectedService.detailed}</p>
            </div>

            <div className="modal-body">
              <div className="modal-features">
                <h3>What's Included</h3>
                <ul>
                  {selectedService.features.map((feature, index) => (
                    <li key={index}>✔ {feature}</li>
                  ))}
                </ul>
              </div>

              <div className="modal-actions">
                <a href="/contact" className="btn-small">
                  Contact Us
                  <ArrowRight size={16} style={{ marginLeft: "8px" }} />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

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
}
