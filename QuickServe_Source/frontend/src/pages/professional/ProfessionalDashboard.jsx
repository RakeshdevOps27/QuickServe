import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';
import api from '../../services/api';

const ProfessionalDashboard = () => {
  const { user, setUser, logout } = useAuth();
  const { currency, setCurrency, format, formatHistorical } = useCurrency();
  const [activeTab, setActiveTab] = useState('jobs');

  const bookingsHistoryRef = useRef(null);
  const reviewsRef = useRef(null);

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
  const [profile, setProfile] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [earnings, setEarnings] = useState(null);
  const [notifications, setNotifications] = useState([]);

  // Form Fields for Profile Edit
  const [editBio, setEditBio] = useState('');
  const [editSpecialization, setEditSpecialization] = useState('PLUMBING');
  const [editExperience, setEditExperience] = useState(0);
  const [editCity, setEditCity] = useState('');
  const [editArea, setEditArea] = useState('');

  // Job Completion Modal States
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [completeBookingId, setCompleteBookingId] = useState(null);
  const [materialChargesInput, setMaterialChargesInput] = useState('');
  const [workDetailsInput, setWorkDetailsInput] = useState('');

  // Global Alert Message
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const profRes = await api.get('/api/professional/profile');
      setProfile(profRes.data);
      setEditBio(profRes.data.bio || '');
      setEditSpecialization(profRes.data.specialization || 'PLUMBING');
      setEditExperience(profRes.data.experienceYears || 0);
      setEditCity(profRes.data.city || '');
      setEditArea(profRes.data.serviceArea || '');

      const bookRes = await api.get('/api/professional/bookings');
      setBookings(bookRes.data);

      const earnRes = await api.get('/api/professional/earnings');
      setEarnings(earnRes.data);

      const notifRes = await api.get('/api/professional/notifications');
      setNotifications(notifRes.data);
    } catch (err) {
      triggerAlert('error', 'Failed to retrieve professional data.');
    }
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
      const response = await api.put('/api/professional/profile-account', {
        fullName: settingsName,
        phoneNumber: settingsPhone,
        password: settingsPassword || null
      });

      const updatedUser = response.data;
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      triggerAlert('success', 'Account settings updated successfully.');
      setSettingsPassword('');
      setSettingsConfirmPassword('');
    } catch (err) {
      console.error(err);
      triggerAlert('error', 'Failed to update account settings.');
    }
  };

  // Toggle Availability Handler
  const handleToggleAvailability = async () => {
    try {
      const response = await api.post('/api/professional/profile/availability');
      setProfile(response.data);
      triggerAlert('success', 'Availability updated to: ' + response.data.availabilityStatus);
    } catch (err) {
      triggerAlert('error', 'Failed to toggle availability.');
    }
  };

  // Update Profile Handler
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const response = await api.put('/api/professional/profile', {
        specialization: editSpecialization,
        experienceYears: parseInt(editExperience) || 0,
        bio: editBio,
        city: editCity,
        serviceArea: editArea
      });
      setProfile(response.data);
      triggerAlert('success', 'Profile updated successfully!');
    } catch (err) {
      triggerAlert('error', 'Failed to update profile.');
    }
  };

  // Accept Booking Handler
  const handleAcceptBooking = async (id) => {
    try {
      const response = await api.post(`/api/professional/bookings/${id}/accept`);
      setBookings(bookings.map(b => b.id === id ? response.data : b));
      triggerAlert('success', 'Booking accepted!');
      refreshEarnings();
    } catch (err) {
      triggerAlert('error', 'Failed to accept booking.');
    }
  };

  // Reject Booking Handler
  const handleRejectBooking = async (id) => {
    try {
      await api.post(`/api/professional/bookings/${id}/reject`);
      setBookings(bookings.filter(b => b.id !== id));
      triggerAlert('success', 'Booking request rejected/reassigned.');
      refreshEarnings();
    } catch (err) {
      triggerAlert('error', 'Failed to reject booking.');
    }
  };

  // On The Way Handler
  const handleMarkOnTheWay = async (id) => {
    try {
      const response = await api.post(`/api/professional/bookings/${id}/on-the-way`);
      setBookings(bookings.map(b => b.id === id ? response.data : b));
      triggerAlert('success', 'Status updated: ON THE WAY');
    } catch (err) {
      triggerAlert('error', 'Failed to update status.');
    }
  };

  // Arrive Handler
  const handleMarkArrived = async (id) => {
    try {
      const response = await api.post(`/api/professional/bookings/${id}/arrive`);
      setBookings(bookings.map(b => b.id === id ? response.data : b));
      triggerAlert('success', 'Status updated: ARRIVED');
    } catch (err) {
      triggerAlert('error', 'Failed to update status.');
    }
  };

  // Start Service Handler
  const handleStartService = async (id) => {
    try {
      const response = await api.post(`/api/professional/bookings/${id}/start`);
      setBookings(bookings.map(b => b.id === id ? response.data : b));
      triggerAlert('success', 'Service status: IN_PROGRESS');
    } catch (err) {
      triggerAlert('error', 'Failed to start service.');
    }
  };

  // Complete Service Handler (Submit Modal Form)
  const handleCompleteServiceSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post(`/api/professional/bookings/${completeBookingId}/complete`, null, {
        params: {
          materialCharges: materialChargesInput || 0,
          workDetails: workDetailsInput
        }
      });
      setBookings(bookings.map(b => b.id === completeBookingId ? response.data : b));
      setShowCompleteModal(false);
      setMaterialChargesInput('');
      setWorkDetailsInput('');
      triggerAlert('success', 'Service status: COMPLETED! Please collect payment.');
      refreshEarnings();
    } catch (err) {
      triggerAlert('error', 'Failed to complete service.');
    }
  };

  // Confirm Cash Payment Handler (COD)
  const handleConfirmPayment = async (id) => {
    try {
      await api.post(`/api/professional/bookings/${id}/confirm-payment`);
      triggerAlert('success', 'Cash payment confirmed!');
      // Refresh list
      const bookRes = await api.get('/api/professional/bookings');
      setBookings(bookRes.data);
      refreshEarnings();
    } catch (err) {
      triggerAlert('error', 'Failed to confirm payment.');
    }
  };

  const refreshEarnings = async () => {
    try {
      const earnRes = await api.get('/api/professional/earnings');
      setEarnings(earnRes.data);
    } catch (err) {}
  };

  // Separate bookings into lists
  const pendingRequests = bookings.filter(b => b.status === 'PROFESSIONAL_ASSIGNED');
  const activeJobs = bookings.filter(b => ['ACCEPTED', 'IN_PROGRESS'].includes(b.status));
  const completedJobs = bookings.filter(b => b.status === 'COMPLETED');

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span>🛠️</span> QuickServe
        </div>
        <div className="sidebar-menu">
          <div className={`sidebar-link ${activeTab === 'jobs' ? 'active' : ''}`} onClick={() => setActiveTab('jobs')}>
            <span>💼</span> Job Dashboard ({pendingRequests.length + activeJobs.length})
          </div>
          <div className={`sidebar-link ${activeTab === 'earnings' ? 'active' : ''}`} onClick={() => setActiveTab('earnings')}>
            <span>📈</span> Earnings & Ratings
          </div>
          <div className={`sidebar-link ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>
            <span>👤</span> Profile Settings
          </div>
          <div className={`sidebar-link ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => setActiveTab('notifications')}>
            <span>🔔</span> Notifications ({notifications.filter(n => !n.read).length})
          </div>
          <div className={`sidebar-link ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
            <span>⚙️</span> Account Credentials
          </div>
        </div>
        <div className="sidebar-user">
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{user?.fullName}</span>
            <span className="sidebar-user-role">Professional {profile?.id ? `(QS-PRO-${profile.id})` : ''}</span>
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

        {/* Tab 1: Job Dashboard */}
        {activeTab === 'jobs' && (
          <div>
            <div className="page-header">
              <div>
                <h1 className="page-title">Service Requests</h1>
                <p className="page-subtitle">Manage assignments and track work progress</p>
              </div>
              <button 
                className={`btn ${profile?.availabilityStatus === 'AVAILABLE' ? 'btn-success' : 'btn-danger'}`}
                onClick={handleToggleAvailability}
              >
                {profile?.availabilityStatus === 'AVAILABLE' ? '🟢 Online & Available' : '🔴 Offline (Unavailable)'}
              </button>
            </div>

            {/* SECTION 1: Pending Request Requests */}
            {pendingRequests.length > 0 && (
              <div style={{ marginBottom: '40px' }}>
                <h2 style={{ fontSize: '20px', marginBottom: '16px', textAlign: 'left', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                  Incoming Requests ({pendingRequests.length})
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {pendingRequests.map(job => (
                    <div key={job.id} className="card" style={{ borderLeft: '4px solid var(--primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <h3 style={{ fontSize: '18px', margin: 0 }}>{job.service.name}</h3>
                          <span style={{ fontSize: '12px', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.08)', color: '#94a3b8' }}>
                            Booking ID: #{job.id}
                          </span>
                          <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 'bold' }}>
                            {formatHistorical(job.price, job.currency, job.exchangeRate)}
                          </span>
                        </div>
                        <p style={{ color: '#94a3b8', fontSize: '13px', marginTop: '4px' }}>
                          Client: <strong>{job.customer.fullName}</strong> | Date: <strong>{job.bookingDate}</strong> | Slot: <strong>{job.timeSlot.formattedSlot}</strong>
                        </p>
                        <p style={{ color: '#94a3b8', fontSize: '13px', marginTop: '2px' }}>
                          Location: <strong>{job.address.streetAddress}, {job.address.city}</strong>
                        </p>
                        {job.notes && <p style={{ color: '#8b5cf6', fontSize: '12px', marginTop: '4px' }}>Note: "{job.notes}"</p>}
                      </div>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        <button className="btn btn-danger" onClick={() => handleRejectBooking(job.id)}>Reject</button>
                        <button className="btn btn-success" onClick={() => handleAcceptBooking(job.id)}>Accept Job</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SECTION 2: Active Ongoing Jobs */}
            <div>
              <h2 style={{ fontSize: '20px', marginBottom: '16px', textAlign: 'left', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                Active Ongoing Jobs ({activeJobs.length})
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {activeJobs.map(job => (
                  <div key={job.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <h3 style={{ fontSize: '18px', margin: 0 }}>{job.service.name}</h3>
                        <span style={{ fontSize: '12px', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.08)', color: '#94a3b8' }}>
                          Booking ID: #{job.id}
                        </span>
                        <span style={{ fontSize: '10px', backgroundColor: '#3b82f6', padding: '2px 8px', borderRadius: '10px' }}>
                          {job.status}
                        </span>
                        <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 'bold' }}>
                          {formatHistorical(job.price, job.currency, job.exchangeRate)}
                        </span>
                      </div>
                      <p style={{ color: '#94a3b8', fontSize: '13px', marginTop: '4px' }}>
                        Client: <strong>{job.customer.fullName}</strong> | Phone: <strong>{job.customer.phoneNumber || 'N/A'}</strong>
                      </p>
                      <p style={{ color: '#94a3b8', fontSize: '13px', marginTop: '2px' }}>
                        Address: <strong>{job.address.streetAddress}, {job.address.city} - {job.address.zipCode}</strong>
                      </p>
                    </div>
                    <div>
                      {job.status === 'ACCEPTED' && (
                        <button className="btn btn-primary" onClick={() => handleMarkOnTheWay(job.id)}>🚗 On The Way</button>
                      )}
                      {job.status === 'ON_THE_WAY' && (
                        <button className="btn btn-warning" onClick={() => handleMarkArrived(job.id)}>📍 Arrived</button>
                      )}
                      {job.status === 'ARRIVED' && (
                        <button className="btn btn-primary" onClick={() => handleStartService(job.id)}>🛠️ Start Work</button>
                      )}
                      {job.status === 'IN_PROGRESS' && (
                        <button className="btn btn-success" onClick={() => {
                          setCompleteBookingId(job.id);
                          setShowCompleteModal(true);
                        }}>✅ Complete Service</button>
                      )}
                    </div>
                  </div>
                ))}
                {activeJobs.length === 0 && (
                  <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>
                    No ongoing jobs. Go online and wait for incoming requests.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Earnings & Reviews */}
        {activeTab === 'earnings' && (
          <div>
            <div className="page-header">
              <div>
                <h1 className="page-title">Earnings & Feedback</h1>
                <p className="page-subtitle">Track payments, ratings, and customer reviews</p>
              </div>
            </div>

            {/* Metric Banner Grid */}
            <div className="grid-3" style={{ marginBottom: '40px' }}>
              <div 
                className="card primary"
                onClick={() => bookingsHistoryRef.current?.scrollIntoView({ behavior: 'smooth' })}
                style={{ cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(59, 130, 246, 0.2)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div className="stat-card-title">Completed Jobs</div>
                <div className="stat-card-value">{earnings?.completedJobsCount || 0}</div>
                <div className="stat-card-desc">Successful home services delivered</div>
              </div>
              <div 
                className="card success"
                onClick={() => bookingsHistoryRef.current?.scrollIntoView({ behavior: 'smooth' })}
                style={{ cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(16, 185, 129, 0.2)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div className="stat-card-title">Total Earnings</div>
                <div className="stat-card-value">{format(earnings?.totalEarnings || 0)}</div>
                <div className="stat-card-desc">Accumulated wallet balance</div>
              </div>
              <div 
                className="card warning"
                onClick={() => reviewsRef.current?.scrollIntoView({ behavior: 'smooth' })}
                style={{ cursor: 'pointer', transition: 'transform 0.2s, box-shadow 0.2s' }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(245, 158, 11, 0.2)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div className="stat-card-title">Average Rating</div>
                <div className="stat-card-value">⭐ {earnings?.averageRating?.toFixed(1) || '0.0'} / 5.0</div>
                <div className="stat-card-desc">Based on customer rating cards</div>
              </div>
            </div>

            {/* Dual Column Layout: Completed Bookings & Reviews */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '32px' }}>
              
              {/* Completed Jobs Log */}
              <div ref={bookingsHistoryRef}>
                <h3 style={{ fontSize: '18px', marginBottom: '16px', textAlign: 'left' }}>Completed Bookings History</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {earnings?.completedBookings?.map(job => (
                    <div key={job.id} className="card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ textAlign: 'left' }}>
                        <h4 style={{ fontSize: '15px' }}>{job.service.name}</h4>
                        <p style={{ color: '#94a3b8', fontSize: '12px', marginTop: '2px' }}>Completed on: {job.bookingDate}</p>
                      </div>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#10b981' }}>
                          +{formatHistorical(job.price, job.currency, job.exchangeRate)}
                        </span>
                        {/* Wait, check if payment is pending COD confirmation */}
                        {job.status === 'COMPLETED' && (
                          <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '10px' }} onClick={() => handleConfirmPayment(job.id)}>
                            Confirm Payment
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {(!earnings?.completedBookings || earnings.completedBookings.length === 0) && (
                    <div style={{ color: '#94a3b8', padding: '20px' }}>No completed bookings logs.</div>
                  )}
                </div>
              </div>

              {/* Customer Review Log */}
              <div ref={reviewsRef}>
                <h3 style={{ fontSize: '18px', marginBottom: '16px', textAlign: 'left' }}>Client Feedback Reviews</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {earnings?.reviews?.map(rev => (
                    <div key={rev.id} className="card" style={{ padding: '16px 20px', textAlign: 'left' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <strong>{rev.customer.fullName}</strong>
                        <span style={{ color: '#f59e0b' }}>{'⭐'.repeat(rev.rating)}</span>
                      </div>
                      <p style={{ color: '#94a3b8', fontSize: '13px', fontStyle: 'italic' }}>
                        "{rev.comment}"
                      </p>
                      <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block', marginTop: '6px' }}>
                        Service: {rev.service.name}
                      </span>
                    </div>
                  ))}
                  {(!earnings?.reviews || earnings.reviews.length === 0) && (
                    <div style={{ color: '#94a3b8', padding: '20px' }}>No feedback reviews received yet.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Profile Settings */}
        {activeTab === 'profile' && (
          <div>
            <div className="page-header">
              <div>
                <h1 className="page-title">Profile Settings</h1>
                <p className="page-subtitle">Update your professional registration, location, and bio</p>
              </div>
            </div>

            <form onSubmit={handleUpdateProfile} className="card" style={{ maxWidth: '700px', margin: '0 auto', textAlign: 'left' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="form-group">
                  <label className="form-label">Service Specialization</label>
                  <select
                    className="form-select"
                    value={editSpecialization}
                    onChange={(e) => setEditSpecialization(e.target.value)}
                  >
                    <option value="PLUMBING">Plumbing</option>
                    <option value="ELECTRICAL">Electrical Repair</option>
                    <option value="AC_REPAIR">AC & Appliance Services</option>
                    <option value="HOME_CLEANING">Home Cleaning</option>
                    <option value="CARPENTRY">Carpentry Services</option>
                    <option value="PAINTING">Painting Services</option>
                    <option value="PEST_CONTROL">Pest Control</option>
                    <option value="BEAUTY">Beauty & Salon at Home</option>
                    <option value="ELECTRONICS_INSTALLATION">TV & Electronics Installation</option>
                    <option value="SMART_HOME_CCTV">CCTV & Smart Home Services</option>
                    <option value="WATER_PURIFIER">Water Purifier Services</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Years of Experience</label>
                  <input
                    type="number"
                    className="form-input"
                    required
                    min="0"
                    value={editExperience}
                    onChange={(e) => setEditExperience(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="form-group">
                  <label className="form-label">Service City</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Service Area Details</label>
                  <input
                    type="text"
                    className="form-input"
                    value={editArea}
                    onChange={(e) => setEditArea(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Professional Biography</label>
                <textarea
                  className="form-input"
                  style={{ height: '120px', resize: 'none' }}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '16px' }}>
                <span style={{ fontSize: '13px', color: '#94a3b8' }}>
                  Verification Status: <strong style={{ color: profile?.verificationStatus === 'VERIFIED' ? '#10b981' : '#ef4444' }}>{profile?.verificationStatus}</strong>
                </span>
                <button type="submit" className="btn btn-primary">Save Profile Changes</button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 4: Notifications */}
        {activeTab === 'notifications' && (
          <div>
            <div className="page-header">
              <div>
                <h1 className="page-title">Notifications</h1>
                <p className="page-subtitle">Alert logs and work updates</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {notifications.map(notif => (
                <div key={notif.id} className="card" style={{ 
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                  backgroundColor: notif.read ? 'var(--bg-card)' : 'rgba(59, 130, 246, 0.08)',
                  padding: '16px 24px', borderLeft: notif.read ? '1px solid var(--border)' : '4px solid var(--primary)'
                }}>
                  <div style={{ textAlign: 'left' }}>
                    <h4 style={{ fontSize: '15px' }}>{notif.title}</h4>
                    <p style={{ color: '#94a3b8', fontSize: '13px', marginTop: '4px' }}>{notif.message}</p>
                  </div>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                    {new Date(notif.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
              {notifications.length === 0 && (
                <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                  No notifications yet.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 5: Professional Settings Credentials */}
        {activeTab === 'settings' && (
          <div>
            <div className="page-header">
              <div>
                <h1 className="page-title">Account Credentials</h1>
                <p className="page-subtitle">Manage your personal credentials, contact name, and login passwords</p>
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
        {/* MODAL: COMPLETE SERVICE DETAILS */}
        {showCompleteModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '20px' }}>✅ Mark Job as Complete</h3>
                <button className="btn" style={{ background: 'none', border: 'none', fontSize: '20px', color: '#94a3b8' }} onClick={() => setShowCompleteModal(false)}>&times;</button>
              </div>

              <form onSubmit={handleCompleteServiceSubmit}>
                <div className="form-group">
                  <label className="form-label">Material / Accessory Charges (in Booking Currency)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-input"
                    placeholder="Enter additional charges (e.g. 150 for parts)"
                    value={materialChargesInput}
                    onChange={(e) => setMaterialChargesInput(e.target.value)}
                  />
                  <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                    Note: Tax (18%) will be recalculated and added to the final invoice automatically.
                  </p>
                </div>

                <div className="form-group">
                  <label className="form-label">Work Details / Notes performed</label>
                  <textarea
                    className="form-input"
                    required
                    style={{ height: '100px', resize: 'none' }}
                    placeholder="Describe what was repaired or materials used..."
                    value={workDetailsInput}
                    onChange={(e) => setWorkDetailsInput(e.target.value)}
                  />
                </div>

                <button type="submit" className="btn btn-success" style={{ width: '100%', marginTop: '16px' }}>
                  Confirm & Complete Service
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ProfessionalDashboard;
