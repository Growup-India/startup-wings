import React, { useState } from "react";
import { X, Eye, EyeOff, Mail, Lock, User, Phone } from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./css/authmodal.css";

const AuthModal = ({ isOpen, onClose, onLogin }) => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [isMobileAuth, setIsMobileAuth] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
    otp: "",
  });

  if (!isOpen) return null;

  const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    // Client-side validation for email/password auth
    if (!isMobileAuth && !isLogin && formData.password !== formData.confirmPassword) {
      setError("Passwords don't match!");
      setLoading(false);
      return;
    }

    try {
      if (isMobileAuth) {
        // Mobile OTP Authentication
        if (!otpSent) {
          // Send OTP
          const response = await fetch(`${API_BASE_URL}/api/otp/send`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ phoneNumber: formData.phoneNumber }),
          });

          const data = await response.json();

          if (data.success) {
            setOtpSent(true);
            alert(`OTP sent to ${formData.phoneNumber}${data.otp ? `. OTP: ${data.otp}` : ''}`);
          } else {
            setError(data.error || "Failed to send OTP");
          }
        } else {
          // Verify OTP
          const response = await fetch(`${API_BASE_URL}/api/otp/verify`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              phoneNumber: formData.phoneNumber,
              otp: formData.otp,
              name: formData.name
            }),
          });

          const data = await response.json();

          if (data.success) {
            // Store JWT token
            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));
            
            // Success message
            alert(data.isNewUser 
              ? `Welcome ${data.user.name}! Your account has been created.`
              : `Welcome back, ${data.user.name}!`
            );
            
            // Call onLogin callback
            if (onLogin) {
              onLogin(data.user);
            }
            
            // Navigate to dashboard
            navigate('/dashboard');
            onClose();
          } else {
            setError(data.error || "Invalid OTP");
          }
        }
      } else {
        // Email/Password Authentication
        const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
        const payload = isLogin 
          ? { email: formData.email, password: formData.password }
          : { 
              name: formData.name, 
              email: formData.email, 
              password: formData.password, 
              confirmPassword: formData.confirmPassword
            };

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (data.success) {
          // Store JWT token
          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(data.user));
          
          // Success message
          alert(isLogin 
            ? `Welcome back, ${data.user.name}!` 
            : `Account created successfully! Welcome, ${data.user.name}!`
          );
          
          // Reset form
          setFormData({
            name: "",
            email: "",
            password: "",
            confirmPassword: "",
            phoneNumber: "",
            otp: "",
          });
          
          // Call onLogin callback
          if (onLogin) {
            onLogin(data.user);
          }
          
          onClose();
        } else {
          setError(data.error || data.message || "Something went wrong. Please try again.");
        }
      }
    } catch (error) {
      console.error("Auth error:", error);
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    
    if (error) setError("");
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setError("");
    setOtpSent(false);
    setIsMobileAuth(false);
    setFormData({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      phoneNumber: "",
      otp: "",
    });
  };

  const handleGoogleAuth = () => {
    window.location.href = `${API_BASE_URL}/auth/google`;
  };

  const handleMobileAuth = () => {
    setIsMobileAuth(true);
    setOtpSent(false);
    setError("");
    setFormData({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      phoneNumber: "",
      otp: "",
    });
  };

  const handleResendOTP = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/otp/resend`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phoneNumber: formData.phoneNumber }),
      });

      const data = await response.json();

      if (data.success) {
        alert(`OTP resent to ${formData.phoneNumber}${data.otp ? `. OTP: ${data.otp}` : ''}`);
      } else {
        setError(data.error || "Failed to resend OTP");
      }
    } catch (error) {
      console.error("Resend OTP error:", error);
      setError("Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleBackToPhone = () => {
    setOtpSent(false);
    setFormData(prev => ({ ...prev, otp: "" }));
    setError("");
  };

  const handleBackToEmail = () => {
    setIsMobileAuth(false);
    setOtpSent(false);
    setError("");
    setFormData({
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      phoneNumber: "",
      otp: "",
    });
  };

  return (
    <div className="auth-overlay">
      <div className="auth-backdrop" onClick={onClose}></div>

      <div className="auth-card">
        {/* Header */}
        <div className="auth-header">
          <h2>
            {isMobileAuth 
              ? (otpSent ? "Verify OTP" : "Mobile Login")
              : (isLogin ? "Welcome back" : "Create account")
            }
          </h2>
          <button className="close-btn" onClick={onClose} disabled={loading}>
            <X size={18} />
          </button>
        </div>
        <p className="auth-description">
          {isMobileAuth
            ? (otpSent 
                ? `Enter the OTP sent to ${formData.phoneNumber}`
                : "Enter your mobile number to continue")
            : (isLogin
                ? "Sign in to your account to continue"
                : "Get started with your startup journey")
          }
        </p>

        {/* Error Message */}
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          {isMobileAuth ? (
            // Mobile OTP Flow
            <>
              {!otpSent ? (
                <>
                  <div className="form-group">
                    <label htmlFor="name">Name (Optional)</label>
                    <div className="input-wrapper">
                      <User className="input-icon" size={16} />
                      <input
                        id="name"
                        name="name"
                        type="text"
                        placeholder="Enter your name"
                        value={formData.name}
                        onChange={handleInputChange}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="phoneNumber">Mobile Number</label>
                    <div className="input-wrapper">
                      <Phone className="input-icon" size={16} />
                      <input
                        id="phoneNumber"
                        name="phoneNumber"
                        type="tel"
                        placeholder="+919876543210"
                        value={formData.phoneNumber}
                        onChange={handleInputChange}
                        required
                        disabled={loading}
                        pattern="^\+91[6-9]\d{9}$"
                        title="Enter valid Indian mobile number (e.g., +919876543210)"
                      />
                    </div>
                    <small style={{ color: '#64748b', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                      Format: +91XXXXXXXXXX
                    </small>
                  </div>

                  <button 
                    type="submit" 
                    className={`auth-btn ${loading ? 'loading' : ''}`}
                    disabled={loading}
                  >
                    {loading ? "Sending OTP..." : "Send OTP"}
                  </button>

                  <button
                    type="button"
                    onClick={handleBackToEmail}
                    disabled={loading}
                    style={{
                      marginTop: '10px',
                      background: 'transparent',
                      color: '#4f46e5',
                      border: '1px solid #4f46e5',
                      padding: '12px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500',
                      width: '100%'
                    }}
                  >
                    Back to Email Login
                  </button>
                </>
              ) : (
                <>
                  <div className="form-group">
                    <label htmlFor="otp">Enter OTP</label>
                    <div className="input-wrapper">
                      <Lock className="input-icon" size={16} />
                      <input
                        id="otp"
                        name="otp"
                        type="text"
                        placeholder="Enter 6-digit OTP"
                        value={formData.otp}
                        onChange={handleInputChange}
                        required
                        disabled={loading}
                        maxLength={6}
                        pattern="\d{6}"
                        title="Enter 6-digit OTP"
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    className={`auth-btn ${loading ? 'loading' : ''}`}
                    disabled={loading}
                  >
                    {loading ? "Verifying..." : "Verify OTP"}
                  </button>

                  <div style={{ 
                    display: 'flex', 
                    gap: '10px', 
                    marginTop: '10px' 
                  }}>
                    <button
                      type="button"
                      onClick={handleResendOTP}
                      disabled={loading}
                      style={{
                        flex: 1,
                        background: 'transparent',
                        color: '#4f46e5',
                        border: '1px solid #4f46e5',
                        padding: '12px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                    >
                      Resend OTP
                    </button>

                    <button
                      type="button"
                      onClick={handleBackToPhone}
                      disabled={loading}
                      style={{
                        flex: 1,
                        background: 'transparent',
                        color: '#64748b',
                        border: '1px solid #cbd5e1',
                        padding: '12px',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500'
                      }}
                    >
                      Change Number
                    </button>
                  </div>
                </>
              )}
            </>
          ) : (
            // Email/Password Flow
            <>
              {!isLogin && (
                <div className="form-group">
                  <label htmlFor="name">Full Name</label>
                  <div className="input-wrapper">
                    <User className="input-icon" size={16} />
                    <input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required={!isLogin}
                      disabled={loading}
                    />
                  </div>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <div className="input-wrapper">
                  <Mail className="input-icon" size={16} />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="password">Password</label>
                <div className="input-wrapper">
                  <Lock className="input-icon" size={16} />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    disabled={loading}
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {!isLogin && (
                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm Password</label>
                  <div className="input-wrapper">
                    <Lock className="input-icon" size={16} />
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      required={!isLogin}
                      disabled={loading}
                      minLength={6}
                    />
                    <button
                      type="button"
                      className="toggle-password"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={loading}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              )}

              <button 
                type="submit" 
                className={`auth-btn ${loading ? 'loading' : ''}`}
                disabled={loading}
              >
                {loading 
                  ? (isLogin ? "Signing In..." : "Creating Account...") 
                  : (isLogin ? "Sign In" : "Create Account")
                }
              </button>
            </>
          )}
        </form>

        {!isMobileAuth && !otpSent && (
          <>
            {/* Divider */}
            <div className="auth-divider">
              <span>or continue with</span>
            </div>

            {/* Alternative Sign-in Options */}
            <div className="auth-alternatives">
              <button 
                type="button" 
                className="alt-auth-btn"
                disabled={loading}
                onClick={handleGoogleAuth}
              >
                <svg viewBox="0 0 24 24" width="18" height="18">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>
              
              <button 
                type="button" 
                className="alt-auth-btn"
                disabled={loading}
                onClick={handleMobileAuth}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z"/>
                </svg>
                Continue with Mobile Number
              </button>
            </div>

            {/* Toggle */}
            <div className="auth-toggle">
              <p>
                {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                <button 
                  type="button" 
                  onClick={toggleAuthMode}
                  disabled={loading}
                >
                  {isLogin ? "Sign up" : "Sign in"}
                </button>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthModal;