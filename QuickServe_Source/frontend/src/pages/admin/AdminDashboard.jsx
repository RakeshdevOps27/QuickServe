import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';
import api from '../../services/api';

const AdminDashboard = () => {
  const { user, setUser, logout } = useAuth();
  const { currency, setCurrency, format, formatHistorical } = useCurrency();
  const [activeTab, setActiveTab] = useState('analytics');

  // Settings States
  const [settingsName, setSettingsName] = useState(user?.fullName || '');
  const [settingsPhone, setSettingsPhone] = useState(user?.phoneNumber || '');
  const [settingsPassword, setSettingsPassword] = useState('');
  const [settingsConfirmPassword, setSettingsConfirmPassword] = useState('');

  useEffect(() => {
    if (user) {
      setSettingsName(user.fullName || '');
      setSettingsPhone(user.phoneNumber || '');
    }
  }, [user]);

  // Data States
  const [analytics, setAnalytics] = useState(null);
  const [professionals, setProfessionals] = useState([]);
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);

  // Assignment Modal States
  const [selectedBookingForAssign, setSelectedBookingForAssign] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [complaints, setComplaints] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // Category Form Modals States
  const [showCatModal, setShowCatModal] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catImage, setCatImage] = useState('');

  // Service Form Modals States
  const [showServModal, setShowServModal] = useState(false);
  const [editingServ, setEditingServ] = useState(null);
  const [selectedCatId, setSelectedCatId] = useState('');
  const [servName, setServName] = useState('');
  const [servDesc, setServDesc] = useState('');
  const [servPrice, setServPrice] = useState('');
  const [servDuration, setServDuration] = useState('60');
  const [servImage, setServImage] = useState('');

  // Global Alert Message
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const authRes = await api.get('/api/admin/analytics');
      setAnalytics(authRes.data);
    } catch (err) {
      console.error('Failed to load analytics', err);
    }

    try {
      const profRes = await api.get('/api/admin/professionals');
      setProfessionals(profRes.data);
    } catch (err) {
      console.error('Failed to load professionals', err);
    }

    try {
      const catRes = await api.get('/api/customer/categories');
      setCategories(catRes.data);
    } catch (err) {
      console.error('Failed to load categories', err);
    }

    try {
      const servRes = await api.get('/api/customer/services');
      setServices(servRes.data);
    } catch (err) {
      console.error('Failed to load services', err);
    }

    try {
      const bookRes = await api.get('/api/admin/bookings');
      setBookings(bookRes.data);
    } catch (err) {
      console.error('Failed to load bookings', err);
    }

    try {
      const userRes = await api.get('/api/admin/users');
      setUsers(userRes.data);
    } catch (err) {
      console.error('Failed to load users', err);
    }
    fetchComplaints();
    fetchNotifications();
  };

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/api/admin/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.error('Failed to load notifications', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.post('/api/admin/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      triggerAlert('success', 'All system alerts marked as read.');
    } catch (err) {
      triggerAlert('error', 'Action failed.');
    }
  };

  const fetchComplaints = async () => {
    try {
      const res = await api.get('/api/admin/complaints');
      setComplaints(res.data);
    } catch (err) {
      console.error('Failed to load complaints', err);
    }
  };

  const handleResolveComplaint = async (id, notes) => {
    if (!notes || !notes.trim()) return;
    try {
      const res = await api.post(`/api/admin/complaints/${id}/resolve`, null, {
        params: { resolutionNotes: notes }
      });
      setComplaints(complaints.map(c => c.id === id ? res.data : c));
      triggerAlert('success', 'Complaint ticket marked as RESOLVED.');
    } catch (err) {
      triggerAlert('error', 'Failed to resolve complaint ticket.');
    }
  };

  const handleAssignProfessional = async (profId) => {
    if (!selectedBookingForAssign) return;
    try {
      const response = await api.post(`/api/admin/bookings/${selectedBookingForAssign.id}/assign/${profId}`);
      // Refresh bookings
      const bookRes = await api.get('/api/admin/bookings');
      setBookings(bookRes.data);
      setShowAssignModal(false);
      setSelectedBookingForAssign(null);
      triggerAlert('success', 'Professional assigned successfully!');
    } catch (err) {
      triggerAlert('error', err.response?.data?.message || 'Failed to assign professional.');
    }
  };

  const getEligibleProfessionals = (booking) => {
    if (!booking) return [];
    const catName = booking.service.category.name.toUpperCase().replaceAll(/\s+/g, '_');
    return professionals.filter(p => {
      if (p.verificationStatus !== 'VERIFIED') return false;
      const spec = p.specialization;
      if (catName.includes(spec) || spec.includes(catName)) return true;
      if (catName.includes("PLUMB") && spec === "PLUMBING") return true;
      if (catName.includes("ELECT") && spec === "ELECTRICAL") return true;
      if (catName.includes("AC") && spec === "AC_REPAIR") return true;
      if (catName.includes("CLEAN") && spec === "HOME_CLEANING") return true;
      if (catName.includes("BEAUT") && spec === "BEAUTY") return true;
      if (catName.includes("APPLI") && spec === "APPLIANCE_REPAIR") return true;
      if (catName.includes("PAINT") && spec === "PAINTING") return true;
      if (catName.includes("PEST") && spec === "PEST_CONTROL") return true;
      return false;
    });
  };

  const triggerAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (settingsPassword && settingsPassword !== settingsConfirmPassword) {
      triggerAlert('error', 'New passwords do not match.');
      return;
    }

    try {
      const response = await api.put('/api/admin/profile', {
        fullName: settingsName,
        phoneNumber: settingsPhone,
        password: settingsPassword || null
      });

      const updatedUser = response.data;
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      triggerAlert('success', 'Profile updated successfully.');
      setSettingsPassword('');
      setSettingsConfirmPassword('');
    } catch (err) {
      console.error(err);
      triggerAlert('error', 'Failed to update profile settings.');
    }
  };

  const refreshData = async () => {
    try {
      const authRes = await api.get('/api/admin/analytics');
      setAnalytics(authRes.data);

      const profRes = await api.get('/api/admin/professionals');
      setProfessionals(profRes.data);

      const bookRes = await api.get('/api/admin/bookings');
      setBookings(bookRes.data);

      const userRes = await api.get('/api/admin/users');
      setUsers(userRes.data);
    } catch (err) {}
  };

  // Professional Verification Handler
  const handleVerifyProfessional = async (id, status) => {
    try {
      await api.post(`/api/admin/professionals/${id}/verify`, null, {
        params: { status }
      });
      setProfessionals(professionals.map(p => p.id === id ? { ...p, verificationStatus: status } : p));
      triggerAlert('success', 'Professional verification updated to: ' + status);
      refreshData();
    } catch (err) {
      triggerAlert('error', 'Failed to update professional verification.');
    }
  };

  // --- Category CRUD Handlers ---
  const openCategoryModal = (cat = null) => {
    if (cat) {
      setEditingCat(cat);
      setCatName(cat.name);
      setCatDesc(cat.description || '');
      setCatImage(cat.imageUrl || '');
    } else {
      setEditingCat(null);
      setCatName('');
      setCatDesc('');
      setCatImage('');
    }
    setShowCatModal(true);
  };

  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCat) {
        // Edit Category
        const response = await api.put(`/api/admin/categories/${editingCat.id}`, {
          name: catName,
          description: catDesc,
          imageUrl: catImage
        });
        setCategories(categories.map(c => c.id === editingCat.id ? response.data : c));
        triggerAlert('success', 'Category updated successfully!');
      } else {
        // Add Category
        const response = await api.post('/api/admin/categories', {
          name: catName,
          description: catDesc,
          imageUrl: catImage
        });
        setCategories([...categories, response.data]);
        triggerAlert('success', 'Category created successfully!');
      }
      setShowCatModal(false);
      // Refresh services
      const servRes = await api.get('/api/customer/services');
      setServices(servRes.data);
    } catch (err) {
      triggerAlert('error', err.response?.data || 'Failed to submit category.');
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Delete category? This will delete all services under it.')) return;
    try {
      await api.delete(`/api/admin/categories/${id}`);
      setCategories(categories.filter(c => c.id !== id));
      triggerAlert('success', 'Category deleted.');
      // Refresh services
      const servRes = await api.get('/api/customer/services');
      setServices(servRes.data);
    } catch (err) {
      triggerAlert('error', 'Deletion failed.');
    }
  };

  // --- Service CRUD Handlers ---
  const openServiceModal = (serv = null) => {
    if (serv) {
      setEditingServ(serv);
      setSelectedCatId(serv.category.id);
      setServName(serv.name);
      setServDesc(serv.description || '');
      setServPrice(serv.price);
      setServDuration(serv.durationMinutes);
      setServImage(serv.imageUrl || '');
    } else {
      setEditingServ(null);
      setSelectedCatId(categories[0]?.id || '');
      setServName('');
      setServDesc('');
      setServPrice('');
      setServDuration('60');
      setServImage('');
    }
    setShowServModal(true);
  };

  const handleServiceSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingServ) {
        // Edit Service
        const response = await api.put(`/api/admin/services/${editingServ.id}`, {
          name: servName,
          description: servDesc,
          price: parseFloat(servPrice),
          durationMinutes: parseInt(servDuration),
          imageUrl: servImage
        });
        setServices(services.map(s => s.id === editingServ.id ? response.data : s));
        triggerAlert('success', 'Service updated successfully!');
      } else {
        // Add Service
        const response = await api.post(`/api/admin/categories/${selectedCatId}/services`, {
          name: servName,
          description: servDesc,
          price: parseFloat(servPrice),
          durationMinutes: parseInt(servDuration),
          imageUrl: servImage
        });
        setServices([...services, response.data]);
        triggerAlert('success', 'Service created successfully!');
      }
      setShowServModal(false);
    } catch (err) {
      triggerAlert('error', err.response?.data || 'Failed to submit service.');
    }
  };

  const handleDeleteService = async (id) => {
    if (!window.confirm('Delete this service?')) return;
    try {
      await api.delete(`/api/admin/services/${id}`);
      setServices(services.filter(s => s.id !== id));
      triggerAlert('success', 'Service deleted.');
    } catch (err) {
      triggerAlert('error', 'Deletion failed.');
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span>🛠️</span> QuickServe
        </div>
        <div className="sidebar-menu">
          <div className={`sidebar-link ${activeTab === 'analytics' ? 'active' : ''}`} onClick={() => setActiveTab('analytics')}>
            <span>📊</span> Analytics Home
          </div>
          <div className={`sidebar-link ${activeTab === 'verifications' ? 'active' : ''}`} onClick={() => setActiveTab('verifications')}>
            <span>🛡️</span> Verifications ({professionals.filter(p => p.verificationStatus === 'PENDING').length})
          </div>
          <div className={`sidebar-link ${activeTab === 'crud' ? 'active' : ''}`} onClick={() => setActiveTab('crud')}>
            <span>📁</span> Categories & Services
          </div>
          <div className={`sidebar-link ${activeTab === 'bookings' ? 'active' : ''}`} onClick={() => setActiveTab('bookings')}>
            <span>📝</span> All Bookings
          </div>
          <div className={`sidebar-link ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>
            <span>👥</span> Users Audit
          </div>
          <div className={`sidebar-link ${activeTab === 'customers' ? 'active' : ''}`} onClick={() => setActiveTab('customers')}>
            <span>👤</span> Customers List
          </div>
          <div className={`sidebar-link ${activeTab === 'complaints' ? 'active' : ''}`} onClick={() => setActiveTab('complaints')}>
            <span>🎫</span> Support Tickets ({complaints.filter(c => c.status === 'PENDING').length})
          </div>
          <div className={`sidebar-link ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => setActiveTab('notifications')}>
            <span>🔔</span> System Alerts ({notifications.filter(n => !n.isRead && !n.read).length})
          </div>
          <div className={`sidebar-link ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
            <span>⚙️</span> Settings
          </div>
        </div>
        <div className="sidebar-user">
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{user?.fullName}</span>
            <span className="sidebar-user-role">Administrator</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
            <select
              className="form-select"
              style={{ width: '80px', padding: '4px 8px', fontSize: '12px', background: 'rgba(0,0,0,0.3)', color: '#fff', border: '1px solid var(--border)', cursor: 'pointer' }}
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              <option value="INR">₹ INR</option>
              <option value="USD">$ USD</option>
            </select>
            <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={logout}>
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Panel Content */}
      <main className="main-content">
        {alert && (
          <div className={`alert alert-${alert.type === 'error' ? 'danger' : 'success'}`} style={{ position: 'sticky', top: 0, zIndex: 50 }}>
            {alert.message}
          </div>
        )}

        {/* Tab 1: Analytics */}
        {activeTab === 'analytics' && (
          <div>
            <div className="page-header">
              <div>
                <h1 className="page-title">Platform Performance Dashboard</h1>
                <p className="page-subtitle">Aggregate metrics, monthly counts, and wallet revenue</p>
              </div>
            </div>

            {/* Metrics grid */}
            <div className="grid-4" style={{ marginBottom: '40px' }}>
              <div 
                className="card primary" 
                onClick={() => setActiveTab('customers')} 
                style={{ cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(59, 130, 246, 0.2)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div className="stat-card-title">Registered Customers</div>
                <div className="stat-card-value">{analytics?.totalCustomers || 0}</div>
                <div className="stat-card-desc">Active clients onboarded</div>
              </div>
              <div 
                className="card secondary" 
                onClick={() => setActiveTab('verifications')} 
                style={{ cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(139, 92, 246, 0.2)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div className="stat-card-title">Verified Professionals</div>
                <div className="stat-card-value">{analytics?.totalProfessionals || 0}</div>
                <div className="stat-card-desc">Active service providers matching requests</div>
              </div>
              <div 
                className="card success" 
                onClick={() => setActiveTab('bookings')} 
                style={{ cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(16, 185, 129, 0.2)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div className="stat-card-title">Completed Services</div>
                <div className="stat-card-value">{analytics?.completedBookings || 0}</div>
                <div className="stat-card-desc">Success rate: {analytics?.totalBookings > 0 ? ((analytics.completedBookings / analytics.totalBookings) * 100).toFixed(1) : 0}%</div>
              </div>
              <div 
                className="card warning" 
                onClick={() => setActiveTab('bookings')} 
                style={{ cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(245, 158, 11, 0.2)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div className="stat-card-title">Total Platform Revenue</div>
                <div className="stat-card-value">{format(analytics?.totalRevenue || 0)}</div>
                <div className="stat-card-desc">Platform transaction volume</div>
              </div>
            </div>

            {/* Pure CSS Bar Charts showing Monthly Booking Stats */}
            <div className="card" style={{ padding: '32px' }}>
              <h3 style={{ fontSize: '18px', marginBottom: '32px', textAlign: 'left' }}>Monthly Service Booking Load</h3>
              {analytics?.monthlyBookings && Object.keys(analytics.monthlyBookings).length > 0 ? (
                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: '200px', borderBottom: '2px solid var(--border)', paddingBottom: '12px' }}>
                  {Object.entries(analytics.monthlyBookings).map(([month, count]) => {
                    const maxVal = Math.max(...Object.values(analytics.monthlyBookings));
                    const percentage = maxVal > 0 ? (count / maxVal) * 100 : 0;
                    return (
                      <div key={month} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexGrow: 1 }}>
                        <span style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px' }}>{count}</span>
                        <div style={{ 
                          width: '40px', height: `${percentage * 1.5}px`, 
                          background: 'linear-gradient(to top, var(--primary), var(--secondary))',
                          borderRadius: '8px 8px 0 0',
                          boxShadow: 'var(--shadow-glow)'
                        }} />
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>{month}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ padding: '40px', color: 'var(--text-muted)' }}>No monthly booking data recorded.</div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Verifications */}
        {activeTab === 'verifications' && (
          <div>
            <div className="page-header">
              <div>
                <h1 className="page-title">Service Professional Verifications</h1>
                <p className="page-subtitle">Inspect professional credentials, specializations and click approve/reject</p>
              </div>
            </div>

            <div className="card" style={{ padding: '0px', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                    <th style={{ padding: '16px' }}>Name</th>
                    <th style={{ padding: '16px' }}>Specialization</th>
                    <th style={{ padding: '16px' }}>Experience</th>
                    <th style={{ padding: '16px' }}>City</th>
                    <th style={{ padding: '16px' }}>Status</th>
                    <th style={{ padding: '16px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {professionals.map(prof => (
                    <tr key={prof.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <strong>{prof.user.fullName}</strong>
                          <span style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.08)', color: '#94a3b8' }}>
                            Partner ID: QS-PRO-{prof.id}
                          </span>
                        </div>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{prof.user.email}</span><br />
                        {prof.idType && (
                          <span style={{ fontSize: '11px', color: '#8b5cf6', marginTop: '2px', display: 'block' }}>
                            🪪 {prof.idType}: {prof.idNumber}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '16px' }}>{prof.specialization}</td>
                      <td style={{ padding: '16px' }}>{prof.experienceYears} Years</td>
                      <td style={{ padding: '16px' }}>{prof.city}</td>
                      <td style={{ padding: '16px' }}>
                        <span style={{ 
                          fontSize: '11px', padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold',
                          backgroundColor: prof.verificationStatus === 'VERIFIED' ? 'var(--success-glow)' : prof.verificationStatus === 'REJECTED' ? 'var(--danger-glow)' : 'var(--warning-glow)',
                          color: prof.verificationStatus === 'VERIFIED' ? '#10b981' : prof.verificationStatus === 'REJECTED' ? '#ef4444' : '#f59e0b'
                        }}>
                          {prof.verificationStatus}
                        </span>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right', display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        {prof.verificationStatus === 'PENDING' && (
                          <>
                            <button className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => handleVerifyProfessional(prof.id, 'REJECTED')}>Reject</button>
                            <button className="btn btn-success" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => handleVerifyProfessional(prof.id, 'VERIFIED')}>Approve</button>
                          </>
                        )}
                        {prof.verificationStatus !== 'PENDING' && (
                          <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => handleVerifyProfessional(prof.id, 'PENDING')}>Reset Status</button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {professionals.length === 0 && (
                    <tr>
                      <td colSpan="6" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No professional accounts found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Categories & Services Manager */}
        {activeTab === 'crud' && (
          <div>
            <div className="page-header">
              <div>
                <h1 className="page-title">Category & Service Catalogs</h1>
                <p className="page-subtitle">Configure services, descriptions, pricing tier structures</p>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button className="btn btn-secondary" onClick={() => openCategoryModal()}>Add Category</button>
                <button className="btn btn-primary" onClick={() => openServiceModal()} disabled={categories.length === 0}>Add Service</button>
              </div>
            </div>

            {/* Sub-layout: 1 column for Categories, 1 column for Services */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '40px' }}>
              
              {/* Categories CRUD Table */}
              <div>
                <h3 style={{ fontSize: '18px', marginBottom: '16px', textAlign: 'left' }}>Categories</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {categories.map(cat => (
                    <div key={cat.id} className="card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ textAlign: 'left' }}>
                        <strong>{cat.name}</strong>
                        {cat.description && <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{cat.description}</p>}
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => openCategoryModal(cat)}>Edit</button>
                        <button className="btn btn-danger" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => handleDeleteCategory(cat.id)}>Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Services CRUD Table */}
              <div>
                <h3 style={{ fontSize: '18px', marginBottom: '16px', textAlign: 'left' }}>Services List</h3>
                <div className="card" style={{ padding: '0px', overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                        <th style={{ padding: '12px' }}>Service Name</th>
                        <th style={{ padding: '12px' }}>Category</th>
                        <th style={{ padding: '12px' }}>Base Price (Converted)</th>
                        <th style={{ padding: '12px' }}>Duration</th>
                        <th style={{ padding: '12px', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {services.map(serv => (
                        <tr key={serv.id} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '12px' }}>
                            <strong>{serv.name}</strong>
                          </td>
                          <td style={{ padding: '12px' }}>{serv.category.name}</td>
                          <td style={{ padding: '12px', color: '#10b981', fontWeight: 'bold' }}>{format(serv.price)}</td>
                          <td style={{ padding: '12px' }}>{serv.durationMinutes} min</td>
                          <td style={{ padding: '12px', textAlign: 'right', display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                            <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => openServiceModal(serv)}>Edit</button>
                            <button className="btn btn-danger" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => handleDeleteService(serv.id)}>Delete</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: All Bookings Audit List */}
        {activeTab === 'bookings' && (
          <div>
            <div className="page-header">
              <div>
                <h1 className="page-title">All Service Bookings</h1>
                <p className="page-subtitle">Master transaction log audit list</p>
              </div>
            </div>

            <div className="card" style={{ padding: '0px', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '900px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                    <th style={{ padding: '16px' }}>ID</th>
                    <th style={{ padding: '16px' }}>Customer</th>
                    <th style={{ padding: '16px' }}>Service</th>
                    <th style={{ padding: '16px' }}>Professional</th>
                    <th style={{ padding: '16px' }}>Scheduled Date</th>
                    <th style={{ padding: '16px' }}>Status</th>
                    <th style={{ padding: '16px' }}>Price Paid</th>
                    <th style={{ padding: '16px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(book => (
                    <tr key={book.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '16px' }}>#QS-{book.id}</td>
                      <td style={{ padding: '16px' }}>
                        <strong>{book.customer?.fullName || 'N/A'}</strong><br />
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{book.customer?.email || 'N/A'}</span>
                      </td>
                      <td style={{ padding: '16px' }}>{book.service?.name || 'N/A'}</td>
                      <td style={{ padding: '16px' }}>
                        {book.professional ? (
                          <span>{book.professional.fullName || book.professional.email}</span>
                        ) : (
                          <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>Pending assignment</span>
                        )}
                      </td>
                      <td style={{ padding: '16px' }}>{book.bookingDate} ({book.timeSlot?.formattedSlot || 'N/A'})</td>
                      <td style={{ padding: '16px' }}>
                        <span style={{ 
                          fontSize: '11px', padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold',
                          backgroundColor: book.status === 'COMPLETED' ? 'var(--success-glow)' : book.status === 'CANCELLED' ? 'var(--danger-glow)' : 'var(--warning-glow)',
                          color: book.status === 'COMPLETED' ? '#10b981' : book.status === 'CANCELLED' ? '#ef4444' : '#f59e0b'
                        }}>
                          {book.status}
                        </span>
                      </td>
                      <td style={{ padding: '16px', color: '#10b981', fontWeight: 'bold' }}>
                        {formatHistorical(book.price, book.currency, book.exchangeRate)}
                      </td>
                      <td style={{ padding: '16px' }}>
                        {['PENDING', 'REJECTED', 'PROFESSIONAL_ASSIGNED', 'ACCEPTED', 'RESCHEDULED'].includes(book.status) && (
                          <button 
                            className="btn btn-secondary" 
                            style={{ padding: '4px 8px', fontSize: '12px', border: '1px solid var(--primary)', color: 'var(--primary)', background: 'transparent' }}
                            onClick={() => {
                              setSelectedBookingForAssign(book);
                              setShowAssignModal(true);
                            }}
                          >
                            👤 {book.professional ? 'Reassign' : 'Assign'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 5: Users Audit list */}
        {activeTab === 'users' && (
          <div>
            <div className="page-header">
              <div>
                <h1 className="page-title">Users Audit Log</h1>
                <p className="page-subtitle">View and audit all registered system users</p>
              </div>
            </div>

            <div className="card" style={{ padding: '0px', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                    <th style={{ padding: '16px' }}>ID</th>
                    <th style={{ padding: '16px' }}>User Details</th>
                    <th style={{ padding: '16px' }}>System Role</th>
                    <th style={{ padding: '16px' }}>Phone Number</th>
                    <th style={{ padding: '16px' }}>Enabled</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '16px' }}>#USR-{u.id}</td>
                      <td style={{ padding: '16px' }}>
                        <strong>{u.fullName}</strong><br />
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{u.email}</span>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{ 
                          fontSize: '11px', padding: '4px 10px', borderRadius: '12px', fontWeight: 'bold',
                          backgroundColor: u.role === 'ADMIN' ? 'var(--danger-glow)' : u.role === 'PROFESSIONAL' ? 'var(--secondary-glow)' : 'var(--primary-glow)',
                          color: u.role === 'ADMIN' ? '#ef4444' : u.role === 'PROFESSIONAL' ? '#8b5cf6' : '#3b82f6'
                        }}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{ padding: '16px' }}>{u.phoneNumber || 'N/A'}</td>
                      <td style={{ padding: '16px', color: u.enabled ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>
                        {u.enabled ? 'Yes' : 'No'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 6: Customers List & Bookings Placed */}
        {activeTab === 'customers' && (
          <div>
            <div className="page-header">
              <div>
                <h1 className="page-title">Customers Directory</h1>
                <p className="page-subtitle">View active client accounts and monitor their total bookings placed</p>
              </div>
            </div>

            <div className="card" style={{ padding: '0px', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                    <th style={{ padding: '16px' }}>Customer ID</th>
                    <th style={{ padding: '16px' }}>Name</th>
                    <th style={{ padding: '16px' }}>Email Address</th>
                    <th style={{ padding: '16px' }}>Contact Phone</th>
                    <th style={{ padding: '16px', textAlign: 'center' }}>Total Bookings Placed</th>
                  </tr>
                </thead>
                <tbody>
                  {users.filter(u => u.role === 'CUSTOMER').map(u => {
                    const bookingsCount = bookings.filter(b => b.customer.id === u.id).length;
                    return (
                      <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '16px' }}>#CST-{u.id}</td>
                        <td style={{ padding: '16px' }}>
                          <strong>{u.fullName}</strong>
                        </td>
                        <td style={{ padding: '16px' }}>{u.email}</td>
                        <td style={{ padding: '16px' }}>{u.phoneNumber || 'N/A'}</td>
                        <td style={{ padding: '16px', textAlign: 'center' }}>
                          <span style={{ 
                            fontSize: '13px', padding: '4px 12px', borderRadius: '12px', fontWeight: 'bold',
                            backgroundColor: bookingsCount > 0 ? 'var(--primary-glow)' : 'rgba(255,255,255,0.05)',
                            color: bookingsCount > 0 ? '#3b82f6' : 'var(--text-muted)'
                          }}>
                            {bookingsCount} Bookings
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                  {users.filter(u => u.role === 'CUSTOMER').length === 0 && (
                    <tr>
                      <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No customer accounts found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 9: System Notifications & Alerts */}
        {activeTab === 'notifications' && (
          <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h1 className="page-title">System Alerts & Notifications</h1>
                <p className="page-subtitle">Track incoming bookings, matching actions, and partner status logs</p>
              </div>
              {notifications.filter(n => !n.isRead && !n.read).length > 0 && (
                <button className="btn btn-primary" onClick={handleMarkAllRead}>
                  Mark All Read
                </button>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {notifications.map(notif => (
                <div 
                  key={notif.id} 
                  className="card" 
                  style={{ 
                    textAlign: 'left', 
                    opacity: (notif.isRead || notif.read) ? 0.6 : 1, 
                    borderLeft: (notif.isRead || notif.read) ? '4px solid var(--border)' : '4px solid var(--primary)',
                    backgroundColor: (notif.isRead || notif.read) ? 'rgba(255,255,255,0.01)' : 'rgba(59, 130, 246, 0.04)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '15px' }}>{notif.title}</strong>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                      {new Date(notif.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#e2e8f0' }}>{notif.message}</p>
                </div>
              ))}

              {notifications.length === 0 && (
                <div className="card" style={{ padding: '40px', color: '#94a3b8', textAlign: 'center' }}>
                  No system notifications or alerts currently logged.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 7: Admin Settings */}
        {activeTab === 'settings' && (
          <div>
            <div className="page-header">
              <div>
                <h1 className="page-title">Admin Account Settings</h1>
                <p className="page-subtitle">Manage your personal credentials, contact name, and passwords</p>
              </div>
            </div>

            <form onSubmit={handleSaveSettings} className="card" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'left' }}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={settingsName}
                  onChange={(e) => setSettingsName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address (Read-only)</label>
                <input
                  type="email"
                  className="form-input"
                  disabled
                  value={user?.email || ''}
                  style={{ opacity: 0.6, cursor: 'not-allowed' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="text"
                  className="form-input"
                  value={settingsPhone}
                  onChange={(e) => setSettingsPhone(e.target.value)}
                />
              </div>

              <h3 style={{ fontSize: '16px', margin: '24px 0 12px 0', borderBottom: '1px solid var(--border)', paddingBottom: '6px' }}>
                Change Password (Leave blank to keep current)
              </h3>

              <div className="form-group">
                <label className="form-label">New Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={settingsPassword}
                  onChange={(e) => setSettingsPassword(e.target.value)}
                  placeholder="Enter new password"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <input
                  type="password"
                  className="form-input"
                  value={settingsConfirmPassword}
                  onChange={(e) => setSettingsConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '16px' }}>
                Save Account Changes
              </button>
            </form>
          </div>
        )}

        {/* Tab 8: complaints Support resolver */}
        {activeTab === 'complaints' && (
          <div>
            <div className="page-header">
              <div>
                <h1 className="page-title">Support Ticket Complaints</h1>
                <p className="page-subtitle">Track, investigate, and resolve user support queries</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {complaints.map(ticket => (
                <div key={ticket.id} className="card" style={{ textAlign: 'left', borderLeft: '4px solid ' + (ticket.status === 'RESOLVED' ? '#10b981' : (ticket.status === 'INVESTIGATING' ? '#f59e0b' : '#ef4444')) }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '18px', margin: 0 }}>Ticket #{ticket.id}: {ticket.title}</h3>
                    <span style={{ 
                      fontSize: '11px', 
                      backgroundColor: ticket.status === 'RESOLVED' ? 'rgba(16, 185, 129, 0.15)' : (ticket.status === 'INVESTIGATING' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)'),
                      color: ticket.status === 'RESOLVED' ? '#10b981' : (ticket.status === 'INVESTIGATING' ? '#f59e0b' : '#ef4444'),
                      padding: '4px 10px', 
                      borderRadius: '12px',
                      fontWeight: 'bold'
                    }}>
                      {ticket.status}
                    </span>
                  </div>
                  <p style={{ color: '#94a3b8', fontSize: '13px', margin: '4px 0' }}>
                    Customer: <strong>{ticket.customer?.fullName} ({ticket.customer?.email})</strong>
                  </p>
                  <p style={{ color: '#94a3b8', fontSize: '13px', margin: '4px 0' }}>
                    Booking reference: <strong>#QS-{ticket.booking.id} - {ticket.booking.service.name}</strong>
                  </p>
                  <p style={{ fontSize: '14px', marginTop: '10px', color: '#e2e8f0' }}>{ticket.description}</p>
                  
                  {ticket.status !== 'RESOLVED' ? (
                    <form onSubmit={(e) => {
                      e.preventDefault();
                      const notes = e.target.elements.resolutionNotes.value;
                      handleResolveComplaint(ticket.id, notes);
                      e.target.reset();
                    }} style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                      <input 
                        type="text" 
                        name="resolutionNotes" 
                        className="form-input" 
                        required 
                        placeholder="Type resolution description or notes here..." 
                        style={{ margin: 0 }}
                      />
                      <button type="submit" className="btn btn-success" style={{ whiteSpace: 'nowrap' }}>
                        Mark Resolved
                      </button>
                    </form>
                  ) : (
                    <div style={{ marginTop: '16px', backgroundColor: 'rgba(16, 185, 129, 0.08)', padding: '12px 16px', borderRadius: '8px', borderLeft: '3px solid #10b981' }}>
                      <strong style={{ fontSize: '12px', color: '#10b981', textTransform: 'uppercase' }}>Resolution Notes:</strong>
                      <p style={{ fontSize: '13px', margin: '4px 0 0 0', color: '#94a3b8' }}>{ticket.resolutionNotes}</p>
                    </div>
                  )}
                </div>
              ))}

              {complaints.length === 0 && (
                <div className="card" style={{ padding: '40px', color: '#94a3b8', textAlign: 'center' }}>
                  No complaints or support tickets submitted yet.
                </div>
              )}
            </div>
          </div>
        )}

        {/* MODAL 1: ADD/EDIT CATEGORY */}
        {showCatModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '20px' }}>{editingCat ? 'Edit Category' : 'Create Category'}</h3>
                <button className="btn" style={{ background: 'none', border: 'none', fontSize: '20px', color: '#94a3b8' }} onClick={() => setShowCatModal(false)}>&times;</button>
              </div>

              <form onSubmit={handleCategorySubmit}>
                <div className="form-group">
                  <label className="form-label">Category Name</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    placeholder="e.g. AC Repair"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-input"
                    style={{ height: '80px', resize: 'none' }}
                    value={catDesc}
                    onChange={(e) => setCatDesc(e.target.value)}
                    placeholder="Provide a short description..."
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '12px' }}>
                  {editingCat ? 'Save Changes' : 'Create Category'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: ADD/EDIT SERVICE */}
        {showServModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '20px' }}>{editingServ ? 'Edit Service' : 'Create Service'}</h3>
                <button className="btn" style={{ background: 'none', border: 'none', fontSize: '20px', color: '#94a3b8' }} onClick={() => setShowServModal(false)}>&times;</button>
              </div>

              <form onSubmit={handleServiceSubmit}>
                {!editingServ && (
                  <div className="form-group">
                    <label className="form-label">Parent Category</label>
                    <select
                      className="form-select"
                      value={selectedCatId}
                      onChange={(e) => setSelectedCatId(e.target.value)}
                    >
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Service Name</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    value={servName}
                    onChange={(e) => setServName(e.target.value)}
                    placeholder="e.g. Leak Fix"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-input"
                    style={{ height: '80px', resize: 'none' }}
                    value={servDesc}
                    onChange={(e) => setServDesc(e.target.value)}
                    placeholder="e.g. Basic repair of leaking pipelines"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Base Price (INR ₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-input"
                      required
                      value={servPrice}
                      onChange={(e) => setServPrice(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Duration (Mins)</label>
                    <input
                      type="number"
                      className="form-input"
                      required
                      value={servDuration}
                      onChange={(e) => setServDuration(e.target.value)}
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '12px' }}>
                  {editingServ ? 'Save Changes' : 'Create Service'}
                </button>
              </form>
            </div>
          </div>
        )}
        {/* MODAL 3: ASSIGN PROFESSIONAL */}
        {showAssignModal && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ width: '600px', maxHeight: '80vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '20px' }}>Assign Service Professional</h3>
                <button className="btn" style={{ background: 'none', border: 'none', fontSize: '20px', color: '#94a3b8' }} onClick={() => setShowAssignModal(false)}>&times;</button>
              </div>

              <div style={{ backgroundColor: 'rgba(0,0,0,0.1)', padding: '12px', borderRadius: '8px', marginBottom: '20px', textAlign: 'left', fontSize: '13px' }}>
                <strong>Booking Info:</strong> #QS-{selectedBookingForAssign?.id}<br />
                <strong>Service:</strong> {selectedBookingForAssign?.service.name}<br />
                <strong>City:</strong> {selectedBookingForAssign?.address.city}<br />
                <strong>Scheduled Time Slot:</strong> {selectedBookingForAssign?.bookingDate} ({selectedBookingForAssign?.timeSlot.formattedSlot})
              </div>

              <h4 style={{ fontSize: '14px', marginBottom: '12px', textAlign: 'left' }}>Eligible specialized professionals in {selectedBookingForAssign?.address.city}:</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {getEligibleProfessionals(selectedBookingForAssign).map(prof => (
                  <div key={prof.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                    <div style={{ textAlign: 'left' }}>
                      <h4 style={{ margin: 0, fontSize: '15px' }}>{prof.fullName || prof.user?.fullName}</h4>
                      <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>
                        Rating: <strong>⭐ {prof.rating || 'New'}</strong> | Experience: <strong>{prof.experienceYears} Years</strong>
                      </p>
                    </div>
                    <button className="btn btn-primary" onClick={() => handleAssignProfessional(prof.user?.id || prof.id)}>
                      Assign
                    </button>
                  </div>
                ))}

                {getEligibleProfessionals(selectedBookingForAssign).length === 0 && (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                    No verified service professionals currently online/available with specialization in this category for this city.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
