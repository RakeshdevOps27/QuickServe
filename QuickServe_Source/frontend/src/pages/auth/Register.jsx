import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Register = () => {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [role, setRole] = useState('CUSTOMER');

  // Professional specific fields
  const [specialization, setSpecialization] = useState('PLUMBING');
  const [experienceYears, setExperienceYears] = useState(1);
  const [bio, setBio] = useState('');
  const [city, setCity] = useState('');
  const [serviceArea, setServiceArea] = useState('');
  const [idType, setIdType] = useState('Aadhaar Card');
  const [idNumber, setIdNumber] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if role is pre-defined in search query parameters
    const roleParam = searchParams.get('role');
    if (roleParam === 'PROFESSIONAL' || roleParam === 'CUSTOMER' || roleParam === 'ADMIN') {
      setRole(roleParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    const registerData = {
      email,
      password,
      fullName,
      phoneNumber,
      role
    };

    if (role === 'PROFESSIONAL') {
      registerData.specialization = specialization;
      registerData.experienceYears = parseInt(experienceYears) || 0;
      registerData.bio = bio;
      registerData.city = city;
      registerData.serviceArea = serviceArea;
      registerData.idType = idType;
      registerData.idNumber = idNumber;
    }

    try {
      await register(registerData);
      setSuccess(true);
      // Clean up fields
      setEmail('');
      setPassword('');
      setFullName('');
      setPhoneNumber('');
      setBio('');
      setCity('');
      setServiceArea('');
      setIdNumber('');
    } catch (err) {
      setError(err || 'Registration failed. Please check inputs.');
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#0b0f19',
      padding: '40px 20px'
    }}>
      <div className="card" style={{ width: role === 'PROFESSIONAL' ? '650px' : '450px', padding: '40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '30px', fontWeight: '800', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Get Started
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '6px' }}>Create your QuickServe account</p>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}
        {success && (
          <div className="alert alert-success">
            Registration successful! You can now <Link to="/login" style={{ textDecoration: 'underline', color: '#10b981', fontWeight: 'bold' }}>Sign In</Link>.
          </div>
        )}

        {!success && (
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: role === 'PROFESSIONAL' ? '1fr 1fr' : '1fr', gap: '20px' }}>
              
              {/* Common Columns */}
              <div>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    className="form-input"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    className="form-input"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="text"
                    className="form-input"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="123-456-7890"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Account Role</label>
                  <select
                    className="form-select"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  >
                    <option value="CUSTOMER">Customer</option>
                    <option value="PROFESSIONAL">Service Professional</option>
                    <option value="ADMIN">System Administrator</option>
                  </select>
                </div>
              </div>

              {/* Professional Specific Columns */}
              {role === 'PROFESSIONAL' && (
                <div>
                  <div className="form-group">
                    <label className="form-label">Specialization</label>
                    <select
                      className="form-select"
                      value={specialization}
                      onChange={(e) => setSpecialization(e.target.value)}
                    >
                      <option value="PLUMBING">Plumbing</option>
                      <option value="ELECTRICAL">Electrical Repair</option>
                      <option value="AC_REPAIR">AC Repair</option>
                      <option value="HOME_CLEANING">Home Cleaning</option>
                      <option value="BEAUTY">Beauty Services</option>
                      <option value="APPLIANCE_REPAIR">Appliance Repair</option>
                      <option value="PAINTING">Painting</option>
                      <option value="PEST_CONTROL">Pest Control</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Experience (Years)</label>
                    <input
                      type="number"
                      className="form-input"
                      required
                      min="0"
                      value={experienceYears}
                      onChange={(e) => setExperienceYears(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Service City</label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      placeholder="e.g. Mumbai, New York"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Service Area/Neighborhoods</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Bandra, Brooklyn"
                      value={serviceArea}
                      onChange={(e) => setServiceArea(e.target.value)}
                    />
                  </div>

                  <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '16px' }}>
                    <div>
                      <label className="form-label">ID Proof Type</label>
                      <select
                        className="form-select"
                        value={idType}
                        onChange={(e) => setIdType(e.target.value)}
                      >
                        <option value="Aadhaar Card">Aadhaar Card</option>
                        <option value="PAN Card">PAN Card</option>
                        <option value="Passport">Passport</option>
                        <option value="Driver's License">Driver's License</option>
                        <option value="Voter ID">Voter ID</option>
                      </select>
                    </div>
                    <div>
                      <label className="form-label">ID Proof Number</label>
                      <input
                        type="text"
                        className="form-input"
                        required
                        placeholder="e.g. XXXX-XXXX-XXXX"
                        value={idNumber}
                        onChange={(e) => setIdNumber(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Short Bio</label>
                    <textarea
                      className="form-input"
                      style={{ height: '90px', resize: 'none' }}
                      placeholder="Tell customers about your skills..."
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '16px', padding: '12px' }}>
              Register Account
            </button>
          </form>
        )}

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px', color: '#94a3b8' }}>
          Already have an account? <Link to="/login" style={{ color: '#3b82f6', fontWeight: '600' }}>Sign In</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
