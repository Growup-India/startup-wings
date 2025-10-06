import React, { useState } from "react";
import { User, Mail, Phone, Target, Megaphone, MessageSquare, Send } from 'lucide-react';
import "./css/contact.css";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
    referral: "",
    service: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");
  const [submitError, setSubmitError] = useState("");

  const API_BASE_URL = "http://localhost:5000/api";

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setSubmitMessage("");
    setSubmitError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage("");
    setSubmitError("");

    try {
      const response = await fetch(`${API_BASE_URL}/contact/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setSubmitMessage(data.message);
        setFormData({
          name: "",
          email: "",
          phone: "",
          message: "",
          referral: "",
          service: "",
        });
      } else {
        setSubmitError(data.message || "Something went wrong. Please try again.");
        if (data.errors && data.errors.length > 0) {
          const errorMessages = data.errors.map(err => err.msg).join(', ');
          setSubmitError(errorMessages);
        }
      }
    } catch (error) {
      console.error("Contact form error:", error);
      setSubmitError("Network error. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="dashboard-section">
      <div className="dash-container">
        <div className="dashboard-card">
          <div className="dashboard-header">
            <h2>
              Get in <span className="highlight-text">Touch</span>
            </h2>
            <p>
              Have questions? We'd love to hear from you. Drop us a message and we'll get back to you soon.
            </p>
          </div>

          {/* Success Message */}
          {submitMessage && (
            <div className="success-message">
              ✅ {submitMessage}
            </div>
          )}

          {/* Error Message */}
          {submitError && (
            <div className="error-message">
              ❌ {submitError}
            </div>
          )}

          <form className="dashboard-form" onSubmit={handleSubmit}>
            <div className="form-grid">
              {/* Name */}
              <div className="form-group">
                <label>
                  <User size={16} className="icon" />
                  Name *
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                />
              </div>

              {/* Email */}
              <div className="form-group">
                <label>
                  <Mail size={16} className="icon" />
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                />
              </div>

              {/* Phone */}
              <div className="form-group">
                <label>
                  <Phone size={16} className="icon" />
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  placeholder="+91 1234567890"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={isSubmitting}
                />
              </div>

              {/* Service */}
              <div className="form-group">
                <label>
                  <Target size={16} className="icon" />
                  Select Service *
                </label>
                <select
                  name="service"
                  value={formData.service}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                >
                  <option value="">Select a service</option>
                  <option value="Business Registration & Incorporation">Business Registration & Incorporation</option>
                  <option value="GST Registration & Returns">GST Registration & Returns</option>
                  <option value="No-Code Website Development">No-Code Website Development</option>
                  <option value="SEO Optimization">SEO Optimization</option>
                  <option value="Investor Network Introductions">Investor Network Introductions</option>
                  <option value="1:1 Mentorship Sessions">1:1 Mentorship Sessions</option>
                </select>
              </div>

              {/* Referral */}
              <div className="form-group">
                <label>
                  <Megaphone size={16} className="icon" />
                  How did you hear about us?
                </label>
                <select
                  name="referral"
                  value={formData.referral}
                  onChange={handleChange}
                  disabled={isSubmitting}
                >
                  <option value="">Select an option</option>
                  <option value="social">Social Media</option>
                  <option value="friend">Friend / Colleague</option>
                  <option value="search">Search Engine</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {/* Message */}
            <div className="form-group">
              <label>
                <MessageSquare size={16} className="icon" />
                Message *
              </label>
              <textarea
                name="message"
                placeholder="Tell us more about your project or question..."
                value={formData.message}
                onChange={handleChange}
                required
                rows={4}
                disabled={isSubmitting}
              />
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="save-btn"
            >
              {isSubmitting ? (
                <>
                  <div className="spinner"></div>
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send size={20} />
                  <span>Send Message</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Contact;