import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { shopService } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './ShopRegistration.css';

const ShopRegistration = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    email: user?.email || '',
    phone_number: user?.phone_number || '',
    address: '',
    city: 'Cebu City',
    barangay: '',
    latitude: '14.5995',
    longitude: '120.9842',
    opening_time: '08:00',
    closing_time: '18:00',
    operating_days: 'Monday - Saturday',
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login?redirect=/shop-registration');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      await shopService.registerShop(formData);
      setSubmitted(true);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to submit shop registration.';
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="shop-registration-page">
        <div className="reg-card" style={{ textAlign: 'center', padding: '3.5rem 2rem' }}>
          <div style={{ width: 68, height: 68, background: 'var(--color-success-bg)', color: 'var(--color-success)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <CheckCircle2 size={40} />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--dark-blue)', marginBottom: '0.75rem' }}>
            Application Submitted!
          </h1>
          <p style={{ color: 'var(--text-secondary)', maxWidth: 500, margin: '0 auto 2rem', lineHeight: 1.6 }}>
            “Your printing shop application has been submitted and is awaiting administrator approval.”
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link to="/shop/dashboard" className="home-btn-primary">
              View Shop Portal <ArrowRight size={16} />
            </Link>
            <Link to="/" className="btn-nav-outline">
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="shop-registration-page">
      <div className="reg-card">
        <div className="reg-header">
          <Link to="/" className="reg-logo-link" title="Univ Quick Print Home">
            <img
              src="/images/uqp-logo.png"
              alt="Univ Quick Print Logo"
              className="reg-brand-logo"
            />
          </Link>
          <h1 className="reg-title">Register Your Printing Shop</h1>
          <p className="reg-subtitle">
            Partner with Univ Quick Print to digitize your queue and receive pre-paid print orders.
          </p>
        </div>

        {errorMsg && (
          <div style={{ backgroundColor: 'var(--color-error-bg)', color: 'var(--color-error)', padding: '1rem', borderRadius: 8, marginBottom: '1.5rem' }}>
            <AlertCircle size={18} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Business Details */}
          <div className="reg-form-section">
            <h3 className="reg-form-section-title">1. Business Profile</h3>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label">Shop / Business Name</label>
              <input
                type="text"
                name="name"
                className="form-input"
                placeholder="e.g. Taft Express Laser Printing Hub"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label">Shop Description</label>
              <textarea
                name="description"
                className="form-input"
                rows="3"
                placeholder="Briefly describe your services, equipment, binding options, etc."
                value={formData.description}
                onChange={handleChange}
              />
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Business Email</label>
                <input
                  type="email"
                  name="email"
                  className="form-input"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Contact Phone / Mobile</label>
                <input
                  type="tel"
                  name="phone_number"
                  className="form-input"
                  placeholder="(02) 8524-0000 or 0917..."
                  value={formData.phone_number}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

          {/* Location Details */}
          <div className="reg-form-section">
            <h3 className="reg-form-section-title">2. Campus Location</h3>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label className="form-label">Complete Street Address</label>
              <input
                type="text"
                name="address"
                className="form-input"
                placeholder="e.g. 2401 Taft Avenue, across Gate 2"
                value={formData.address}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-grid-2" style={{ marginBottom: '1rem' }}>
              <div className="form-group">
                <label className="form-label">City / Municipality</label>
                <select
                  name="city"
                  className="form-input"
                  value={formData.city}
                  onChange={handleChange}
                >
                  <option value="Cebu City">Cebu City</option>
                  <option value="Mandaue">Mandaue</option>
                  <option value="Pasig">Pasig</option>
                  <option value="Makati">Makati</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Barangay</label>
                <input
                  type="text"
                  name="barangay"
                  className="form-input"
                  placeholder="e.g. Barangay 719"
                  value={formData.barangay}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="form-group">
                <label className="form-label">Latitude Coordinates</label>
                <input
                  type="text"
                  name="latitude"
                  className="form-input"
                  value={formData.latitude}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Longitude Coordinates</label>
                <input
                  type="text"
                  name="longitude"
                  className="form-input"
                  value={formData.longitude}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* Operating Hours */}
          <div className="reg-form-section" style={{ borderBottom: 'none', marginBottom: 0 }}>
            <h3 className="reg-form-section-title">3. Operating Hours & Schedule</h3>
            <div className="form-grid-2" style={{ marginBottom: '1rem' }}>
              <div className="form-group">
                <label className="form-label">Opening Time</label>
                <input
                  type="time"
                  name="opening_time"
                  className="form-input"
                  value={formData.opening_time}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Closing Time</label>
                <input
                  type="time"
                  name="closing_time"
                  className="form-input"
                  value={formData.closing_time}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Operating Days</label>
              <input
                type="text"
                name="operating_days"
                className="form-input"
                placeholder="e.g. Monday - Saturday"
                value={formData.operating_days}
                onChange={handleChange}
              />
            </div>
          </div>

          <button
            type="submit"
            className="home-btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginTop: '1.5rem', padding: '1rem' }}
            disabled={submitting}
          >
            {submitting ? 'Submitting Application...' : 'Submit Shop Application for Approval'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ShopRegistration;
