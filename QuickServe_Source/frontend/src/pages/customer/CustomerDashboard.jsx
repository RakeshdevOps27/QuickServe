import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCurrency } from '../../context/CurrencyContext';
import api from '../../services/api';

const CustomerDashboard = () => {
  const { user, setUser, logout } = useAuth();
  const { currency, setCurrency, format, formatHistorical } = useCurrency();
  const [activeTab, setActiveTab] = useState('browse');
  
  // Data States
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // Filter/Search States
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // UI Modals & Actions States
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [selectedService, setSelectedService] = useState(null);
  const [wizardAddressId, setWizardAddressId] = useState('');
  const [wizardDate, setWizardDate] = useState('');
  const [wizardSlotId, setWizardSlotId] = useState('');
  const [wizardNotes, setWizardNotes] = useState('');
  
  // Payment Modal States
  const [showPayment, setShowPayment] = useState(false);
  const [paymentBookingId, setPaymentBookingId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('CARD');

  // Review Modal States
  const [showReview, setShowReview] = useState(false);
  const [reviewBookingId, setReviewBookingId] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  // Reschedule Modal States
  const [showReschedule, setShowReschedule] = useState(false);
  const [rescheduleBookingId, setRescheduleBookingId] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleSlotId, setRescheduleSlotId] = useState('');

  // Address Form States
  const [newStreet, setNewStreet] = useState('');
  const [newCity, setNewCity] = useState('');
  const [newState, setNewState] = useState('');
  const [newZip, setNewZip] = useState('');
  const [newLandmark, setNewLandmark] = useState('');
  const [newDefault, setNewDefault] = useState(false);

  // Wizard Manual Address States
  const [wizardNewStreet, setWizardNewStreet] = useState('');
  const [wizardNewCity, setWizardNewCity] = useState('');
  const [wizardNewState, setWizardNewState] = useState('');
  const [wizardNewZip, setWizardNewZip] = useState('');
  const [wizardNewLandmark, setWizardNewLandmark] = useState('');
  const [isCreatingNewAddr, setIsCreatingNewAddr] = useState(false);

  // Help Desk AI Chat States
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'ai',
      text: "Hello! I am the QuickServe AI Assistant. How can I help you today? You can ask me questions about booking a service, canceling or rescheduling bookings, payments, or the smart matching assignment algorithm!",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  // Chat Support Feedback States
  const [showChatFeedback, setShowChatFeedback] = useState(false);
  const [chatRating, setChatRating] = useState(5);
  const [chatFeedbackComment, setChatFeedbackComment] = useState('');

  // Profile Settings States
  const [settingsName, setSettingsName] = useState(user?.fullName || '');
  const [settingsPhone, setSettingsPhone] = useState(user?.phoneNumber || '');
  const [settingsPassword, setSettingsPassword] = useState('');
  const [settingsConfirmPassword, setSettingsConfirmPassword] = useState('');

  // Support Complaints States
  const [complaints, setComplaints] = useState([]);
  const [showComplaint, setShowComplaint] = useState(false);
  const [complaintBookingId, setComplaintBookingId] = useState(null);
  const [complaintTitle, setComplaintTitle] = useState('');
  const [complaintDesc, setComplaintDesc] = useState('');

  useEffect(() => {
    if (user) {
      setSettingsName(user.fullName || '');
      setSettingsPhone(user.phoneNumber || '');
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'help') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    if (activeTab === 'complaints') {
      fetchComplaints();
    }
  }, [chatMessages, isTyping, activeTab]);

  // Global Alert Message
  const [alert, setAlert] = useState(null);

  // Load initial data
  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchComplaints = async () => {
    try {
      const res = await api.get('/api/customer/complaints');
      setComplaints(res.data);
    } catch (err) {
      console.error('Failed to load complaints', err);
    }
  };

  const fetchInitialData = async () => {
    try {
      const catRes = await api.get('/api/customer/categories');
      setCategories(catRes.data);

      const servRes = await api.get('/api/customer/services');
      setServices(servRes.data);

      const addrRes = await api.get('/api/customer/addresses');
      setAddresses(addrRes.data);

      const bookRes = await api.get('/api/customer/bookings');
      setBookings(bookRes.data);

      const slotRes = await api.get('/api/customer/time-slots');
      setTimeSlots(slotRes.data);

      const notifRes = await api.get('/api/customer/notifications');
      setNotifications(notifRes.data);

      fetchComplaints();
    } catch (err) {
      triggerAlert('error', 'Failed to retrieve customer data.');
    }
  };

  const triggerAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  // Add Address Handler
  const handleAddAddress = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/api/customer/addresses', {
        streetAddress: newStreet,
        city: newCity,
        state: newState,
        zipCode: newZip,
        landmark: newLandmark,
        default: newDefault
      });
      setAddresses([...addresses, response.data]);
      setNewStreet('');
      setNewCity('');
      setNewState('');
      setNewZip('');
      setNewLandmark('');
      setNewDefault(false);
      triggerAlert('success', 'Address added successfully!');
    } catch (err) {
      triggerAlert('error', 'Failed to add address.');
    }
  };

  // Delete Address Handler
  const handleDeleteAddress = async (id) => {
    try {
      await api.delete(`/api/customer/addresses/${id}`);
      setAddresses(addresses.filter(addr => addr.id !== id));
      triggerAlert('success', 'Address deleted.');
    } catch (err) {
      triggerAlert('error', 'Failed to delete address.');
    }
  };

  // Start Booking Wizard
  const startBooking = (service) => {
    setSelectedService(service);
    // Auto select default address if available
    const defaultAddr = addresses.find(a => a.isDefault);
    if (addresses.length === 0) {
      setIsCreatingNewAddr(true);
      setWizardAddressId('');
    } else {
      setIsCreatingNewAddr(false);
      setWizardAddressId(defaultAddr ? defaultAddr.id : (addresses[0]?.id || ''));
    }
    setWizardNewStreet('');
    setWizardNewCity('');
    setWizardNewState('');
    setWizardNewZip('');
    setWizardNewLandmark('');
    setWizardDate('');
    setWizardSlotId(timeSlots[0]?.id || '');
    setWizardNotes('');
    setWizardStep(1);
    setShowWizard(true);
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      triggerAlert('error', 'Geolocation is not supported by your browser.');
      return;
    }
    triggerAlert('success', 'Retrieving your current coordinates...');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setWizardNewStreet(`GPS Coordinates (Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)})`);

        try {
          // Query Nominatim OpenStreetMap reverse geocoding API
          const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
          const data = await response.json();
          
          if (data && data.address) {
            const addr = data.address;
            // Nominatim can return city, town, village, or municipality depending on location
            const city = addr.city || addr.town || addr.village || addr.municipality || addr.state_district || 'New York';
            const state = addr.state || 'NY';
            const zip = addr.postcode || '10001';
            const country = addr.country || '';

            setWizardNewCity(city);
            setWizardNewState(state);
            setWizardNewZip(zip);
            setWizardNewLandmark(addr.suburb || addr.neighbourhood || country || 'Auto-detected location');
            
            triggerAlert('success', `Location auto-detected: ${city}, ${state}, ${country}!`);
          } else {
            // Fallback default
            setWizardNewCity('New York');
            setWizardNewState('NY');
            setWizardNewZip('10001');
            setWizardNewLandmark('Auto-detected location');
            triggerAlert('success', 'GPS Coordinates captured! Fallback default populated.');
          }
        } catch (err) {
          console.warn('Reverse geocoding failed. Using fallback default values.', err);
          setWizardNewCity('New York');
          setWizardNewState('NY');
          setWizardNewZip('10001');
          setWizardNewLandmark('Auto-detected location');
          triggerAlert('success', 'GPS Coordinates captured! Fallback default populated.');
        }
      },
      (error) => {
        triggerAlert('error', 'Unable to retrieve location: ' + error.message);
      }
    );
  };

  const handleWizardNextToStep3 = async () => {
    if (isCreatingNewAddr) {
      if (!wizardNewStreet || !wizardNewCity || !wizardNewState || !wizardNewZip) {
        triggerAlert('error', 'Please fill in all address fields.');
        return;
      }
      try {
        const response = await api.post('/api/customer/addresses', {
          streetAddress: wizardNewStreet,
          city: wizardNewCity,
          state: wizardNewState,
          zipCode: wizardNewZip,
          landmark: wizardNewLandmark,
          default: false
        });
        setAddresses([...addresses, response.data]);
        setWizardAddressId(response.data.id);
        triggerAlert('success', 'Address registered successfully!');
        setWizardStep(3);
      } catch (err) {
        triggerAlert('error', 'Failed to register address details.');
      }
    } else {
      if (!wizardAddressId) {
        triggerAlert('error', 'Please select a service address.');
        return;
      }
      setWizardStep(3);
    }
  };

  // Confirm and Submit Booking
  const handleCreateBooking = async () => {
    if (!wizardAddressId) {
      triggerAlert('error', 'Please add a service address first.');
      return;
    }
    if (!wizardDate) {
      triggerAlert('error', 'Please select a service date.');
      return;
    }

    try {
      const response = await api.post('/api/customer/bookings', {
        serviceId: selectedService.id,
        addressId: parseInt(wizardAddressId),
        bookingDate: wizardDate,
        timeSlotId: parseInt(wizardSlotId),
        notes: wizardNotes,
        currency: currency // Pass selected currency context value!
      });

      // Refresh list to pull correct exchange rate from database mapping
      const bookRes = await api.get('/api/customer/bookings');
      setBookings(bookRes.data);

      setShowWizard(false);
      triggerAlert('success', 'Booking created successfully!');
      
      // Auto trigger payment selection
      setPaymentBookingId(response.data.id);
      setPaymentMethod('CARD');
      setShowPayment(true);
    } catch (err) {
      triggerAlert('error', err.response?.data?.message || 'Failed to place booking.');
    }
  };

  // Cancel Booking Handler
  const handleCancelBooking = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      const response = await api.post(`/api/customer/bookings/${id}/cancel`);
      setBookings(bookings.map(b => b.id === id ? response.data : b));
      triggerAlert('success', 'Booking cancelled successfully.');
    } catch (err) {
      triggerAlert('error', err.response?.data?.message || 'Cancellation rejected.');
    }
  };

  // Reschedule Booking Handler
  const handleRescheduleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post(`/api/customer/bookings/${rescheduleBookingId}/reschedule`, null, {
        params: {
          date: rescheduleDate,
          timeSlotId: parseInt(rescheduleSlotId)
        }
      });
      setBookings(bookings.map(b => b.id === rescheduleBookingId ? response.data : b));
      setShowReschedule(false);
      triggerAlert('success', 'Booking rescheduled successfully!');
    } catch (err) {
      triggerAlert('error', err.response?.data?.message || 'Rescheduling rejected.');
    }
  };

  // Payment Submit Handler
  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post(`/api/customer/bookings/${paymentBookingId}/pay`, null, {
        params: { method: paymentMethod }
      });
      // Refresh bookings
      const bookRes = await api.get('/api/customer/bookings');
      setBookings(bookRes.data);
      setShowPayment(false);
      triggerAlert('success', 'Payment confirmed! Status: ' + response.data.paymentStatus);
    } catch (err) {
      triggerAlert('error', 'Payment processing failed.');
    }
  };

  // Submit Review Handler
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/api/customer/bookings/${reviewBookingId}/review`, null, {
        params: {
          rating: reviewRating,
          comment: reviewComment
        }
      });
      setShowReview(false);
      setReviewComment('');
      setReviewRating(5);
      triggerAlert('success', 'Thank you for your feedback!');
      // Refresh bookings history
      const bookRes = await api.get('/api/customer/bookings');
      setBookings(bookRes.data);
    } catch (err) {
      triggerAlert('error', err.response?.data?.message || 'Failed to submit review.');
    }
  };

  // Print Invoice Handler
  const handlePrintInvoice = async (bookingId) => {
    try {
      const res = await api.get(`/api/customer/bookings/${bookingId}/invoice`);
      const newWindow = window.open('', '_blank');
      newWindow.document.write(res.data);
      newWindow.document.close();
    } catch (err) {
      triggerAlert('error', 'Failed to retrieve invoice.');
    }
  };

  // Submit Complaint Handler
  const handleComplaintSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/api/customer/bookings/${complaintBookingId}/complaint`, null, {
        params: {
          title: complaintTitle,
          description: complaintDesc
        }
      });
      setShowComplaint(false);
      setComplaintTitle('');
      setComplaintDesc('');
      triggerAlert('success', 'Support complaint registered successfully.');
      fetchComplaints();
    } catch (err) {
      triggerAlert('error', err.response?.data?.message || 'Failed to file complaint.');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.post('/api/customer/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      triggerAlert('success', 'All alerts marked as read.');
    } catch (err) {
      triggerAlert('error', 'Action failed.');
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = {
      sender: 'user',
      text: chatInput,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMsg]);
    const query = chatInput.toLowerCase();
    setChatInput('');
    setIsTyping(true);

    // Simulate AI thinking and typing response delay (800ms to 1200ms)
    setTimeout(() => {
      let replyText = "I'm sorry, I didn't fully catch that. I am the QuickServe AI assistant. You can ask me about scheduling services, payments, currency conversions, cancel procedures, or how smart professional assignment works!";
      let autoEnd = false;

      if (query.trim() === 'hi' || query.trim() === 'hello' || query.trim() === 'hey' || query.includes('hello') || query.includes('hi ') || query.includes('hey')) {
        replyText = `Hello ${user?.fullName || 'there'}! Welcome to the QuickServe support desk. How can I assist you with your home service bookings today?`;
      } else if (query.includes('bye') || query.includes('exit') || query.includes('end') || query.includes('close')) {
        replyText = "Goodbye! I hope I was helpful. Closing the chat now. Please rate your support experience!";
        autoEnd = true;
      } else if (query.includes('cancel') || query.includes('delete booking')) {
        replyText = "To cancel a booking: Navigate to the 'My Bookings' tab in your dashboard, find the specific booking card, and click the red 'Cancel' button. Please note that bookings can only be cancelled before they are marked as started by the professional.";
      } else if (query.includes('reschedule') || query.includes('change date') || query.includes('change slot')) {
        replyText = "To reschedule a booking: Go to the 'My Bookings' tab, locate the active booking card, and click the 'Reschedule' button. A calendar popup will appear letting you choose a new date and time slot.";
      } else if (query.includes('price') || query.includes('pricing') || query.includes('cost') || query.includes('rate') || query.includes('currency')) {
        replyText = "All services have authoritative base pricing in Indian Rupees (INR ₹) in the database. You can dynamically convert and format all prices in US Dollars (USD $) by toggling the currency selector in the sidebar. The converted price is formatted using locale-aware Intl.NumberFormat.";
      } else if (query.includes('assign') || query.includes('matching') || query.includes('professional') || query.includes('plumber') || query.includes('workload')) {
        replyText = "QuickServe features a smart assignment engine. When you place a booking, it checks available, verified professionals matching the specialization category and city. It filters out anyone with overlapping workloads on that slot and assigns the best provider using a rating-to-active-workload weighted formula.";
      } else if (query.includes('address') || query.includes('location')) {
        replyText = "You can manage your service locations under 'Manage Addresses'. Additionally, when booking a service, you can manually type a new location or click '📍 Use Current Location' in Step 2 of the Booking Wizard. This uses browser GPS coordinates and reverse-geocodes your address instantly.";
      } else if (query.includes('payment') || query.includes('pay') || query.includes('cod') || query.includes('card') || query.includes('upi')) {
        replyText = "We support simulated Credit/Debit Cards, UPI, and Cash on Delivery (COD) payments. You can complete payments during the booking checkout flow. If choosing COD, the professional will request a payment confirmation upon job completion.";
      }

      const aiMsg = {
        sender: 'ai',
        text: replyText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setChatMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);

      if (autoEnd) {
        setTimeout(() => {
          setShowChatFeedback(true);
        }, 1500);
      }
    }, 1000);
  };

  const handleSubmitChatFeedback = () => {
    triggerAlert('success', `Thank you for rating our support agent ${chatRating}/5 stars!`);
    // Reset chat states
    setChatMessages([
      {
        sender: 'ai',
        text: "Hello! I am the QuickServe AI Assistant. How can I help you today? You can ask me questions about booking a service, canceling or rescheduling bookings, payments, or the smart matching assignment algorithm!",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setChatInput('');
    setChatRating(5);
    setChatFeedbackComment('');
    setShowChatFeedback(false);
    setActiveTab('browse');
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (settingsPassword && settingsPassword !== settingsConfirmPassword) {
      triggerAlert('error', 'New passwords do not match.');
      return;
    }

    try {
      const response = await api.put('/api/customer/profile', {
        fullName: settingsName,
        phoneNumber: settingsPhone,
        password: settingsPassword || null
      });

      // Update localStorage & Context
      const updatedUser = {
        ...user,
        fullName: response.data.fullName,
        phoneNumber: response.data.phoneNumber
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);

      setSettingsPassword('');
      setSettingsConfirmPassword('');
      triggerAlert('success', 'Account settings saved successfully!');
    } catch (err) {
      triggerAlert('error', 'Failed to update account settings.');
    }
  };

  // Filtering services
  const filteredServices = services.filter(service => {
    const matchesCategory = selectedCategory ? service.category.id === selectedCategory : true;
    const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          service.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getStatusClass = (status) => {
    if (status === 'COMPLETED') return 'success';
    if (status === 'CANCELLED') return 'danger';
    if (status === 'ACCEPTED' || status === 'IN_PROGRESS') return 'primary';
    return 'warning';
  };

  const getServiceLogo = (categoryName) => {
    switch (categoryName.toLowerCase()) {
      case 'plumbing': return '🚰';
      case 'electrical repair': return '⚡';
      case 'ac & appliance services': return '❄️';
      case 'home cleaning': return '🧹';
      case 'carpentry services': return '🔨';
      case 'painting services': return '🎨';
      case 'pest control': return '🐜';
      case 'beauty & salon at home': return '💇‍♀️';
      case 'tv & electronics installation': return '📺';
      case 'cctv & smart home services': return '🛡️';
      case 'water purifier services': return '💧';
      default: return '🛠️';
    }
  };

  const selectedBookingForPayment = bookings.find(b => b.id === paymentBookingId);

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span>🛠️</span> QuickServe
        </div>
        <div className="sidebar-menu">
          <div className={`sidebar-link ${activeTab === 'browse' ? 'active' : ''}`} onClick={() => setActiveTab('browse')}>
            <span>🔍</span> Browse Services
          </div>
          <div className={`sidebar-link ${activeTab === 'bookings' ? 'active' : ''}`} onClick={() => setActiveTab('bookings')}>
            <span>📅</span> My Bookings
          </div>
          <div className={`sidebar-link ${activeTab === 'addresses' ? 'active' : ''}`} onClick={() => setActiveTab('addresses')}>
            <span>📍</span> Manage Addresses
          </div>
          <div className={`sidebar-link ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => setActiveTab('notifications')}>
            <span>🔔</span> Notifications ({notifications.filter(n => !n.read).length})
          </div>
          <div className={`sidebar-link ${activeTab === 'help' ? 'active' : ''}`} onClick={() => setActiveTab('help')}>
            <span>🙋‍♂️</span> Help Desk & AI
          </div>
          <div className={`sidebar-link ${activeTab === 'complaints' ? 'active' : ''}`} onClick={() => setActiveTab('complaints')}>
            <span>🎫</span> Support Tickets
          </div>
          <div className={`sidebar-link ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
            <span>⚙️</span> Settings
          </div>
        </div>
        <div className="sidebar-user">
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{user?.fullName}</span>
            <span className="sidebar-user-role">Customer</span>
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

        {/* Tab 1: Browse Services */}
        {activeTab === 'browse' && (
          <div>
            {/* Dynamic Welcome Banner */}
            <div className="page-header" style={{ marginBottom: '32px', background: 'linear-gradient(135deg, rgba(26,27,38,0.85) 0%, rgba(59,130,246,0.15) 100%)', padding: '24px 32px', borderRadius: '16px', border: '1px solid var(--border)', textAlign: 'left', display: 'block' }}>
              <h1 className="page-title" style={{ fontSize: '26px', marginBottom: '8px' }}>Welcome, {user?.fullName || 'Customer'}! 👋</h1>
              <p className="page-subtitle" style={{ fontSize: '14px', color: '#94a3b8', margin: 0 }}>What home service do you need today? Select a category and schedule your booking.</p>
            </div>

            <div className="page-header">
              <div>
                <h1 className="page-title">Book a Service</h1>
                <p className="page-subtitle">Select a category and professional to get started</p>
              </div>
              <input
                type="text"
                className="form-input"
                style={{ width: '300px' }}
                placeholder="Search plumbing, cleaning..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Categories Carousel / Badges */}
            <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '16px', marginBottom: '32px' }}>
              <button
                className={`btn ${selectedCategory === null ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setSelectedCategory(null)}
              >
                All Services
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  className={`btn ${selectedCategory === cat.id ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setSelectedCategory(cat.id)}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Services Grid */}
            <div className="grid-3">
              {filteredServices.map(service => (
                <div key={service.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '230px' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                      <span style={{ fontSize: '12px', textTransform: 'uppercase', color: '#8b5cf6', fontWeight: 'bold' }}>
                        {service.category.name}
                      </span>
                      <span style={{ fontSize: '18px', fontWeight: '800', color: '#10b981' }}>
                        {format(service.price)}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '14px' }}>
                      <span style={{ 
                        fontSize: '20px', width: '42px', height: '42px', 
                        borderRadius: '10px', background: 'rgba(59, 130, 246, 0.1)', 
                        border: '1px solid rgba(59, 130, 246, 0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0
                      }}>
                        {getServiceLogo(service.category.name)}
                      </span>
                      <h3 style={{ fontSize: '17px', margin: 0, textAlign: 'left', fontWeight: 'bold' }}>{service.name}</h3>
                    </div>

                    <p style={{ color: '#94a3b8', fontSize: '13px', textAlign: 'left', marginBottom: '16px', minHeight: '45px' }}>
                      {service.description}
                    </p>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>⏱️ {service.durationMinutes} mins</span>
                    <button className="btn btn-primary" onClick={() => startBooking(service)}>Book Now</button>
                  </div>
                </div>
              ))}
              {filteredServices.length === 0 && (
                <div style={{ gridColumn: '1 / -1', padding: '40px', color: '#94a3b8' }}>
                  No services found matching your search.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: My Bookings & Tracker */}
        {activeTab === 'bookings' && (
          <div>
            <div className="page-header">
              <div>
                <h1 className="page-title">My Bookings</h1>
                <p className="page-subtitle">Track status and manage bookings</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {bookings.map(booking => {
                const stepIndex = ['PENDING', 'PROFESSIONAL_ASSIGNED', 'ACCEPTED', 'ON_THE_WAY', 'ARRIVED', 'IN_PROGRESS', 'COMPLETED'].indexOf(booking.status);
                
                return (
                  <div key={booking.id} className="card" style={{ borderLeft: '4px solid' + (booking.status === 'CANCELLED' ? '#ef4444' : '#3b82f6') }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '16px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <h3 style={{ fontSize: '20px', textAlign: 'left', margin: 0 }}>{booking.service.name}</h3>
                          <span style={{ fontSize: '12px', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.08)', color: '#94a3b8' }}>
                            Booking ID: #{booking.id}
                          </span>
                        </div>
                        <p style={{ color: '#94a3b8', fontSize: '13px', textAlign: 'left', marginTop: '4px' }}>
                          Scheduled on <strong>{booking.bookingDate}</strong> during <strong>{booking.timeSlot.formattedSlot}</strong>
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <span className={`btn btn-secondary`} style={{ padding: '6px 12px', fontSize: '12px', cursor: 'default' }}>
                          {formatHistorical(booking.price, booking.currency, booking.exchangeRate)}
                        </span>
                        <span className={`step-circle`} style={{ 
                          backgroundColor: booking.status === 'COMPLETED' ? '#10b981' : booking.status === 'CANCELLED' ? '#ef4444' : booking.status === 'REJECTED' ? '#f43f5e' : '#f59e0b',
                          color: '#fff', padding: '6px 12px', borderRadius: '20px', width: 'auto', height: 'auto', fontSize: '12px' 
                        }}>
                          {booking.status}
                        </span>
                      </div>
                    </div>

                    {/* Stepper tracker for active bookings */}
                    {booking.status !== 'CANCELLED' && booking.status !== 'RESCHEDULED' && booking.status !== 'REJECTED' && (
                      <div className="stepper" style={{ display: 'flex', justifyContent: 'space-between', margin: '20px 0', overflowX: 'auto', gap: '8px', paddingBottom: '8px' }}>
                        {[
                          { label: 'Created', idx: 0 },
                          { label: 'Assigned', idx: 1 },
                          { label: 'Accepted', idx: 2 },
                          { label: 'On Way', idx: 3 },
                          { label: 'Arrived', idx: 4 },
                          { label: 'In Progress', idx: 5 },
                          { label: 'Completed', idx: 6 }
                        ].map((step) => {
                          const isCompleted = stepIndex > step.idx || booking.status === 'COMPLETED';
                          const isActive = stepIndex === step.idx;
                          return (
                            <div key={step.label} className={`step ${isCompleted ? 'completed' : (isActive ? 'active' : '')}`} style={{ flex: '1', minWidth: '70px' }}>
                              <div className="step-circle" style={{ margin: '0 auto' }}>{step.idx + 1}</div>
                              <div className="step-label" style={{ fontSize: '11px', marginTop: '4px', textAlign: 'center' }}>{step.label}</div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Detailed Invoice Breakdown */}
                    <div style={{ backgroundColor: 'rgba(0,0,0,0.2)', padding: '12px 16px', borderRadius: '8px', marginTop: '12px', fontSize: '13px', border: '1px solid var(--border)', textAlign: 'left' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0' }}>
                        <span style={{ color: '#94a3b8' }}>Base Price:</span>
                        <span>{formatHistorical(booking.basePrice || booking.price, booking.currency, booking.exchangeRate)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0' }}>
                        <span style={{ color: '#94a3b8' }}>Visiting Charge:</span>
                        <span>{formatHistorical(booking.visitCharge || 0, booking.currency, booking.exchangeRate)}</span>
                      </div>
                      {booking.materialCharges > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0' }}>
                          <span style={{ color: '#94a3b8' }}>Material Charges:</span>
                          <span style={{ color: '#fbbf24' }}>{formatHistorical(booking.materialCharges, booking.currency, booking.exchangeRate)}</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', margin: '4px 0' }}>
                        <span style={{ color: '#94a3b8' }}>Tax (GST 18%):</span>
                        <span>{formatHistorical(booking.tax || 0, booking.currency, booking.exchangeRate)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', margin: '8px 0 4px 0', borderTop: '1px dashed var(--border)', paddingTop: '8px', fontWeight: 'bold' }}>
                        <span>Final Amount:</span>
                        <span style={{ color: 'var(--primary)' }}>{formatHistorical(booking.finalAmount || booking.price, booking.currency, booking.exchangeRate)}</span>
                      </div>
                      {booking.workDetails && (
                        <div style={{ marginTop: '8px', color: '#94a3b8', borderTop: '1px solid var(--border)', paddingTop: '8px', fontSize: '12px' }}>
                          <strong>Work Details:</strong> {booking.workDetails}
                        </div>
                      )}
                      {booking.payment && (
                        <div style={{ marginTop: '8px', color: '#10b981', borderTop: '1px solid var(--border)', paddingTop: '8px', fontSize: '12px', display: 'flex', justifyContent: 'space-between' }}>
                          <span>Payment Method: <strong>{booking.payment.paymentMethod}</strong> (Status: <strong>{booking.payment.paymentStatus}</strong>)</span>
                          {booking.payment.transactionId && <span>Txn ID: <strong>{booking.payment.transactionId}</strong></span>}
                        </div>
                      )}
                    </div>

                    {/* Details Panel */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #1e293b', paddingTop: '16px', marginTop: '16px', flexWrap: 'wrap', gap: '16px' }}>
                      <div style={{ textAlign: 'left', fontSize: '13px', color: '#94a3b8' }}>
                        {booking.professional ? (
                          <div>Assigned Professional: <strong>{booking.professional.fullName}</strong></div>
                        ) : (
                          <div>Searching for a service professional...</div>
                        )}
                        <div style={{ marginTop: '4px' }}>Address: {booking.address.streetAddress}, {booking.address.city}</div>
                      </div>

                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        {/* Support ticket toggle */}
                        {booking.status !== 'CANCELLED' && (
                          <button className="btn btn-secondary" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' }} onClick={() => {
                            setComplaintBookingId(booking.id);
                            setShowComplaint(true);
                          }}>
                            ⚠️ Report Issue
                          </button>
                        )}

                        {/* Print Invoice */}
                        {booking.status === 'COMPLETED' && (
                          <button className="btn btn-secondary" onClick={() => handlePrintInvoice(booking.id)}>
                            📄 View Invoice
                          </button>
                        )}

                        {/* Cancel & Reschedule Conditions */}
                        {['PENDING', 'CONFIRMED', 'PROFESSIONAL_ASSIGNED', 'ACCEPTED', 'ON_THE_WAY', 'ARRIVED', 'RESCHEDULED'].includes(booking.status) && (
                          <>
                            <button className="btn btn-secondary" onClick={() => {
                              setRescheduleBookingId(booking.id);
                              setRescheduleDate(booking.bookingDate);
                              setRescheduleSlotId(booking.timeSlot.id);
                              setShowReschedule(true);
                            }}>
                              Reschedule
                            </button>
                            <button className="btn btn-danger" onClick={() => handleCancelBooking(booking.id)}>
                              Cancel
                            </button>
                          </>
                        )}

                        {/* Pay Now link for completed COD or pending card payments */}
                        {booking.status === 'COMPLETED' && (!booking.payment || booking.payment.paymentStatus === 'PENDING' || booking.payment.paymentStatus === 'FAILED') && (
                          <button className="btn btn-primary" onClick={() => {
                            setPaymentBookingId(booking.id);
                            setPaymentMethod('CARD');
                            setShowPayment(true);
                          }}>
                            💳 Pay Now
                          </button>
                        )}

                        {/* Review Conditions */}
                        {booking.status === 'COMPLETED' && (
                          <button className="btn btn-primary" onClick={() => {
                            setReviewBookingId(booking.id);
                            setShowReview(true);
                          }}>
                            Rate & Review
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {bookings.length === 0 && (
                <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                  You have no service bookings. Go to "Browse Services" to create one.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Manage Addresses */}
        {activeTab === 'addresses' && (
          <div>
            <div className="page-header">
              <div>
                <h1 className="page-title">Manage Addresses</h1>
                <p className="page-subtitle">Manage service locations for bookings</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '40px' }}>
              {/* Add Address Form */}
              <form onSubmit={handleAddAddress} className="card" style={{ height: 'fit-content' }}>
                <h3 style={{ marginBottom: '20px', fontSize: '18px' }}>Add New Address</h3>
                <div className="form-group">
                  <label className="form-label">Street Address</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    value={newStreet}
                    onChange={(e) => setNewStreet(e.target.value)}
                    placeholder="123 Main St"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    value={newCity}
                    onChange={(e) => setNewCity(e.target.value)}
                    placeholder="New York"
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">State</label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      value={newState}
                      onChange={(e) => setNewState(e.target.value)}
                      placeholder="NY"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Zip Code</label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      value={newZip}
                      onChange={(e) => setNewZip(e.target.value)}
                      placeholder="10001"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Landmark (Optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={newLandmark}
                    onChange={(e) => setNewLandmark(e.target.value)}
                    placeholder="Near Central Park"
                  />
                </div>
                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    checked={newDefault}
                    onChange={(e) => setNewDefault(e.target.checked)}
                    id="address-default"
                  />
                  <label htmlFor="address-default" style={{ fontSize: '14px', cursor: 'pointer' }}>Set as default address</label>
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Add Address</button>
              </form>

              {/* Address List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {addresses.map(addr => (
                  <div key={addr.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px' }}>
                    <div style={{ textAlign: 'left' }}>
                      <p style={{ fontWeight: '600' }}>
                        {addr.streetAddress} {addr.isDefault && <span style={{ backgroundColor: '#3b82f6', color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: '8px', marginLeft: '8px' }}>Default</span>}
                      </p>
                      <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '4px' }}>
                        {addr.city}, {addr.state} - {addr.zipCode}
                      </p>
                      {addr.landmark && <p style={{ color: '#94a3b8', fontSize: '12px', marginTop: '2px' }}>Landmark: {addr.landmark}</p>}
                    </div>
                    <button className="btn btn-danger" style={{ padding: '8px' }} onClick={() => handleDeleteAddress(addr.id)}>
                      Delete
                    </button>
                  </div>
                ))}
                {addresses.length === 0 && (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                    No addresses registered. Please add one using the left side form.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Notifications */}
        {activeTab === 'notifications' && (
          <div>
            <div className="page-header">
              <div>
                <h1 className="page-title">Notifications</h1>
                <p className="page-subtitle">Real-time alerts and state updates</p>
              </div>
              <button className="btn btn-secondary" onClick={handleMarkAllRead}>Mark All as Read</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {notifications.map(notif => (
                <div key={notif.id} className="card" style={{ 
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                  backgroundColor: notif.read ? 'var(--bg-card)' : 'rgba(59, 130, 246, 0.08)',
                  padding: '16px 24px', borderLeft: notif.read ? '1px solid var(--border)' : '4px solid var(--primary)'
                }}>
                  <div style={{ textAlign: 'left' }}>
                    <h4 style={{ fontSize: '15px', fontWeight: '700' }}>{notif.title}</h4>
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

        {/* Tab 5: Help Desk & AI Support Chat */}
        {activeTab === 'help' && (
          <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h1 className="page-title">QuickServe Help Desk</h1>
                <p className="page-subtitle">Chat with our AI Support Agent for instant platform assistance</p>
              </div>
              <button 
                type="button" 
                className="btn btn-danger" 
                style={{ padding: '8px 16px', fontSize: '13px' }} 
                onClick={() => setShowChatFeedback(true)}
              >
                🛑 End Conversation
              </button>
            </div>

            <div className="card" style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', height: '550px', padding: '0', overflow: 'hidden' }}>
              {/* Chat Messages Area */}
              <div style={{ flexGrow: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', backgroundColor: 'rgba(0,0,0,0.15)' }}>
                {chatMessages.map((msg, idx) => (
                  <div key={idx} style={{ 
                    alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                    maxWidth: '70%',
                    textAlign: 'left'
                  }}>
                    <div style={{ 
                      padding: '12px 16px', 
                      borderRadius: msg.sender === 'user' ? '16px 16px 0 16px' : '16px 16px 16px 0',
                      backgroundColor: msg.sender === 'user' ? 'var(--primary)' : 'var(--bg-card-hover)',
                      border: '1px solid ' + (msg.sender === 'user' ? 'var(--primary-hover)' : 'var(--border)'),
                      color: '#fff',
                      fontSize: '14px',
                      lineHeight: '1.5',
                      boxShadow: 'var(--shadow-sm)'
                    }}>
                      {msg.text}
                    </div>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', display: 'block', textAlign: msg.sender === 'user' ? 'right' : 'left' }}>
                      {msg.sender === 'user' ? 'You' : 'QuickServe AI'} • {msg.time}
                    </span>
                  </div>
                ))}
                {isTyping && (
                  <div style={{ alignSelf: 'flex-start', display: 'flex', gap: '4px', padding: '12px 16px', borderRadius: '16px 16px 16px 0', backgroundColor: 'var(--bg-card-hover)', border: '1px solid var(--border)' }}>
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                    <div className="typing-dot"></div>
                  </div>
                )}
                <div ref={chatEndRef}></div>
              </div>

              {/* Chat Input Area */}
              <form onSubmit={handleSendMessage} style={{ display: 'flex', borderTop: '1px solid var(--border)', padding: '16px', gap: '12px', backgroundColor: 'var(--bg-card)', boxSizing: 'border-box' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Type your question (e.g., 'How do I reschedule?', 'Plumbing prices')..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  disabled={isTyping}
                  style={{ flexGrow: 1 }}
                />
                <button type="submit" className="btn btn-primary" disabled={!chatInput.trim() || isTyping}>
                  Send ⚡
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Tab 6: Profile Settings & Manage Account */}
        {activeTab === 'settings' && (
          <div>
            <div className="page-header">
              <div>
                <h1 className="page-title">Account Settings</h1>
                <p className="page-subtitle">Manage your personal information, contact number, and credentials</p>
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

        {/* Tab 7: Support Tickets & Complaints */}
        {activeTab === 'complaints' && (
          <div>
            <div className="page-header">
              <div>
                <h1 className="page-title">Support Tickets</h1>
                <p className="page-subtitle">Track help requests and resolutions filed for your bookings</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {complaints.map(ticket => (
                <div key={ticket.id} className="card" style={{ textAlign: 'left', borderLeft: '4px solid ' + (ticket.status === 'RESOLVED' ? '#10b981' : (ticket.status === 'INVESTIGATING' ? '#f59e0b' : '#ef4444')) }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h3 style={{ fontSize: '18px', margin: 0 }}>{ticket.title}</h3>
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
                    Booking Ref: <strong>#{ticket.booking.id} - {ticket.booking.service.name}</strong> on <strong>{ticket.booking.bookingDate}</strong>
                  </p>
                  <p style={{ fontSize: '14px', marginTop: '10px', color: '#e2e8f0' }}>{ticket.description}</p>
                  
                  {ticket.resolutionNotes && (
                    <div style={{ marginTop: '16px', backgroundColor: 'rgba(59, 130, 246, 0.08)', padding: '12px 16px', borderRadius: '8px', borderLeft: '3px solid #3b82f6' }}>
                      <strong style={{ fontSize: '12px', color: '#3b82f6', textTransform: 'uppercase' }}>Resolution Notes:</strong>
                      <p style={{ fontSize: '13px', margin: '4px 0 0 0', color: '#94a3b8' }}>{ticket.resolutionNotes}</p>
                    </div>
                  )}
                </div>
              ))}

              {complaints.length === 0 && (
                <div className="card" style={{ padding: '40px', color: '#94a3b8', textAlign: 'center' }}>
                  No support tickets raised yet. If you have an issue, tap "Report Issue" on any booking card.
                </div>
              )}
            </div>
          </div>
        )}

        {/* MODAL 1: BOOKING WIZARD */}
        {showWizard && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ width: '550px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h3 style={{ fontSize: '22px' }}>Book {selectedService?.name}</h3>
                <button className="btn" style={{ background: 'none', border: 'none', fontSize: '20px', color: '#94a3b8' }} onClick={() => setShowWizard(false)}>&times;</button>
              </div>

              {/* Wizard Steps indicator */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
                <div style={{ flexGrow: 1, height: '4px', backgroundColor: wizardStep >= 1 ? '#3b82f6' : '#1e293b', borderRadius: '2px' }} />
                <div style={{ flexGrow: 1, height: '4px', backgroundColor: wizardStep >= 2 ? '#3b82f6' : '#1e293b', borderRadius: '2px' }} />
                <div style={{ flexGrow: 1, height: '4px', backgroundColor: wizardStep >= 3 ? '#3b82f6' : '#1e293b', borderRadius: '2px' }} />
              </div>

              {/* Step 1: Service Confirmation */}
              {wizardStep === 1 && (
                <div>
                  <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '16px' }}>{selectedService?.description}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '12px', marginBottom: '24px' }}>
                    <span>Estimated Duration:</span>
                    <strong>⏱️ {selectedService?.durationMinutes} minutes</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '12px', marginBottom: '24px' }}>
                    <span>Service Price:</span>
                    <strong style={{ color: '#10b981', fontSize: '18px' }}>{format(selectedService?.price)}</strong>
                  </div>
                  <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setWizardStep(2)}>Next: Choose Location</button>
                </div>
              )}

              {/* Step 2: Location Selection */}
              {wizardStep === 2 && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h4 style={{ fontSize: '16px', margin: 0 }}>Choose Service Location</h4>
                    {addresses.length > 0 && (
                      <button 
                        type="button" 
                        className="btn btn-secondary" 
                        style={{ padding: '4px 8px', fontSize: '12px' }}
                        onClick={() => setIsCreatingNewAddr(!isCreatingNewAddr)}
                      >
                        {isCreatingNewAddr ? 'Select Saved Address' : '＋ Add New Address'}
                      </button>
                    )}
                  </div>

                  {!isCreatingNewAddr ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '220px', overflowY: 'auto', marginBottom: '24px' }}>
                      {addresses.map(addr => (
                        <label key={addr.id} style={{ 
                          display: 'flex', gap: '12px', alignItems: 'center', padding: '12px', 
                          backgroundColor: parseInt(wizardAddressId) === addr.id ? 'var(--primary-glow)' : 'rgba(0,0,0,0.1)',
                          border: '1px solid ' + (parseInt(wizardAddressId) === addr.id ? '#3b82f6' : '#1e293b'),
                          borderRadius: '8px', cursor: 'pointer'
                        }}>
                          <input
                            type="radio"
                            name="wizardAddress"
                            value={addr.id}
                            checked={parseInt(wizardAddressId) === addr.id}
                            onChange={(e) => setWizardAddressId(e.target.value)}
                          />
                          <div style={{ fontSize: '14px', textAlign: 'left' }}>
                            <strong>{addr.streetAddress}</strong> ({addr.city}, {addr.state})
                          </div>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                      <button 
                        type="button" 
                        className="btn btn-secondary" 
                        style={{ width: '100%', marginBottom: '4px', gap: '6px', fontSize: '13px' }}
                        onClick={handleUseCurrentLocation}
                      >
                        📍 Use Current Location (Auto-Fill)
                      </button>

                      <div className="form-group" style={{ margin: '0' }}>
                        <label className="form-label" style={{ fontSize: '12px', marginBottom: '4px' }}>Street Address</label>
                        <input
                          type="text"
                          className="form-input"
                          required
                          value={wizardNewStreet}
                          onChange={(e) => setWizardNewStreet(e.target.value)}
                          placeholder="e.g. 123 Main St"
                          style={{ padding: '8px 12px' }}
                        />
                      </div>

                      <div className="form-group" style={{ margin: '0' }}>
                        <label className="form-label" style={{ fontSize: '12px', marginBottom: '4px' }}>City (matches professional search)</label>
                        <input
                          type="text"
                          className="form-input"
                          required
                          value={wizardNewCity}
                          onChange={(e) => setWizardNewCity(e.target.value)}
                          placeholder="e.g. New York"
                          style={{ padding: '8px 12px' }}
                        />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div className="form-group" style={{ margin: '0' }}>
                          <label className="form-label" style={{ fontSize: '12px', marginBottom: '4px' }}>State</label>
                          <input
                            type="text"
                            className="form-input"
                            required
                            value={wizardNewState}
                            onChange={(e) => setWizardNewState(e.target.value)}
                            placeholder="e.g. NY"
                            style={{ padding: '8px 12px' }}
                          />
                        </div>
                        <div className="form-group" style={{ margin: '0' }}>
                          <label className="form-label" style={{ fontSize: '12px', marginBottom: '4px' }}>Zip Code</label>
                          <input
                            type="text"
                            className="form-input"
                            required
                            value={wizardNewZip}
                            onChange={(e) => setWizardNewZip(e.target.value)}
                            placeholder="e.g. 10001"
                            style={{ padding: '8px 12px' }}
                          />
                        </div>
                      </div>

                      <div className="form-group" style={{ margin: '0' }}>
                        <label className="form-label" style={{ fontSize: '12px', marginBottom: '4px' }}>Landmark (Optional)</label>
                        <input
                          type="text"
                          className="form-input"
                          value={wizardNewLandmark}
                          onChange={(e) => setWizardNewLandmark(e.target.value)}
                          placeholder="e.g. Near Central Park"
                          style={{ padding: '8px 12px' }}
                        />
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                    <button type="button" className="btn btn-secondary" style={{ flexGrow: 1 }} onClick={() => setWizardStep(1)}>Back</button>
                    <button 
                      type="button" 
                      className="btn btn-primary" 
                      style={{ flexGrow: 2 }} 
                      onClick={handleWizardNextToStep3}
                    >
                      Next: Date & Time
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Date & Slot Selector */}
              {wizardStep === 3 && (
                <div>
                  <div className="form-group">
                    <label className="form-label">Preferred Date</label>
                    <input
                      type="date"
                      className="form-input"
                      required
                      min={new Date().toISOString().split('T')[0]}
                      value={wizardDate}
                      onChange={(e) => setWizardDate(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Available Time Slot</label>
                    <select
                      className="form-select"
                      value={wizardSlotId}
                      onChange={(e) => setWizardSlotId(e.target.value)}
                    >
                      {timeSlots.map(slot => (
                        <option key={slot.id} value={slot.id}>{slot.formattedSlot}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Additional Notes (Optional)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. please call before arriving"
                      value={wizardNotes}
                      onChange={(e) => setWizardNotes(e.target.value)}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                    <button className="btn btn-secondary" style={{ flexGrow: 1 }} onClick={() => setWizardStep(2)}>Back</button>
                    <button className="btn btn-success" style={{ flexGrow: 2 }} onClick={handleCreateBooking}>Confirm Booking</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MODAL 2: PAYMENT GATEWAY SIMULATION */}
        {showPayment && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3 style={{ fontSize: '22px', marginBottom: '16px' }}>Complete Payment</h3>
              <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '24px' }}>
                Please select your payment method to confirm the booking transaction of <strong>{selectedBookingForPayment ? formatHistorical(selectedBookingForPayment.price, selectedBookingForPayment.currency, selectedBookingForPayment.exchangeRate) : ''}</strong>.
              </p>

              <form onSubmit={handlePaymentSubmit}>
                <div className="form-group">
                  <label className="form-label">Payment Method</label>
                  <select
                    className="form-select"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="CARD">Credit/Debit Card (Simulated)</option>
                    <option value="UPI">UPI / Digital Wallet (Simulated)</option>
                    <option value="COD">Cash on Delivery (COD)</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '28px' }}>
                  <button type="button" className="btn btn-secondary" style={{ flexGrow: 1 }} onClick={() => setShowPayment(false)}>Pay Later</button>
                  <button type="submit" className="btn btn-primary" style={{ flexGrow: 2 }}>Confirm & Pay</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 3: RESCHEDULE */}
        {showReschedule && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '20px' }}>Reschedule Service</h3>
                <button className="btn" style={{ background: 'none', border: 'none', fontSize: '20px', color: '#94a3b8' }} onClick={() => setShowReschedule(false)}>&times;</button>
              </div>

              <form onSubmit={handleRescheduleSubmit}>
                <div className="form-group">
                  <label className="form-label">New Date</label>
                  <input
                    type="date"
                    className="form-input"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Time Slot</label>
                  <select
                    className="form-select"
                    value={rescheduleSlotId}
                    onChange={(e) => setRescheduleSlotId(e.target.value)}
                  >
                    {timeSlots.map(slot => (
                      <option key={slot.id} value={slot.id}>{slot.formattedSlot}</option>
                    ))}
                  </select>
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '16px' }}>
                  Confirm Reschedule
                </button>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 4: RATE & REVIEW */}
        {showReview && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '20px' }}>Submit Rating & Review</h3>
                <button className="btn" style={{ background: 'none', border: 'none', fontSize: '20px', color: '#94a3b8' }} onClick={() => setShowReview(false)}>&times;</button>
              </div>

              <form onSubmit={handleReviewSubmit}>
                <div className="form-group">
                  <label className="form-label">Rating (1 to 5 Stars)</label>
                  <select
                    className="form-select"
                    value={reviewRating}
                    onChange={(e) => setReviewRating(parseInt(e.target.value))}
                  >
                    <option value="5">⭐⭐⭐⭐⭐ (Excellent)</option>
                    <option value="4">⭐⭐⭐⭐ (Very Good)</option>
                    <option value="3">⭐⭐⭐ (Average)</option>
                    <option value="2">⭐⭐ (Poor)</option>
                    <option value="1">⭐ (Unacceptable)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Comment</label>
                  <textarea
                    className="form-input"
                    required
                    style={{ height: '100px', resize: 'none' }}
                    placeholder="Tell us about the quality of the service..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                  />
                </div>

                <button type="submit" className="btn btn-success" style={{ width: '100%', marginTop: '12px' }}>
                  Submit Feedback
                </button>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 5: AI SUPPORT CHAT FEEDBACK */}
        {showChatFeedback && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ textAlign: 'center' }}>
              <h3 style={{ fontSize: '20px', marginBottom: '12px' }}>Rate Your Support Experience</h3>
              <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '20px' }}>
                How helpful was the QuickServe AI Support Agent?
              </p>

              {/* Stars Selection */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', fontSize: '28px', cursor: 'pointer', marginBottom: '20px', userSelect: 'none' }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <span key={star} onClick={() => setChatRating(star)} style={{ color: star <= chatRating ? '#f59e0b' : '#475569' }}>
                    ★
                  </span>
                ))}
              </div>

              {/* Optional Comment */}
              <div className="form-group" style={{ textAlign: 'left' }}>
                <label className="form-label">Review Comment (Optional)</label>
                <textarea
                  className="form-input"
                  style={{ height: '80px', resize: 'none' }}
                  placeholder="How can we improve our AI agent?"
                  value={chatFeedbackComment}
                  onChange={(e) => setChatFeedbackComment(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button 
                  type="button"
                  className="btn btn-secondary" 
                  style={{ flexGrow: 1 }} 
                  onClick={() => {
                    setShowChatFeedback(false);
                    // Reset chat states
                    setChatMessages([
                      {
                        sender: 'ai',
                        text: "Hello! I am the QuickServe AI Assistant. How can I help you today? You can ask me questions about booking a service, canceling or rescheduling bookings, payments, or the smart matching assignment algorithm!",
                        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      }
                    ]);
                    setChatInput('');
                    setChatRating(5);
                    setChatFeedbackComment('');
                    setActiveTab('browse');
                  }}
                >
                  Skip Feedback
                </button>
                <button 
                  type="button"
                  className="btn btn-primary" 
                  style={{ flexGrow: 2 }} 
                  onClick={handleSubmitChatFeedback}
                >
                  Submit Review
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 6: REPORT ISSUE / COMPLAINT */}
        {showComplaint && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '20px', color: '#ef4444' }}>⚠️ Report Issue / Support Ticket</h3>
                <button className="btn" style={{ background: 'none', border: 'none', fontSize: '20px', color: '#94a3b8' }} onClick={() => setShowComplaint(false)}>&times;</button>
              </div>

              <form onSubmit={handleComplaintSubmit}>
                <div className="form-group">
                  <label className="form-label">Issue Title</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    placeholder="e.g. Plumber did not arrive, incomplete repair, extra charges requested"
                    value={complaintTitle}
                    onChange={(e) => setComplaintTitle(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Detailed Description</label>
                  <textarea
                    className="form-input"
                    required
                    style={{ height: '120px', resize: 'none' }}
                    placeholder="Please explain the issue or concern in detail. Our support team will investigate."
                    value={complaintDesc}
                    onChange={(e) => setComplaintDesc(e.target.value)}
                  />
                </div>

                <button type="submit" className="btn btn-danger" style={{ width: '100%', marginTop: '16px' }}>
                  Submit Complaint Ticket
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default CustomerDashboard;
