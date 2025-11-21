import React, { useState } from "react";
import fI from "./img/Formimg.jpg";
import Navbar from "./Navbar";
import Footer from "./Footer.js";
import "./css/career.css";

export default function CareerPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    jobRole: "",
    address: "",
    pincode: "",
    cv: null,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'File size must be less than 5MB' });
        return;
      }
      
      // Validate file type
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        setMessage({ type: 'error', text: 'Only PDF, DOC, and DOCX files are allowed' });
        return;
      }

      setFormData((prev) => ({
        ...prev,
        cv: file,
      }));
      setMessage({ type: '', text: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ type: '', text: '' });

    // Create FormData object
    const submitData = new FormData();
    submitData.append('firstName', formData.firstName);
    submitData.append('lastName', formData.lastName);
    submitData.append('email', formData.email);
    submitData.append('jobRole', formData.jobRole);
    submitData.append('address', formData.address);
    submitData.append('pincode', formData.pincode);
    submitData.append('cv', formData.cv);

    try {
      const response = await fetch('http://localhost:5000/api/career/apply', {
        method: 'POST',
        body: submitData,
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: data.message || 'Application submitted successfully!' });
        
        // Reset form after successful submission
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          jobRole: "",
          address: "",
          pincode: "",
          cv: null,
        });
        
        // Reset file input
        const fileInput = document.getElementById('cv');
        if (fileInput) fileInput.value = '';
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to submit application' });
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setMessage({ type: 'error', text: 'Network error. Please check if the server is running.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="career-page">
      <Navbar />

      <section className="form-section">
        <div className="form-container">
          <div className="form-wrapper">
            <div className="form-image-side">
              <img src={fI} alt="Career application" className="form-image" />
            </div>

            <div className="form-side">
              <h2 className="form-title">Career Application Form</h2>

              {message.text && (
                <div className={`message ${message.type}`} style={{
                  padding: '12px',
                  marginBottom: '20px',
                  borderRadius: '6px',
                  backgroundColor: message.type === 'success' ? '#d4edda' : '#f8d7da',
                  color: message.type === 'success' ? '#155724' : '#721c24',
                  border: `1px solid ${message.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`
                }}>
                  {message.text}
                </div>
              )}

              <form onSubmit={handleSubmit} className="form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="firstName" className="form-label">
                      First Name
                    </label>
                    <input
                      id="firstName"
                      name="firstName"
                      placeholder="Enter name"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="form-input"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="lastName" className="form-label">
                      Last Name
                    </label>
                    <input
                      id="lastName"
                      name="lastName"
                      placeholder="Last name"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="form-input"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="email" className="form-label">
                      Email-id
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="abc123@gmail.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="form-input"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="jobRole" className="form-label">
                      Job Role
                    </label>
                    <input
                      id="jobRole"
                      name="jobRole"
                      placeholder="Frontend dev."
                      value={formData.jobRole}
                      onChange={handleInputChange}
                      className="form-input"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="address" className="form-label">
                    Address
                  </label>
                  <input
                    id="address"
                    name="address"
                    placeholder="Enter your address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="form-input form-input-full"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="pincode" className="form-label">
                      Pincode
                    </label>
                    <input
                      id="pincode"
                      name="pincode"
                      placeholder="123456"
                      value={formData.pincode}
                      onChange={handleInputChange}
                      className="form-input"
                      pattern="[0-9]{6}"
                      maxLength="6"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="cv" className="form-label">
                      Upload your CV
                    </label>
                    <label className="file-upload-label">
                      <span className="file-upload-text">
                        {formData.cv ? formData.cv.name : "Choose File"}
                      </span>
                      <input
                        id="cv"
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileChange}
                        className="file-input"
                        required
                        disabled={isSubmitting}
                      />
                    </label>
                  </div>
                </div>

                <div className="form-submit">
                  <button 
                    type="submit" 
                    className="submit-button"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Submitting...' : 'Apply Now'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}