import React from 'react';
import { Link } from 'react-router-dom';
import { useCurrency } from '../context/CurrencyContext';

const LandingPage = () => {
  const { currency, setCurrency, format } = useCurrency();

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0b0f19',
      color: '#f8fafc',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'Outfit, sans-serif'
    }}>
      {/* Navbar */}
      <header style={{
        padding: '20px 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid #1e293b',
        backgroundColor: '#151c2c'
      }}>
        <div style={{
          fontSize: '24px',
          fontWeight: '800',
          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          QuickServe
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <select 
            className="form-select" 
            style={{ width: '90px', padding: '6px 12px', cursor: 'pointer' }}
            value={currency} 
            onChange={(e) => setCurrency(e.target.value)}
          >
            <option value="INR">₹ INR</option>
            <option value="USD">$ USD</option>
          </select>
          <Link to="/login" className="btn btn-secondary" style={{ padding: '8px 16px' }}>Login</Link>
          <Link to="/register" className="btn btn-primary" style={{ padding: '8px 16px' }}>Register</Link>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px 20px',
        textAlign: 'center',
        background: 'radial-gradient(circle at center, rgba(59, 130, 246, 0.1) 0%, transparent 70%)'
      }}>
        <h1 style={{
          fontSize: '56px',
          fontWeight: '800',
          marginBottom: '24px',
          lineHeight: '1.2',
          background: 'linear-gradient(to right, #f8fafc, #94a3b8)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          On-Demand Home Services,<br />At Your Doorstep
        </h1>
        <p style={{
          fontSize: '18px',
          color: '#94a3b8',
          maxWidth: '600px',
          marginBottom: '40px',
          lineHeight: '1.6'
        }}>
          Book verified plumbers, electricians, AC technicians, cleaning staff, and beauty professionals in seconds. Smart matching assigns the highest-rated provider in your area automatically.
        </p>
        <div style={{ display: 'flex', gap: '20px' }}>
          <Link to="/register" className="btn btn-primary" style={{ padding: '14px 28px', fontSize: '16px' }}>
            Book a Service Now
          </Link>
          <Link to="/register?role=PROFESSIONAL" className="btn btn-secondary" style={{ padding: '14px 28px', fontSize: '16px' }}>
            Join as Professional
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section style={{
        padding: '80px 40px',
        backgroundColor: '#151c2c',
        borderTop: '1px solid #1e293b',
        textAlign: 'center'
      }}>
        <h2 style={{ fontSize: '32px', marginBottom: '48px', fontWeight: '700' }}>Why Choose QuickServe?</h2>
        <div className="grid-3" style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div className="card" style={{ padding: '32px' }}>
            <div style={{ fontSize: '36px', marginBottom: '16px' }}>⚡</div>
            <h3 style={{ fontSize: '20px', marginBottom: '12px' }}>Instant Matching</h3>
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>
              Our smart assignment engine selects eligible professionals instantly based on availability, workload, and specialization.
            </p>
          </div>
          <div className="card" style={{ padding: '32px' }}>
            <div style={{ fontSize: '36px', marginBottom: '16px' }}>🛡️</div>
            <h3 style={{ fontSize: '20px', marginBottom: '12px' }}>Verified Providers</h3>
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>
              Every professional undergoes a strict verification process by administrators to ensure safety and quality work.
            </p>
          </div>
          <div className="card" style={{ padding: '32px' }}>
            <div style={{ fontSize: '36px', marginBottom: '16px' }}>📈</div>
            <h3 style={{ fontSize: '20px', marginBottom: '12px' }}>Real-time Status Tracking</h3>
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>
              Track the exact progress of your service booking from provider assignment to work completion in real-time.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '30px 40px',
        textAlign: 'center',
        borderTop: '1px solid #1e293b',
        color: '#94a3b8',
        fontSize: '14px'
      }}>
        &copy; {new Date().getFullYear()} QuickServe Technologies Inc. All rights reserved.
      </footer>
    </div>
  );
};

export default LandingPage;
