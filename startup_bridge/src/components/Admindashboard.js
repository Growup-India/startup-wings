// AdminDashboard.js - Fully Mobile Responsive
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Users, Building, Search, Download, Eye, Trash2,
  Mail, MapPin, Briefcase, Shield, Activity,
  DollarSign, Calendar, LogOut, RefreshCw, X, FileText, 
  CheckCircle, XCircle, CreditCard, Award, Menu
} from 'lucide-react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const getAuthToken = () => localStorage.getItem('token');
const getAuthHeaders = () => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

const AdminDashboard = ({ user, onLogout }) => {
  const [activeView, setActiveView] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('all');
  const [selectedStage, setSelectedStage] = useState('all');
  const [deletingUsers, setDeletingUsers] = useState(new Set());
  const [viewingProfile, setViewingProfile] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [careerApplications, setCareerApplications] = useState([]);
  const [upgradeRequests, setUpgradeRequests] = useState([]);
  const [viewingCareerApp, setViewingCareerApp] = useState(null);
  const [viewingUpgradeReq, setViewingUpgradeReq] = useState(null);
  const [processingUpgrade, setProcessingUpgrade] = useState(null);
  const [processingCareer, setProcessingCareer] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const [dashboardMetrics, setDashboardMetrics] = useState({
    totalUsers: 0,
    totalStartups: 0,
    completedProfiles: 0,
    pendingProfiles: 0,
    revenueGenerating: 0,
    preRevenue: 0,
    careerApplications: 0,
    pendingUpgrades: 0
  });
  
  const [startupProfiles, setStartupProfiles] = useState([]);
  
  const calculateMetrics = useCallback((profiles) => {
    const completed = profiles.filter(p => 
      p.founderName && p.startupName && p.industry && p.stage && p.description
    ).length;
    
    const withRevenue = profiles.filter(p => 
      p.monthlyRevenue && p.monthlyRevenue !== 'pre-revenue' && p.monthlyRevenue !== ''
    ).length;
    
    return {
      totalStartups: profiles.length,
      completedProfiles: completed,
      pendingProfiles: profiles.length - completed,
      revenueGenerating: withRevenue,
      preRevenue: profiles.length - withRevenue
    };
  }, []);

  const loadData = useCallback(async (signal) => {
    try {
      const token = getAuthToken();
      
      if (!token) {
        alert('Authentication required. Please log in again.');
        onLogout();
        return;
      }

      const [usersResponse, profilesResponse, careerResponse, upgradesResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/admin/users`, { headers: getAuthHeaders(), signal }),
        fetch(`${API_BASE_URL}/api/admin/profiles`, { headers: getAuthHeaders(), signal }),
        fetch(`${API_BASE_URL}/api/admin/career/all`, { headers: getAuthHeaders(), signal }).catch(() => ({ ok: false, json: async () => ({ applications: [] }) })),
        fetch(`${API_BASE_URL}/api/upgrade-requests/admin/all`, { headers: getAuthHeaders(), signal }).catch(() => ({ ok: false, json: async () => ({ requests: [] }) }))
      ]);
      
      if (usersResponse.status === 401 || profilesResponse.status === 401) {
        alert('Session expired. Please log in again.');
        onLogout();
        return;
      }

      if (usersResponse.status === 403 || profilesResponse.status === 403) {
        alert('Access denied. Admin privileges required.');
        onLogout();
        return;
      }
      
      if (!usersResponse.ok || !profilesResponse.ok) {
        const errorData = await usersResponse.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to fetch data');
      }
      
      const usersData = await usersResponse.json();
      const profilesData = await profilesResponse.json();
      const careerData = careerResponse.ok ? await careerResponse.json() : { applications: [] };
      const upgradesData = upgradesResponse.ok ? await upgradesResponse.json() : { requests: [] };
      
      const profiles = profilesData.profiles || [];
      const users = usersData.users || [];
      const validUserIds = new Set(users.map(u => u._id.toString()));
      const validProfiles = profiles.filter(profile => validUserIds.has(profile.userId.toString()));
      
      setStartupProfiles(validProfiles);
      setCareerApplications(careerData.applications || []);
      setUpgradeRequests(upgradesData.requests || []);
      
      const calculatedMetrics = calculateMetrics(validProfiles);
      
      setDashboardMetrics({
        totalUsers: users.length,
        ...calculatedMetrics,
        careerApplications: (careerData.applications || []).length,
        pendingUpgrades: (upgradesData.requests || []).filter(r => r.status === 'pending').length
      });
      
    } catch (error) {
      if (error.name === 'AbortError') return;
      console.error('[ADMIN] Load error:', error);
      alert(`Failed to load dashboard data: ${error.message}`);
    }
  }, [calculateMetrics, onLogout]);

  useEffect(() => {
    const abortController = new AbortController();
    loadData(abortController.signal).finally(() => {
      if (!abortController.signal.aborted) setIsLoading(false);
    });
    return () => abortController.abort();
  }, [loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    const abortController = new AbortController();
    await loadData(abortController.signal);
    if (!abortController.signal.aborted) {
      setTimeout(() => setRefreshing(false), 500);
    }
  };

  const handleDeleteCareerApp = async (appId) => {
    if (!window.confirm('Delete this career application?')) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/career/${appId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (response.status === 401) { alert('Session expired. Please log in again.'); onLogout(); return; }
      if (response.ok) {
        setCareerApplications(prev => prev.filter(a => a._id !== appId));
        setViewingCareerApp(null);
        alert('Application deleted successfully');
      } else {
        const err = await response.json().catch(() => ({}));
        alert(err.message || 'Failed to delete application');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete application');
    }
  };

  const handleApproveCareerApp = async (appId) => {
    if (!window.confirm('Approve this career application?')) return;
    setProcessingCareer(appId);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/career/${appId}/approve`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (response.status === 401) { alert('Session expired.'); onLogout(); return; }
      const data = await response.json().catch(() => ({}));
      if (response.ok) {
        setCareerApplications(prev => prev.map(a => a._id === appId ? { ...a, status: 'approved' } : a));
        setViewingCareerApp(null);
        alert('Application approved successfully.');
      } else {
        alert(data.message || data.error || 'Failed to approve');
      }
    } catch (error) {
      alert('Failed to approve application');
    } finally {
      setProcessingCareer(null);
    }
  };

  const handleRejectCareerApp = async (appId) => {
    const reason = window.prompt('Enter rejection reason (optional):');
    if (reason === null) return;
    if (!window.confirm('Reject this application?')) return;
    setProcessingCareer(appId);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/career/${appId}/reject`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ reason })
      });
      if (response.status === 401) { alert('Session expired.'); onLogout(); return; }
      if (response.ok) {
        setCareerApplications(prev => prev.map(a => a._id === appId ? { ...a, status: 'rejected' } : a));
        setViewingCareerApp(null);
        alert('Application rejected.');
      }
    } catch (error) {
      alert('Failed to reject application');
    } finally {
      setProcessingCareer(null);
    }
  };

  const handleApproveUpgrade = async (requestId) => {
    if (!window.confirm('Approve this upgrade request?')) return;
    setProcessingUpgrade(requestId);
    try {
      const response = await fetch(`${API_BASE_URL}/api/upgrade-requests/admin/${requestId}/approve`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      if (response.status === 401) { alert('Session expired.'); onLogout(); return; }
      if (response.ok) {
        setUpgradeRequests(prev => prev.map(r => r._id === requestId ? { ...r, status: 'approved' } : r));
        setViewingUpgradeReq(null);
        alert('Upgrade approved!');
        handleRefresh();
      }
    } catch (error) {
      alert('Failed to approve upgrade');
    } finally {
      setProcessingUpgrade(null);
    }
  };

  const handleRejectUpgrade = async (requestId) => {
    const reason = window.prompt('Enter rejection reason (optional):');
    if (reason === null) return;
    setProcessingUpgrade(requestId);
    try {
      const response = await fetch(`${API_BASE_URL}/api/upgrade-requests/admin/${requestId}/reject`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ reason })
      });
      if (response.status === 401) { alert('Session expired.'); onLogout(); return; }
      if (response.ok) {
        setUpgradeRequests(prev => prev.map(r => r._id === requestId ? { ...r, status: 'rejected' } : r));
        setViewingUpgradeReq(null);
        alert('Upgrade rejected');
      }
    } catch (error) {
      alert('Failed to reject upgrade');
    } finally {
      setProcessingUpgrade(null);
    }
  };

  const handleUserDeletion = async (profileToDelete) => {
    const userIdToDelete = profileToDelete.userId;
    if (!userIdToDelete || deletingUsers.has(userIdToDelete)) return;
    if (!window.confirm(`Delete ${profileToDelete.startupName || 'this startup'}?\n\nThis action cannot be undone.`)) return;
    if (viewingProfile?.userId === userIdToDelete) setViewingProfile(null);
    setDeletingUsers(prev => new Set([...prev, userIdToDelete]));
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/users/${userIdToDelete}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (response.status === 401) { alert('Session expired.'); onLogout(); return; }
      const result = await response.json();
      if (response.ok && result.success) {
        setStartupProfiles(prevProfiles => {
          const updatedProfiles = prevProfiles.filter(p => p.userId !== userIdToDelete);
          const newMetrics = calculateMetrics(updatedProfiles);
          setDashboardMetrics(prev => ({ ...prev, totalUsers: result.updatedCounts?.totalUsers || prev.totalUsers - 1, ...newMetrics }));
          return updatedProfiles;
        });
        alert(`✅ Successfully deleted`);
      }
    } catch (error) {
      alert(`❌ Failed to delete user`);
    } finally {
      setDeletingUsers(prev => { const next = new Set(prev); next.delete(userIdToDelete); return next; });
    }
  };

  const exportToCSV = () => {
    if (startupProfiles.length === 0) { alert('No data to export'); return; }
    const data = startupProfiles.map(p => ({
      'Founder': p.founderName || 'N/A', 'Startup': p.startupName || 'N/A',
      'Industry': p.industry || 'N/A', 'Stage': p.stage || 'N/A',
      'Location': p.location || 'N/A', 'Team': p.teamSize || 'N/A',
      'Revenue': p.monthlyRevenue || 'N/A', 'Website': p.website || 'N/A',
      'Email': p.userEmail || 'N/A'
    }));
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).map(val => `"${val}"`).join(','));
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `startup_data_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const fetchAndOpenCareerApp = async (appId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/career/${appId}`, { headers: getAuthHeaders() });
      if (response.status === 401) { alert('Session expired.'); onLogout(); return; }
      if (!response.ok) throw new Error('Failed to fetch application');
      const data = await response.json();
      setViewingCareerApp(data.application);
    } catch (error) {
      alert('Failed to fetch application details');
    }
  };

  const downloadCV = async (appId) => {
    try {
      setProcessingCareer(appId);
      const response = await fetch(`${API_BASE_URL}/api/admin/career/${appId}/cv`, {
        method: 'GET',
        headers: { ...(getAuthToken() ? { Authorization: `Bearer ${getAuthToken()}` } : {}) }
      });
      if (response.status === 401) { alert('Session expired.'); onLogout(); return; }
      if (!response.ok) throw new Error('Failed to download CV');
      const blob = await response.blob();
      const filename = viewingCareerApp?.cvOriginalName || `cv_${appId}`;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert('Failed to download CV');
    } finally {
      setProcessingCareer(null);
    }
  };

  const filteredStartups = useMemo(() => {
    return startupProfiles.filter(profile => {
      const matchesSearch = !searchQuery || 
        profile.startupName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        profile.founderName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        profile.userEmail?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesIndustry = selectedIndustry === 'all' || profile.industry === selectedIndustry;
      const matchesStage = selectedStage === 'all' || profile.stage === selectedStage;
      return matchesSearch && matchesIndustry && matchesStage;
    });
  }, [startupProfiles, searchQuery, selectedIndustry, selectedStage]);

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
        <style>{`
          .loading-container { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #f9fafb; }
          .spinner { width: 64px; height: 64px; border: 4px solid #2563eb; border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite; }
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          .loading-container p { color: #6b7280; font-size: 14px; margin-top: 16px; }
        `}</style>
      </div>
    );
  }

  return (
    <>
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; }
        .admin-container { display: flex; min-height: 100vh; background: #f9fafb; position: relative; }
        
        /* Sidebar Styles */
        .sidebar { width: 280px; height: 100vh; background: white; border-right: 1px solid #e5e7eb; display: flex; flex-direction: column; position: fixed; top: 0; left: 0; z-index: 50; overflow-y: auto; transition: transform 0.3s ease; }
        .sidebar-content { padding: 24px; }
        .sidebar-header { display: flex; align-items: center; gap: 12px; margin-bottom: 32px; }
        .sidebar-icon { width: 40px; height: 40px; background: linear-gradient(135deg, #2563eb, #9333ea); border-radius: 8px; display: flex; align-items: center; justify-content: center; }
        .sidebar-title { font-size: 18px; font-weight: 700; color: #1f2937; }
        .sidebar-subtitle { font-size: 12px; color: #6b7280; display: flex; align-items: center; gap: 4px; }
        .sidebar-nav { display: flex; flex-direction: column; gap: 8px; }
        .nav-button { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 8px; border: none; background: transparent; color: #6b7280; cursor: pointer; font-weight: 500; font-size: 14px; width: 100%; text-align: left; transition: all 0.2s; }
        .nav-button:hover { background: #f3f4f6; }
        .nav-button.active { background: linear-gradient(to right, #eff6ff, #f3e8ff); color: #2563eb; font-weight: 600; }
        .sidebar-footer { margin-top: auto; padding: 24px; border-top: 1px solid #e5e7eb; }
        .user-info { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
        .user-avatar { width: 40px; height: 40px; background: linear-gradient(135deg, #dbeafe, #e0e7ff); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 600; color: #2563eb; }
        .user-details { flex: 1; min-width: 0; }
        .user-name { font-size: 14px; font-weight: 600; color: #1f2937; margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .user-email { font-size: 12px; color: #6b7280; margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .logout-button { width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 10px; border-radius: 8px; border: none; background: linear-gradient(to right, #ef4444, #dc2626); color: white; cursor: pointer; font-weight: 600; font-size: 14px; }
        
        /* Main Content */
        .main-content { flex: 1; margin-left: 280px; padding: 20px; overflow-y: auto; width: calc(100% - 280px); }
        .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; flex-wrap: wrap; gap: 16px; }
        .page-title { font-size: 28px; font-weight: 700; color: #1f2937; margin: 0 0 8px 0; }
        .page-subtitle { color: #6b7280; margin: 0; font-size: 14px; }
        .header-actions { display: flex; gap: 12px; flex-wrap: wrap; }
        .btn { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 10px 20px; border-radius: 8px; border: none; color: white; cursor: pointer; font-weight: 600; font-size: 14px; transition: opacity 0.2s; }
        .btn:disabled { cursor: not-allowed; opacity: 0.5; }
        .btn-primary { background: linear-gradient(to right, #2563eb, #9333ea); }
        .btn-secondary { background: linear-gradient(to right, #6366f1, #8b5cf6); }
        .btn-danger { background: linear-gradient(to right, #ef4444, #dc2626); }
        .btn-success { background: linear-gradient(to right, #10b981, #059669); }
        
        /* Stats Grid */
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 16px; margin-bottom: 24px; }
        .stat-card { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .stat-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
        .stat-label { font-size: 13px; color: #6b7280; font-weight: 500; }
        .stat-icon { width: 40px; height: 40px; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
        .stat-value { font-size: 32px; font-weight: 700; color: #1f2937; margin: 0; }
        
        /* Filters */
        .filters { display: flex; gap: 12px; margin-bottom: 20px; flex-wrap: wrap; }
        .search-wrapper { position: relative; flex: 1; min-width: 250px; }
        .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #9ca3af; pointer-events: none; }
        .search-input { width: 100%; padding: 12px 12px 12px 44px; border-radius: 8px; border: 1px solid #e5e7eb; font-size: 14px; }
        .select { padding: 12px 16px; border-radius: 8px; border: 1px solid #e5e7eb; font-size: 14px; cursor: pointer; min-width: 150px; }
        
        /* Cards Grid */
        .cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
        .card { background: white; border-radius: 12px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; gap: 8px; }
        .card-title { font-size: 18px; font-weight: 700; color: #1f2937; margin: 0 0 4px 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; min-width: 0; }
        .card-subtitle { font-size: 14px; color: #6b7280; margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .badge { padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 500; white-space: nowrap; }
        .card-body { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
        .card-info { display: flex; align-items: center; gap: 8px; }
        .card-info-text { font-size: 14px; color: #6b7280; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; }
        .card-actions { display: flex; gap: 8px; }
        .icon-btn { padding: 10px; border-radius: 8px; border: none; color: white; cursor: pointer; }
        
        /* Empty State */
        .empty-state { text-align: center; padding: 60px 20px; background: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .empty-icon { color: #d1d5db; margin: 0 auto 16px; }
        .empty-title { font-size: 18px; font-weight: 600; color: #1f2937; margin-bottom: 8px; }
        .empty-text { color: #6b7280; }
        
        /* Modal */
        .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; z-index: 60; padding: 16px; }
        .modal { width: 100%; max-width: 720px; max-height: 90vh; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.3); display: flex; flex-direction: column; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid #eef2ff; flex-shrink: 0; }
        .modal-title { margin: 0; font-size: 20px; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; min-width: 0; }
        .modal-subtitle { margin: 0; font-size: 13px; color: #6b7280; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .modal-close { border: none; background: transparent; cursor: pointer; padding: 8px; }
        .modal-body { padding: 16px 20px; overflow-y: auto; flex: 1; }
        .modal-footer { padding: 12px 20px; border-top: 1px solid #eef2ff; display: flex; gap: 8px; flex-shrink: 0; flex-wrap: wrap; }
        .info-row { margin-bottom: 12px; }
        .info-label { font-size: 12px; color: #6b7280; margin-bottom: 4px; }
        .info-value { font-weight: 600; font-size: 14px; word-break: break-word; }
        
        /* Mobile Menu */
        .mobile-menu-btn { display: none; position: fixed; top: 16px; left: 16px; z-index: 30; padding: 10px; border-radius: 8px; border: none; background: linear-gradient(to right, #2563eb, #9333ea); color: white; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.15); }
        .sidebar-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 40; }
        
        /* Responsive Breakpoints */
        @media (max-width: 1024px) {
          .stats-grid { grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); }
          .cards-grid { grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); }
        }
        
        @media (max-width: 768px) {
          .sidebar { transform: translateX(-100%); }
          .sidebar.open { transform: translateX(0); }
          .sidebar-overlay.open { display: block; }
          .main-content { margin-left: 0; width: 100%; padding: 16px; padding-top: 60px; }
          .mobile-menu-btn { display: block; }
          .page-title { font-size: 22px; }
          .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 12px; }
          .stat-card { padding: 16px; }
          .stat-value { font-size: 24px; }
          .stat-icon { width: 32px; height: 32px; }
          .cards-grid { grid-template-columns: 1fr; gap: 16px; }
          .filters { flex-direction: column; }
          .search-wrapper { width: 100%; min-width: 100%; }
          .select { width: 100%; }
          .header-actions { width: 100%; }
          .btn { flex: 1; min-width: 120px; }
          .modal { max-width: 100%; margin: 0; border-radius: 12px; }
          .modal-title { font-size: 18px; }
          .card-actions { flex-direction: column; }
        }
        
        @media (max-width: 480px) {
          .page-title { font-size: 20px; }
          .page-subtitle { font-size: 13px; }
          .stats-grid { grid-template-columns: 1fr; }
          .stat-value { font-size: 28px; }
          .card { padding: 16px; }
          .card-title { font-size: 16px; }
          .btn { padding: 10px 16px; font-size: 13px; }
          .modal-body { padding: 12px 16px; }
          .modal-footer { padding: 10px 16px; }
        }
        
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>

      <div className="admin-container">
        {/* Sidebar Overlay */}
        <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />
        
        {/* Mobile Menu Button */}
        <button className="mobile-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
          <Menu size={20} />
        </button>

        {/* Sidebar */}
        <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-content">
            <div className="sidebar-header">
              <div className="sidebar-icon">
                <Shield size={20} color="white" />
              </div>
              <div>
                <div className="sidebar-title">Admin Portal</div>
                <div className="sidebar-subtitle">
                  <Shield size={12} /> System Administrator
                </div>
              </div>
            </div>

            <div className="sidebar-nav">
              {[
                { id: 'dashboard', label: 'Dashboard', icon: Activity },
                { id: 'startups', label: 'All Startups', icon: Users },
                { id: 'career', label: 'Career Apps', icon: FileText },
                { id: 'upgrades', label: 'Upgrade Requests', icon: Award }
              ].map(item => (
                <button 
                  key={item.id} 
                  onClick={() => { setActiveView(item.id); setSidebarOpen(false); }} 
                  className={`nav-button ${activeView === item.id ? 'active' : ''}`}
                >
                  <item.icon size={20} />
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {user && (
            <div className="sidebar-footer">
              <div className="user-info">
                <div className="user-avatar">
                  {user.name?.charAt(0).toUpperCase() || 'A'}
                </div>
                <div className="user-details">
                  <p className="user-name">{user.name || 'Admin'}</p>
                  <p className="user-email">{user.email}</p>
                </div>
              </div>
              <button onClick={onLogout} className="logout-button">
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          )}
        </aside>

        {/* Main Content */}
        <main className="main-content">
          {activeView === 'dashboard' && (
            <div>
              <div className="page-header">
                <div>
                  <h1 className="page-title">Dashboard Overview</h1>
                  <p className="page-subtitle">Monitor startup ecosystem metrics</p>
                </div>
                <div className="header-actions">
                  <button onClick={handleRefresh} disabled={refreshing} className="btn btn-secondary">
                    <RefreshCw size={18} className={refreshing ? 'spin' : ''} />
                    Refresh
                  </button>
                  <button onClick={exportToCSV} disabled={startupProfiles.length === 0} className="btn btn-primary">
                    <Download size={18} />
                    Export
                  </button>
                </div>
              </div>

              <div className="stats-grid">
                {[
                  { label: 'Users', value: dashboardMetrics.totalUsers, icon: Users, gradient: 'linear-gradient(135deg, #667eea, #764ba2)' },
                  { label: 'Startups', value: dashboardMetrics.totalStartups, icon: Building, gradient: 'linear-gradient(135deg, #f093fb, #f5576c)' },
                  { label: 'Career Apps', value: dashboardMetrics.careerApplications, icon: FileText, gradient: 'linear-gradient(135deg, #4facfe, #00f2fe)' },
                  { label: 'Upgrades', value: dashboardMetrics.pendingUpgrades, icon: Award, gradient: 'linear-gradient(135deg, #fa709a, #fee140)' },
                  { label: 'Revenue', value: dashboardMetrics.revenueGenerating, icon: DollarSign, gradient: 'linear-gradient(135deg, #30cfd0, #330867)' },
                  { label: 'Pre-Revenue', value: dashboardMetrics.preRevenue, icon: Activity, gradient: 'linear-gradient(135deg, #a8edea, #fed6e3)' }
                ].map((stat, idx) => (
                  <div key={idx} className="stat-card">
                    <div className="stat-header">
                      <span className="stat-label">{stat.label}</span>
                      <div className="stat-icon" style={{ background: stat.gradient }}>
                        <stat.icon size={20} color="white" />
                      </div>
                    </div>
                    <p className="stat-value">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeView === 'startups' && (
            <div>
              <div className="page-header">
                <div>
                  <h1 className="page-title">Startup Portfolio</h1>
                  <p className="page-subtitle">Manage all registered startups ({filteredStartups.length})</p>
                </div>
                <button onClick={handleRefresh} disabled={refreshing} className="btn btn-secondary">
                  <RefreshCw size={18} className={refreshing ? 'spin' : ''} />
                  Refresh
                </button>
              </div>

              <div className="filters">
                <div className="search-wrapper">
                  <Search size={20} className="search-icon" />
                  <input 
                    type="text" 
                    placeholder="Search by startup, founder, email..." 
                    value={searchQuery} 
                    onChange={(e) => setSearchQuery(e.target.value)} 
                    className="search-input"
                  />
                </div>
                
                <select value={selectedIndustry} onChange={(e) => setSelectedIndustry(e.target.value)} className="select">
                  <option value="all">All Industries</option>
                  <option value="technology">Technology</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="fintech">Fintech</option>
                  <option value="ecommerce">E-commerce</option>
                  <option value="education">Education</option>
                  <option value="food">Food & Beverage</option>
                  <option value="other">Other</option>
                </select>

                <select value={selectedStage} onChange={(e) => setSelectedStage(e.target.value)} className="select">
                  <option value="all">All Stages</option>
                  <option value="idea">Idea Stage</option>
                  <option value="validation">Validation</option>
                  <option value="mvp">MVP Development</option>
                  <option value="launch">Pre-Launch</option>
                  <option value="growth">Growth Stage</option>
                </select>
              </div>

              <div className="cards-grid">
                {filteredStartups.map((profile) => (
                  <div key={profile._id} className="card">
                    <div className="card-header">
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 className="card-title">{profile.startupName || 'Unnamed Startup'}</h3>
                        <p className="card-subtitle">{profile.founderName || 'N/A'}</p>
                      </div>
                      <span className="badge" style={{ background: '#eff6ff', color: '#2563eb' }}>
                        {profile.industry || 'N/A'}
                      </span>
                    </div>

                    <div className="card-body">
                      <div className="card-info">
                        <Mail size={16} style={{ color: '#9ca3af', flexShrink: 0 }} />
                        <span className="card-info-text">{profile.userEmail || 'N/A'}</span>
                      </div>
                      <div className="card-info">
                        <MapPin size={16} style={{ color: '#9ca3af', flexShrink: 0 }} />
                        <span className="card-info-text">{profile.location || 'N/A'}</span>
                      </div>
                      <div className="card-info">
                        <Briefcase size={16} style={{ color: '#9ca3af', flexShrink: 0 }} />
                        <span className="card-info-text">{profile.stage || 'N/A'}</span>
                      </div>
                    </div>

                    <div className="card-actions">
                      <button onClick={() => setViewingProfile(profile)} className="btn btn-primary" style={{ flex: 1 }}>
                        <Eye size={16} />
                        View
                      </button>
                      <button 
                        onClick={() => handleUserDeletion(profile)} 
                        disabled={deletingUsers.has(profile.userId)} 
                        className="icon-btn btn-danger"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {filteredStartups.length === 0 && (
                <div className="empty-state">
                  <Building size={48} className="empty-icon" />
                  <h3 className="empty-title">No startups found</h3>
                  <p className="empty-text">Try adjusting your search filters</p>
                </div>
              )}
            </div>
          )}

          {activeView === 'career' && (
            <div>
              <div className="page-header">
                <div>
                  <h1 className="page-title">Career Applications</h1>
                  <p className="page-subtitle">Manage job applications ({careerApplications.length})</p>
                </div>
                <button onClick={handleRefresh} disabled={refreshing} className="btn btn-secondary">
                  <RefreshCw size={18} className={refreshing ? 'spin' : ''} />
                  Refresh
                </button>
              </div>

              <div className="cards-grid">
                {careerApplications.map((app) => (
                  <div key={app._id} className="card">
                    <div className="card-header">
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 className="card-title">{app.firstName} {app.lastName}</h3>
                        <p className="card-subtitle">{app.jobRole}</p>
                      </div>
                      <span className="badge" style={{ 
                        background: app.status === 'pending' ? '#fef3c7' : app.status === 'approved' ? '#d1fae5' : '#fee2e2',
                        color: app.status === 'pending' ? '#92400e' : app.status === 'approved' ? '#065f46' : '#991b1b'
                      }}>
                        {app.status || 'Pending'}
                      </span>
                    </div>

                    <div className="card-body">
                      <div className="card-info">
                        <Mail size={16} style={{ color: '#9ca3af', flexShrink: 0 }} />
                        <span className="card-info-text">{app.email}</span>
                      </div>
                      <div className="card-info">
                        <MapPin size={16} style={{ color: '#9ca3af', flexShrink: 0 }} />
                        <span className="card-info-text">{app.address}, {app.pincode}</span>
                      </div>
                      <div className="card-info">
                        <Calendar size={16} style={{ color: '#9ca3af', flexShrink: 0 }} />
                        <span className="card-info-text">{new Date(app.appliedAt || app.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="card-actions">
                      <button onClick={() => fetchAndOpenCareerApp(app._id)} className="btn btn-primary" style={{ flex: 1 }}>
                        <Eye size={16} />
                        View
                      </button>
                      <button onClick={() => handleDeleteCareerApp(app._id)} className="icon-btn btn-danger">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {careerApplications.length === 0 && (
                <div className="empty-state">
                  <FileText size={48} className="empty-icon" />
                  <h3 className="empty-title">No applications yet</h3>
                  <p className="empty-text">Career applications will appear here</p>
                </div>
              )}
            </div>
          )}

          {activeView === 'upgrades' && (
            <div>
              <div className="page-header">
                <div>
                  <h1 className="page-title">Upgrade Requests</h1>
                  <p className="page-subtitle">Manage Pro membership requests ({upgradeRequests.length})</p>
                </div>
                <button onClick={handleRefresh} disabled={refreshing} className="btn btn-secondary">
                  <RefreshCw size={18} className={refreshing ? 'spin' : ''} />
                  Refresh
                </button>
              </div>

              <div className="cards-grid">
                {upgradeRequests.map((req) => (
                  <div key={req._id} className="card" style={{ border: req.status === 'pending' ? '2px solid #fbbf24' : 'none' }}>
                    <div className="card-header">
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 className="card-title">{req.userName}</h3>
                        <p className="card-subtitle">{req.userEmail}</p>
                      </div>
                      <span className="badge" style={{ 
                        background: req.status === 'pending' ? '#fef3c7' : req.status === 'approved' ? '#d1fae5' : '#fee2e2',
                        color: req.status === 'pending' ? '#92400e' : req.status === 'approved' ? '#065f46' : '#991b1b'
                      }}>
                        {req.status === 'pending' ? 'Pending' : req.status === 'approved' ? 'Approved' : 'Rejected'}
                      </span>
                    </div>

                    <div className="card-body">
                      <div className="card-info">
                        <Award size={16} style={{ color: '#9ca3af', flexShrink: 0 }} />
                        <span className="card-info-text" style={{ fontWeight: 600 }}>
                          {req.planType === 'monthly' ? 'Monthly Plan' : req.planType === 'quarterly' ? 'Quarterly Plan' : 'Yearly Plan'}
                        </span>
                      </div>
                      <div className="card-info">
                        <CreditCard size={16} style={{ color: '#9ca3af', flexShrink: 0 }} />
                        <span className="card-info-text">{req.paymentMethod || 'Offline'}</span>
                      </div>
                      {req.transactionId && (
                        <div className="card-info">
                          <FileText size={16} style={{ color: '#9ca3af', flexShrink: 0 }} />
                          <span className="card-info-text" style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                            {req.transactionId}
                          </span>
                        </div>
                      )}
                      <div className="card-info">
                        <Calendar size={16} style={{ color: '#9ca3af', flexShrink: 0 }} />
                        <span className="card-info-text">{new Date(req.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {req.status === 'pending' ? (
                      <div className="card-actions">
                        <button 
                          onClick={() => handleApproveUpgrade(req._id)} 
                          disabled={processingUpgrade === req._id} 
                          className="btn btn-success" 
                          style={{ flex: 1 }}
                        >
                          <CheckCircle size={16} />
                          Approve
                        </button>
                        <button 
                          onClick={() => handleRejectUpgrade(req._id)} 
                          disabled={processingUpgrade === req._id} 
                          className="btn btn-danger"
                          style={{ flex: 1 }}
                        >
                          <XCircle size={16} />
                          Reject
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => setViewingUpgradeReq(req)} className="btn btn-primary" style={{ width: '100%' }}>
                        <Eye size={16} />
                        View Details
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {upgradeRequests.length === 0 && (
                <div className="empty-state">
                  <Award size={48} className="empty-icon" />
                  <h3 className="empty-title">No upgrade requests</h3>
                  <p className="empty-text">Upgrade requests will appear here</p>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Career Application Modal */}
      {viewingCareerApp && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <div style={{ flex: 1, minWidth: 0 }}>
                <h2 className="modal-title">{viewingCareerApp.firstName} {viewingCareerApp.lastName}</h2>
                <p className="modal-subtitle">{viewingCareerApp.jobRole || 'Applied Role'}</p>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span className="badge" style={{ 
                  background: viewingCareerApp.status === 'pending' ? '#fef3c7' : viewingCareerApp.status === 'approved' ? '#d1fae5' : '#fee2e2',
                  color: viewingCareerApp.status === 'pending' ? '#92400e' : viewingCareerApp.status === 'approved' ? '#065f46' : '#991b1b'
                }}>
                  {viewingCareerApp.status ? viewingCareerApp.status.charAt(0).toUpperCase() + viewingCareerApp.status.slice(1) : 'Pending'}
                </span>
                <button onClick={() => setViewingCareerApp(null)} className="modal-close">
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="modal-body">
              <div className="info-row">
                <div className="info-label">Email</div>
                <div className="info-value">{viewingCareerApp.email}</div>
              </div>
              <div className="info-row">
                <div className="info-label">Phone</div>
                <div className="info-value">{viewingCareerApp.phone || 'N/A'}</div>
              </div>
              <div className="info-row">
                <div className="info-label">Location</div>
                <div className="info-value">{viewingCareerApp.address ? `${viewingCareerApp.address}, ${viewingCareerApp.pincode || ''}` : 'N/A'}</div>
              </div>
              <div className="info-row">
                <div className="info-label">Applied On</div>
                <div className="info-value">{new Date(viewingCareerApp.appliedAt || viewingCareerApp.createdAt || Date.now()).toLocaleString()}</div>
              </div>
              {viewingCareerApp.hasCv && (
                <div className="info-row">
                  <div className="info-label">Resume</div>
                  <button
                    onClick={() => downloadCV(viewingCareerApp._id)}
                    disabled={processingCareer === viewingCareerApp._id}
                    className="btn btn-primary"
                    style={{ width: '100%', marginTop: 8 }}
                  >
                    <Download size={16} />
                    {processingCareer === viewingCareerApp._id ? 'Downloading...' : 'Download CV'}
                  </button>
                </div>
              )}
              {viewingCareerApp.coverLetter && (
                <div className="info-row">
                  <div className="info-label">Cover Letter</div>
                  <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, whiteSpace: 'pre-wrap', fontSize: 13, maxHeight: 200, overflowY: 'auto' }}>
                    {viewingCareerApp.coverLetter}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              {viewingCareerApp.status === 'pending' ? (
                <>
                  <button
                    onClick={() => handleApproveCareerApp(viewingCareerApp._id)}
                    disabled={processingCareer === viewingCareerApp._id}
                    className="btn btn-success"
                    style={{ flex: 1 }}
                  >
                    <CheckCircle size={16} />
                    {processingCareer === viewingCareerApp._id ? 'Approving...' : 'Approve'}
                  </button>
                  <button
                    onClick={() => handleRejectCareerApp(viewingCareerApp._id)}
                    disabled={processingCareer === viewingCareerApp._id}
                    className="btn btn-danger"
                    style={{ flex: 1 }}
                  >
                    <XCircle size={16} />
                    {processingCareer === viewingCareerApp._id ? 'Rejecting...' : 'Reject'}
                  </button>
                </>
              ) : (
                <button onClick={() => setViewingCareerApp(null)} className="btn btn-primary" style={{ flex: 1 }}>
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Upgrade Request Modal */}
      {viewingUpgradeReq && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 className="modal-title">{viewingUpgradeReq.userName}</h3>
                <p className="modal-subtitle">{viewingUpgradeReq.userEmail}</p>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span className="badge" style={{ 
                  background: viewingUpgradeReq.status === 'pending' ? '#fef3c7' : viewingUpgradeReq.status === 'approved' ? '#d1fae5' : '#fee2e2',
                  color: viewingUpgradeReq.status === 'pending' ? '#92400e' : viewingUpgradeReq.status === 'approved' ? '#065f46' : '#991b1b'
                }}>
                  {viewingUpgradeReq.status ? viewingUpgradeReq.status.charAt(0).toUpperCase() + viewingUpgradeReq.status.slice(1) : 'Pending'}
                </span>
                <button onClick={() => setViewingUpgradeReq(null)} className="modal-close">
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="modal-body">
              <div className="info-row">
                <div className="info-label">Plan</div>
                <div className="info-value">{viewingUpgradeReq.planType === 'monthly' ? 'Monthly' : viewingUpgradeReq.planType === 'quarterly' ? 'Quarterly' : 'Yearly'}</div>
              </div>
              <div className="info-row">
                <div className="info-label">Payment Method</div>
                <div className="info-value">{viewingUpgradeReq.paymentMethod || 'Offline'}</div>
              </div>
              {viewingUpgradeReq.transactionId && (
                <div className="info-row">
                  <div className="info-label">Transaction ID</div>
                  <div className="info-value" style={{ fontFamily: 'monospace' }}>{viewingUpgradeReq.transactionId}</div>
                </div>
              )}
              {viewingUpgradeReq.notes && (
                <div className="info-row">
                  <div className="info-label">Notes</div>
                  <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, whiteSpace: 'pre-wrap', fontSize: 13 }}>
                    {viewingUpgradeReq.notes}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              {viewingUpgradeReq.status === 'pending' ? (
                <>
                  <button onClick={() => handleApproveUpgrade(viewingUpgradeReq._id)} disabled={processingUpgrade === viewingUpgradeReq._id} className="btn btn-success" style={{ flex: 1 }}>
                    Approve
                  </button>
                  <button onClick={() => handleRejectUpgrade(viewingUpgradeReq._id)} disabled={processingUpgrade === viewingUpgradeReq._id} className="btn btn-danger" style={{ flex: 1 }}>
                    Reject
                  </button>
                </>
              ) : (
                <button onClick={() => setViewingUpgradeReq(null)} className="btn btn-primary" style={{ flex: 1 }}>
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminDashboard;