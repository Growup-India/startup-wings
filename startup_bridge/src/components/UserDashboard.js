"use client"
import React, { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import "./css/userdashboard.css"
import {
  User,
  Building,
  MapPin,
  Calendar,
  Save,
  Briefcase,
  Rocket,
  Users,
  Globe,
  Target,
  TrendingUp,
  LogOut,
  FileText,
  HelpCircle,
  Home,
  Menu,
  X,
  Edit,
  Mail,
  DollarSign,
  Link as LinkIcon,
} from "lucide-react"
import img2 from './img/logo.png'

import Contact from "./Contact"
import Homepage from "./Homepage"

const UserDashboard = ({ user: propUser, onLogout }) => {
  const navigate = useNavigate()
  const [activeMenuItem, setActiveMenuItem] = useState('profile')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [user, setUser] = useState(propUser || null)
  const [profileExists, setProfileExists] = useState(false)
  const [loading, setLoading] = useState(false)
  const [profileData, setProfileData] = useState({
    founderName: "",
    startupName: "",
    industry: "",
    stage: "",
    location: "",
    description: "",
    website: "",
    foundedYear: "",
    isIncorporated: "",
    teamSize: "",
    competitiveAdvantage: "",
    monthlyRevenue: "",
    customerBase: "",
  })

  const calculateProfileCompletion = () => {
    const fields = [
      'founderName',
      'startupName', 
      'industry',
      'stage',
      'location',
      'description',
      'website',
      'foundedYear',
      'teamSize',
      'monthlyRevenue'
    ]
    
    const filledFields = fields.filter(field => {
      const value = profileData[field]
      return value && value.toString().trim() !== ""
    }).length
    
    return Math.round((filledFields / fields.length) * 100)
  }

  const fetchProfileData = useCallback(async () => {
    if (!user?.id) return
    
    try {
      const response = await fetch(`https://startup-wings-b.onrender.com/api/profile/${user.id}`, {
        credentials: "include",
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.profile) {
          setProfileData(data.profile)
          setProfileExists(true)
        }
      } else if (response.status === 404) {
        setProfileExists(false)
        setProfileData(prev => ({
          ...prev,
          founderName: user.name || user.displayName || user.email?.split('@')[0] || "",
        }))
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      setProfileExists(false)
    }
  }, [user])

  useEffect(() => {
    if (!propUser) {
      fetch("https://startup-wings-b.onrender.com/api/current_user", {
        credentials: "include",
      })
        .then((res) => res.json())
        .then((data) => setUser(data))
        .catch((error) => {
          console.error("Error fetching user:", error)
        })
    }
  }, [propUser])

  useEffect(() => {
    if (user?.id) {
      fetchProfileData()
    }
  }, [user, fetchProfileData])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isSidebarOpen && !event.target.closest('.sidebar') && !event.target.closest('.hamburger-btn')) {
        setIsSidebarOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isSidebarOpen])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setLoading(true)

    const profileWithUser = {
      ...profileData,
      userId: user?.id,
      userEmail: user?.email,
    }

    try {
      const response = await fetch('https://startup-wings-b.onrender.com/api/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(profileWithUser)
      })

      const data = await response.json()

      if (data.success) {
        alert(data.message || "Profile saved successfully!")
        setProfileExists(true)
        setActiveMenuItem('profile')
        await fetchProfileData()
      } else {
        alert(data.message || "Failed to save profile")
      }
    } catch (error) {
      console.error("Error saving profile:", error)
      alert("An error occurred while saving the profile")
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      try {
        if (onLogout) {
          onLogout()
        }
        
        try {
          await fetch("https://startup-wings-b.onrender.com/auth/logout", {
            credentials: "include"
          })
        } catch (error) {
          console.log("Backend logout not available:", error)
        }
        
        navigate('/', { replace: true })
      } catch (error) {
        console.error("Logout error:", error)
        navigate('/', { replace: true })
      }
    }
  }

  const handleHomeNavigation = () => {
    navigate('/')
    setIsSidebarOpen(false)
  }

  const handleMenuItemClick = (menuItem) => {
    setActiveMenuItem(menuItem)
    setIsSidebarOpen(false)
  }

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const handleEditProfile = () => {
    setActiveMenuItem('completeProfile')
  }

  if (!user) {
    return (
      <div className="dashboard-wrapper">
        <div className="dashboard-layout">
          <div className="main-content">
            <div className="dashboard-card">
              <h2>Loading...</h2>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const getUserPhoto = () => {
    return user?.photo || user?.picture || user?.avatar || user?.profilePicture || null
  }

  const getIndustryLabel = (value) => {
    const industries = {
      'technology': 'Technology',
      'healthcare': 'Healthcare',
      'fintech': 'Fintech',
      'ecommerce': 'E-commerce',
      'education': 'Education',
      'food': 'Food & Beverage',
      'other': 'Other'
    }
    return industries[value] || value
  }

  const getStageLabel = (value) => {
    const stages = {
      'idea': 'Idea Stage',
      'validation': 'Validation',
      'mvp': 'MVP Development',
      'launch': 'Pre-Launch',
      'growth': 'Growth Stage'
    }
    return stages[value] || value
  }

  const renderProfileView = () => (
    <div className="dashboard-card profile-view-card" style={{ 
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      border: 'none',
      boxShadow: '0 10px 40px rgba(0,0,0,0.08)'
    }}>
      <div className="profile-header" style={{
        background: 'linear-gradient(135deg, #a78bfa 0%, #c084fc 100%)',
        padding: '40px',
        borderRadius: '20px 20px 0 0',
        color: 'white',
        position: 'relative',
        overflow: 'hidden',
        marginBottom: '30px'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          opacity: 0.5
        }} />
        
        <div className="profile-header-content" style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          position: 'relative',
          zIndex: 1,
          flexWrap: 'wrap',
          gap: '20px'
        }}>
          <div className="profile-user-info" style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '20px', 
            flex: '1', 
            minWidth: '250px' 
          }}>
            {getUserPhoto() && (
              <img 
                src={getUserPhoto()} 
                alt="Profile" 
                className="profile-photo"
                width={100} 
                height={100}
                style={{ 
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '4px solid white',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.2)'
                }}
                onError={(e) => {
                  e.target.style.display = 'none'
                }}
              />
            )}
            <div className="profile-text-info" style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ 
                fontSize: '32px', 
                margin: '0 0 8px 0',
                fontWeight: '700'
              }}>
                {profileData.founderName || 'Your Profile'}
              </h2>
              <p style={{ 
                margin: 0, 
                opacity: 0.9,
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                flexWrap: 'wrap'
              }}>
                <Mail size={16} />
                <span style={{ wordBreak: 'break-all' }}>{user?.email}</span>
              </p>
            </div>
          </div>
          
          <button 
            className="edit-profile-btn"
            onClick={handleEditProfile}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '14px 28px',
              background: 'white',
              color: '#a78bfa',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: '600',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              whiteSpace: 'nowrap'
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'translateY(-2px)'
              e.target.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)'
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)'
              e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
            }}
          >
            <Edit size={18} />
            Edit Profile
          </button>
        </div>
      </div>

      {profileExists ? (
        <div className="profile-content" style={{ padding: '0 30px 40px' }}>
          <div className="stats-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '20px',
            marginBottom: '30px'
          }}>
            <div className="stat-card" style={{
              background: 'white',
              padding: '24px',
              borderRadius: '16px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              border: '1px solid #e2e8f0',
              transition: 'all 0.3s ease'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                marginBottom: '12px'
              }}>
                <span style={{ 
                  fontSize: '14px', 
                  color: '#64748b',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Industry
                </span>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Briefcase size={20} color="white" />
                </div>
              </div>
              <p style={{ 
                fontSize: '22px', 
                fontWeight: '700',
                color: '#1e293b',
                margin: 0
              }}>
                {getIndustryLabel(profileData.industry)}
              </p>
            </div>

            <div className="stat-card" style={{
              background: 'white',
              padding: '24px',
              borderRadius: '16px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              border: '1px solid #e2e8f0',
              transition: 'all 0.3s ease'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                marginBottom: '12px'
              }}>
                <span style={{ 
                  fontSize: '14px', 
                  color: '#64748b',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Stage
                </span>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Rocket size={20} color="white" />
                </div>
              </div>
              <p style={{ 
                fontSize: '22px', 
                fontWeight: '700',
                color: '#1e293b',
                margin: 0
              }}>
                {getStageLabel(profileData.stage)}
              </p>
            </div>

            <div className="stat-card" style={{
              background: 'white',
              padding: '24px',
              borderRadius: '16px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              border: '1px solid #e2e8f0',
              transition: 'all 0.3s ease'
            }}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                marginBottom: '12px'
              }}>
                <span style={{ 
                  fontSize: '14px', 
                  color: '#64748b',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Team Size
                </span>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Users size={20} color="white" />
                </div>
              </div>
              <p style={{ 
                fontSize: '22px', 
                fontWeight: '700',
                color: '#1e293b',
                margin: 0
              }}>
                {profileData.teamSize || 'Not specified'}
              </p>
            </div>
          </div>

          <div className="detail-cards-grid" style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px',
            marginBottom: '24px'
          }}>
            <div className="detail-card" style={{
              background: 'white',
              padding: '28px',
              borderRadius: '16px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              border: '1px solid #e2e8f0',
              transition: 'all 0.3s ease'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '20px',
                paddingBottom: '16px',
                borderBottom: '2px solid #e2e8f0'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Building size={24} color="white" />
                </div>
                <h3 style={{ 
                  fontSize: '20px',
                  fontWeight: '700',
                  color: '#1e293b',
                  margin: 0
                }}>
                  Company Details
                </h3>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <Building size={18} style={{ color: '#4f46e5', marginTop: '2px', flexShrink: 0 }} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ 
                      fontSize: '13px', 
                      color: '#64748b', 
                      margin: '0 0 4px 0',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Startup Name
                    </p>
                    <p style={{ 
                      fontSize: '16px', 
                      color: '#1e293b', 
                      margin: 0,
                      fontWeight: '600',
                      wordBreak: 'break-word'
                    }}>
                      {profileData.startupName}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <MapPin size={18} style={{ color: '#4f46e5', marginTop: '2px', flexShrink: 0 }} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ 
                      fontSize: '13px', 
                      color: '#64748b', 
                      margin: '0 0 4px 0',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Location
                    </p>
                    <p style={{ 
                      fontSize: '16px', 
                      color: '#1e293b', 
                      margin: 0,
                      fontWeight: '600',
                      wordBreak: 'break-word'
                    }}>
                      {profileData.location}
                    </p>
                  </div>
                </div>

                {profileData.foundedYear && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <Calendar size={18} style={{ color: '#4f46e5', marginTop: '2px', flexShrink: 0 }} />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{ 
                        fontSize: '13px', 
                        color: '#64748b', 
                        margin: '0 0 4px 0',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Founded
                      </p>
                      <p style={{ 
                        fontSize: '16px', 
                        color: '#1e293b', 
                        margin: 0,
                        fontWeight: '600'
                      }}>
                        {profileData.foundedYear}
                      </p>
                    </div>
                  </div>
                )}

                {profileData.website && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <Globe size={18} style={{ color: '#4f46e5', marginTop: '2px', flexShrink: 0 }} />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{ 
                        fontSize: '13px', 
                        color: '#64748b', 
                        margin: '0 0 4px 0',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Website
                      </p>
                      <a 
                        href={profileData.website} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        style={{ 
                          fontSize: '16px', 
                          color: '#4f46e5', 
                          fontWeight: '600',
                          textDecoration: 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.3s ease',
                          wordBreak: 'break-all'
                        }}
                        onMouseOver={(e) => e.target.style.textDecoration = 'underline'}
                        onMouseOut={(e) => e.target.style.textDecoration = 'none'}
                      >
                        Visit Website
                        <LinkIcon size={14} style={{ flexShrink: 0 }} />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="detail-card" style={{
              background: 'white',
              padding: '28px',
              borderRadius: '16px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              border: '1px solid #e2e8f0',
              transition: 'all 0.3s ease'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '20px',
                paddingBottom: '16px',
                borderBottom: '2px solid #e2e8f0'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <TrendingUp size={24} color="white" />
                </div>
                <h3 style={{ 
                  fontSize: '20px',
                  fontWeight: '700',
                  color: '#1e293b',
                  margin: 0
                }}>
                  Business Metrics
                </h3>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {profileData.monthlyRevenue && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <DollarSign size={18} style={{ color: '#10b981', marginTop: '2px', flexShrink: 0 }} />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{ 
                        fontSize: '13px', 
                        color: '#64748b', 
                        margin: '0 0 4px 0',
                        fontWeight: '600',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        Monthly Revenue
                      </p>
                      <p style={{ 
                        fontSize: '16px', 
                        color: '#1e293b', 
                        margin: 0,
                        fontWeight: '600'
                      }}>
                        {profileData.monthlyRevenue}
                      </p>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <Users size={18} style={{ color: '#10b981', marginTop: '2px', flexShrink: 0 }} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ 
                      fontSize: '13px', 
                      color: '#64748b', 
                      margin: '0 0 4px 0',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Team Size
                    </p>
                    <p style={{ 
                      fontSize: '16px', 
                      color: '#1e293b', 
                      margin: 0,
                      fontWeight: '600'
                    }}>
                      {profileData.teamSize || 'Not specified'}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <Rocket size={18} style={{ color: '#10b981', marginTop: '2px', flexShrink: 0 }} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ 
                      fontSize: '13px', 
                      color: '#64748b', 
                      margin: '0 0 4px 0',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      Current Stage
                    </p>
                    <p style={{ 
                      fontSize: '16px', 
                      color: '#1e293b', 
                      margin: 0,
                      fontWeight: '600'
                    }}>
                      {getStageLabel(profileData.stage)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="description-card" style={{
            background: 'white',
            padding: '32px',
            borderRadius: '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            border: '1px solid #e2e8f0',
            transition: 'all 0.3s ease'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '20px',
              paddingBottom: '16px',
              borderBottom: '2px solid #e2e8f0'
            }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Target size={24} color="white" />
              </div>
              <h3 style={{ 
                fontSize: '20px',
                fontWeight: '700',
                color: '#1e293b',
                margin: 0
              }}>
                About Your Startup
              </h3>
            </div>
            
            <p style={{ 
              fontSize: '15px', 
              lineHeight: '1.8',
              color: '#475569',
              margin: 0,
              textAlign: 'justify',
              wordBreak: 'break-word'
            }}>
              {profileData.description}
            </p>
          </div>
        </div>
      ) : (
        <div className="no-profile-section" style={{ 
          textAlign: 'center', 
          padding: '60px 40px',
          background: 'white',
          borderRadius: '16px',
          margin: '0 30px 40px'
        }}>
          <div style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px'
          }}>
            <FileText size={48} color="white" />
          </div>
          <h3 style={{ 
            color: '#1e293b', 
            marginBottom: '12px',
            fontSize: '24px',
            fontWeight: '700'
          }}>
            No Profile Found
          </h3>
          <p style={{ 
            color: '#64748b', 
            marginBottom: '32px',
            fontSize: '16px',
            maxWidth: '500px',
            margin: '0 auto 32px'
          }}>
            Complete your startup profile to get personalized guidance and unlock all features
          </p>
          <button 
            onClick={() => handleMenuItemClick('completeProfile')}
            style={{
              padding: '16px 32px',
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: '600',
              boxShadow: '0 4px 12px rgba(79,70,229,0.3)',
              transition: 'all 0.3s ease'
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'translateY(-2px)'
              e.target.style.boxShadow = '0 6px 20px rgba(79,70,229,0.4)'
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)'
              e.target.style.boxShadow = '0 4px 12px rgba(79,70,229,0.3)'
            }}
          >
            Complete Your Profile Now
          </button>
        </div>
      )}
    </div>
  )

  const renderProfileForm = () => (
    <div className="dashboard-card">
      <div className="dashboard-header">
        <h2>{profileExists ? 'Edit Your Profile' : 'Complete Your Startup Profile'}</h2>
        <p>Help us understand your startup better to provide personalized guidance</p>
      </div>

      <form onSubmit={handleSaveProfile} className="dashboard-form">
        <div className="form-grid">
          <div className="form-group">
            <label><User size={16} className="icon" /> Founder Name *</label>
            <input
              type="text"
              name="founderName"
              value={profileData.founderName}
              onChange={handleInputChange}
              placeholder="Your full name"
              required
            />
          </div>

          <div className="form-group">
            <label><Building size={16} className="icon" /> Startup Name *</label>
            <input
              type="text"
              name="startupName"
              value={profileData.startupName}
              onChange={handleInputChange}
              placeholder="Your startup name"
              required
            />
          </div>

          <div className="form-group">
            <label><Briefcase size={16} className="icon" /> Industry *</label>
            <select name="industry" value={profileData.industry} onChange={handleInputChange} required>
              <option value="">Select Industry</option>
              <option value="technology">Technology</option>
              <option value="healthcare">Healthcare</option>
              <option value="fintech">Fintech</option>
              <option value="ecommerce">E-commerce</option>
              <option value="education">Education</option>
              <option value="food">Food & Beverage</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label><Rocket size={16} className="icon" /> Current Stage *</label>
            <select name="stage" value={profileData.stage} onChange={handleInputChange} required>
              <option value="">Select Stage</option>
              <option value="idea">Idea Stage</option>
              <option value="validation">Validation</option>
              <option value="mvp">MVP Development</option>
              <option value="launch">Pre-Launch</option>
              <option value="growth">Growth Stage</option>
            </select>
          </div>

          <div className="form-group">
            <label><MapPin size={16} className="icon" /> Location *</label>
            <input
              type="text"
              name="location"
              value={profileData.location}
              onChange={handleInputChange}
              placeholder="City, State"
              required
            />
          </div>

          <div className="form-group">
            <label><Calendar size={16} className="icon" /> Founded Year</label>
            <input
              type="number"
              name="foundedYear"
              value={profileData.foundedYear}
              onChange={handleInputChange}
              placeholder="2024"
              min="2000"
              max="2025"
            />
          </div>

          <div className="form-group">
            <label><Globe size={16} className="icon" /> Website</label>
            <input
              type="url"
              name="website"
              value={profileData.website}
              onChange={handleInputChange}
              placeholder="https://yourwebsite.com"
            />
          </div>

          <div className="form-group">
            <label><Users size={16} className="icon" /> Team Size</label>
            <select name="teamSize" value={profileData.teamSize} onChange={handleInputChange}>
              <option value="">Select Team Size</option>
              <option value="1">Just me (Solo founder)</option>
              <option value="2-5">2-5 members</option>
              <option value="6-10">6-10 members</option>
              <option value="11-25">11-25 members</option>
              <option value="25+">25+ members</option>
            </select>
          </div>

          <div className="form-group">
            <label><TrendingUp size={16} className="icon" /> Monthly Revenue</label>
            <select name="monthlyRevenue" value={profileData.monthlyRevenue} onChange={handleInputChange}>
              <option value="">Select Range</option>
              <option value="pre-revenue">Pre-revenue</option>
              <option value="under-1k">Under $1,000</option>
              <option value="1k-10k">$1,000 - $10,000</option>
              <option value="10k-50k">$10,000 - $50,000</option>
              <option value="50k-100k">$50,000 - $100,000</option>
              <option value="100k+">$100,000+</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label><Target size={16} className="icon" /> Startup Description *</label>
          <textarea
            name="description"
            value={profileData.description}
            onChange={handleInputChange}
            placeholder="Provide details of your startup..."
            rows={4}
            required
          />
        </div>

        <button type="submit" className="save-btn" disabled={loading}>
          <Save size={20} />
          <span>{loading ? 'Saving...' : profileExists ? 'Update Profile' : 'Save Profile & Get Personalized Guidance'}</span>
        </button>
      </form>
    </div>
  )

  const renderContent = () => {
    switch(activeMenuItem) {
      case 'profile':
        return renderProfileView()
      case 'Home':
        return <Homepage/>
      case 'contact':
        return <Contact />
      case 'completeProfile':
        return renderProfileForm()
      default:
        return null;
    }
  }

  const completionPercentage = calculateProfileCompletion()

  return (
    <div className="dashboard-wrapper">
      <button 
        className="hamburger-btn" 
        onClick={toggleSidebar}
        aria-label="Toggle menu"
      >
        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {isSidebarOpen && <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />}

      <div className="dashboard-layout">
        <div className={`sidebar ${isSidebarOpen ? 'sidebar-open' : ''}`}>
          <div className="sidebar-header">
            <img 
              src={img2} 
              alt="Company Logo" 
              className="sidebar-logo"
            />
            <div className="sidebar-brand">
              <span>Startup Wing</span>
            </div>
          </div>

          <div style={{
            padding: '20px 15px',
            borderBottom: '1px solid rgba(255,255,255,0.1)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '8px'
            }}>
              <span style={{
                fontSize: '13px',
                color: 'rgba(255,255,255,0.8)',
                fontWeight: '500'
              }}>
                Profile Completion
              </span>
              <span style={{
                fontSize: '14px',
                color: '#fff',
                fontWeight: '600'
              }}>
                {completionPercentage}%
              </span>
            </div>
            
            <div style={{
              width: '100%',
              height: '8px',
              background: 'rgba(2, 2, 2, 0.3)',
              borderRadius: '10px',
              overflow: 'hidden',
              position: 'relative'
            }}>
              <div style={{
                width: `${completionPercentage}%`,
                height: '100%',
                background: completionPercentage === 100 
                  ? 'linear-gradient(90deg, #10b981 0%, #059669 100%)'
                  : completionPercentage >= 70
                  ? 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)'
                  : completionPercentage >= 40
                  ? 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)'
                  : 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)',
                borderRadius: '10px',
                transition: 'width 0.5s ease-in-out',
                boxShadow: '0 0 10px rgba(0, 0, 0, 0.3)'
              }} />
            </div>
            
            {completionPercentage < 100 && (
              <p style={{
                fontSize: '11px',
                color: 'rgba(7, 1, 1, 0.7)',
                marginTop: '8px',
                textAlign: 'center'
              }}>
                {completionPercentage === 0 
                  ? 'Start your profile!' 
                  : completionPercentage < 50
                  ? 'Keep going!'
                  : completionPercentage < 100
                  ? 'Almost there!'
                  : ''}
              </p>
            )}
            
            {completionPercentage === 100 && (
              <p style={{
                fontSize: '11px',
                color: '#10b981',
                marginTop: '8px',
                textAlign: 'center',
                fontWeight: '600'
              }}>
                Profile Complete!
              </p>
            )}
          </div>
          
          <div className="sidebar-menu">
            <button
              className={`sidebar-item ${activeMenuItem === 'profile' ? 'active' : ''}`}
              onClick={() => handleMenuItemClick('profile')}
            >
              <User size={20} />
              <span>Profile</span>
            </button>

            <button
              className="sidebar-item"
              onClick={handleHomeNavigation}
            >
              <Home size={20} />
              <span>Home</span>
            </button>

            <button
              className={`sidebar-item ${activeMenuItem === 'contact' ? 'active' : ''}`}
              onClick={() => handleMenuItemClick('contact')}
            >
              <HelpCircle size={20} />
              <span>Contact Form</span>
            </button>

            <button
              className={`sidebar-item ${activeMenuItem === 'completeProfile' ? 'active' : ''}`}
              onClick={() => handleMenuItemClick('completeProfile')}
            >
              <FileText size={20} />
              <span>Complete Profile</span>
            </button>
          </div>

          <div className="sidebar-footer">
            <button className="sidebar-logout" onClick={handleLogout}>
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        </div>

        <div className="main-content">
          <section className="dashboard-section">
            <div className="dashboard-container">
              {renderContent()}
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}

export default UserDashboard;