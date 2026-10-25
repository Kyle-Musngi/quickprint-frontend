import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, Phone, Mail, Award, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/api';
import { formatRoleLabel } from '../../utils/formatRoleLabel';
import './CustomerProfile.css';

const CustomerProfile = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone_number: user?.phone_number || '',
    student_id: user?.student_id || '',
  });

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Keep form data in sync with authenticated user state
  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone_number: user.phone_number || '',
        student_id: user.student_id || '',
      });
    }
  }, [user]);

  // Handle URL anchor jump to student-id field
  useEffect(() => {
    if (location.hash === '#student-id') {
      const el = document.getElementById('student-id');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.focus();
      }
    }
  }, [location.hash]);

  // Track if customer has unsaved edits
  const isDirty = useMemo(() => {
    return (
      formData.first_name !== (user?.first_name || '') ||
      formData.last_name !== (user?.last_name || '') ||
      formData.phone_number !== (user?.phone_number || '') ||
      formData.student_id !== (user?.student_id || '')
    );
  }, [formData, user]);

  const handleBack = () => {
    if (isDirty) {
      const confirmDiscard = window.confirm(
        'You have unsaved changes to your profile. Are you sure you want to discard your edits and go back?'
      );
      if (!confirmDiscard) return;
    }

    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate('/customer/dashboard');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const updated = await authService.updateProfile(formData);
      updateUser(updated);
      setSuccessMsg('Profile details updated successfully.');
    } catch {
      setErrorMsg('Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="customer-profile-page">
      <div className="profile-top-bar">
        <button
          type="button"
          className="profile-back-btn"
          onClick={handleBack}
          aria-label="Back to dashboard"
        >
          <ArrowLeft size={18} />
          <span>Back</span>
        </button>
      </div>

      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar-wrap">
            {user?.first_name ? user.first_name[0].toUpperCase() : 'U'}
          </div>
          <div>
            <h1 className="profile-name">{user?.full_name || user?.username}</h1>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              @{user?.username} • {user?.email}
            </div>
            <span className="profile-role-badge">{formatRoleLabel(user?.role)}</span>
          </div>
        </div>

        {successMsg && (
          <div style={{ backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success)', padding: '0.75rem 1rem', borderRadius: 8, marginBottom: '1.5rem', fontWeight: 600 }}>
            <CheckCircle2 size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div style={{ backgroundColor: 'var(--color-error-bg)', color: 'var(--color-error)', padding: '0.75rem 1rem', borderRadius: 8, marginBottom: '1.5rem' }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="first-name-input">First Name</label>
              <input
                id="first-name-input"
                type="text"
                name="first_name"
                className="form-input"
                value={formData.first_name}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="last-name-input">Last Name</label>
              <input
                id="last-name-input"
                type="text"
                name="last_name"
                className="form-input"
                value={formData.last_name}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label" htmlFor="phone-number-input">Phone Number</label>
              <input
                id="phone-number-input"
                type="tel"
                name="phone_number"
                className="form-input"
                value={formData.phone_number}
                onChange={handleChange}
                placeholder="09171234567"
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="student-id">University / Student ID Number</label>
              <input
                id="student-id"
                type="text"
                name="student_id"
                className="form-input"
                value={formData.student_id}
                onChange={handleChange}
                placeholder="e.g. 12048592"
              />
            </div>
          </div>

          <button
            type="submit"
            className="home-btn-primary"
            style={{ marginTop: '1rem', width: 'fit-content' }}
            disabled={saving}
          >
            {saving ? 'Saving Changes...' : 'Save Profile Changes'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CustomerProfile;
