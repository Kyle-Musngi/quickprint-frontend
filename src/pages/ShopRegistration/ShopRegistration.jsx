import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, AlertCircle, ArrowRight, ShieldCheck, FileText, Upload } from 'lucide-react';
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

  const [files, setFiles] = useState({
    government_id: null,
    business_permit: null,
    proof_of_ownership: null,
    image: null,
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const { name, files: selectedFiles } = e.target;
    if (selectedFiles && selectedFiles[0]) {
      setFiles((prev) => ({
        ...prev,
        [name]: selectedFiles[0],
      }));
    }
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
      const payload = new FormData();
      Object.keys(formData).forEach((key) => {
        if (formData[key] !== null && formData[key] !== undefined) {
          payload.append(key, formData[key]);
        }
      });

      if (files.government_id) payload.append('government_id', files.government_id);
      if (files.business_permit) payload.append('business_permit', files.business_permit);
      if (files.proof_of_ownership) payload.append('proof_of_ownership', files.proof_of_ownership);
      if (files.image) payload.append('image', files.image);

      await shopService.registerShop(payload);
      setSubmitted(true);
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.error || (typeof err.response?.data === 'object' ? Object.values(err.response.data)[0] : 'Failed to submit shop registration.');
      setErrorMsg(Array.isArray(msg) ? msg[0] : String(msg));
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
            Application & Verification Submitted!
          </h1>
          <div style={{ backgroundColor: '#EFF6FF', border: '1px solid #BFDBFE', padding: '1.25rem', borderRadius: 10, maxWidth: 600, margin: '0 auto 2rem', textAlign: 'left', lineHeight: 1.6, fontSize: '0.92rem', color: '#1E3A8A' }}>
            <strong>What happens next?</strong>
            <ul style={{ paddingLeft: '1.25rem', marginTop: '0.5rem', marginBottom: 0 }}>
              <li>A platform administrator will review your business credentials and verification documents.</li>
              <li>Your account remains a <strong>Customer</strong> account while review is pending.</li>
              <li>Once verified and approved, your account will be <strong>automatically upgraded to Shop Owner</strong> and your shop will go live.</li>
            </ul>
          </div>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link to="/customer/dashboard" className="home-btn-primary">
              Return to Customer Dashboard <ArrowRight size={16} />
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
            Submit your printing business profile and verification documents for Administrator review.
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
                  <option value="Manila">Manila</option>
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
          <div className="reg-form-section">
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

          {/* Verification Evidence (Feature 3) */}
          <div className="reg-form-section" style={{ borderBottom: 'none', marginBottom: 0 }}>
            <h3 className="reg-form-section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={18} style={{ color: 'var(--primary-blue)' }} /> 4. Verification Evidence & Security Documents
            </h3>
            <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
              To protect student customer files and maintain platform trust, please upload the following documents for Administrator verification. Files are stored securely and reviewed only by authorized platform administrators.
            </p>

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label">
                Government-Issued ID (Applicant / Owner)
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', fontWeight: 400 }}>
                  Passport, Driver's License, UMID, National ID, or PhilSys ID. Used to verify the identity of the account holder.
                </span>
              </label>
              <input
                type="file"
                name="government_id"
                className="form-input"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleFileChange}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label">
                Business Permit or DTI / SEC Certificate
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', fontWeight: 400 }}>
                  Mayor's Permit, Barangay Business Clearance, or DTI Registration. Used to confirm legitimate business operations.
                </span>
              </label>
              <input
                type="file"
                name="business_permit"
                className="form-input"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleFileChange}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label className="form-label">
                Proof of Ownership or Lease / Campus Authorization
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', fontWeight: 400 }}>
                  Lease agreement, utility bill under the shop name, or campus permit to operate near student facilities.
                </span>
              </label>
              <input
                type="file"
                name="proof_of_ownership"
                className="form-input"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleFileChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Shop Storefront Photo or Logo (Optional)
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', fontWeight: 400 }}>
                  Visible storefront banner or shop logo shown in student search results.
                </span>
              </label>
              <input
                type="file"
                name="image"
                className="form-input"
                accept="image/*"
                onChange={handleFileChange}
              />
            </div>
          </div>

          <button
            type="submit"
            className="home-btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginTop: '1.5rem', padding: '1rem' }}
            disabled={submitting}
          >
            {submitting ? 'Submitting Application & Verification...' : 'Submit Shop Application for Approval'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ShopRegistration;
