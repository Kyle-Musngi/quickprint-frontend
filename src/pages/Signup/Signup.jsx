import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Check } from 'lucide-react';
import { authService } from '../../services/api';
import './Signup.css';

const Signup = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    student_id: '',
    role: 'customer',
    password: '',
    confirm_password: '',
    terms: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (formData.password !== formData.confirm_password) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (!formData.terms) {
      setErrorMsg('You must agree to the terms of service.');
      return;
    }

    setLoading(true);

    try {
      await authService.register(formData);
      setSuccessMsg('Account created successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err) {
      const data = err.response?.data;
      if (typeof data === 'object') {
        const firstErr = Object.values(data)[0];
        setErrorMsg(Array.isArray(firstErr) ? firstErr[0] : String(firstErr));
      } else {
        setErrorMsg('Registration failed. Please check your inputs.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-page">
      <div className="signup-card">
        <div className="signup-header">
          <Link to="/" className="signup-logo-link" title="Univ Quick Print Home">
            <img
              src="/images/uqp-logo.png"
              alt="Univ Quick Print Logo"
              className="signup-brand-logo"
            />
          </Link>
          <h2 className="signup-title">Create an Account</h2>
          <p className="signup-subtitle">Join Univ Quick Print for hassle-free campus printing</p>
        </div>

        {errorMsg && <div className="login-error-alert">{errorMsg}</div>}
        {successMsg && (
          <div style={{ backgroundColor: 'var(--color-success-bg)', color: 'var(--color-success)', padding: '0.75rem 1rem', borderRadius: 8, fontSize: '0.9rem', marginBottom: '1rem', fontWeight: 600 }}>
            <Check size={16} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="signup-form">
          <div className="form-group">
            <label className="form-label">I am joining as a:</label>
            <div className="role-selector">
              <div
                className={`role-option ${formData.role === 'customer' ? 'active' : ''}`}
                onClick={() => setFormData({ ...formData, role: 'customer' })}
              >
                <div className="role-option-title">Customer / Student</div>
                <div className="role-option-desc">Order & pick up prints</div>
              </div>
              <div
                className={`role-option ${formData.role === 'shop_owner' ? 'active' : ''}`}
                onClick={() => setFormData({ ...formData, role: 'shop_owner' })}
              >
                <div className="role-option-title">Print Shop Owner</div>
                <div className="role-option-desc">Manage shop & print queue</div>
              </div>
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">First Name</label>
              <input
                type="text"
                name="first_name"
                className="form-input"
                placeholder="Juan"
                value={formData.first_name}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name</label>
              <input
                type="text"
                name="last_name"
                className="form-input"
                placeholder="Dela Cruz"
                value={formData.last_name}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                type="text"
                name="username"
                className="form-input"
                placeholder="juandelacruz"
                value={formData.username}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                name="email"
                className="form-input"
                placeholder="juan@university.edu.ph"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                name="phone_number"
                className="form-input"
                placeholder="09171234567"
                value={formData.phone_number}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Student / ID Number (Optional)</label>
              <input
                type="text"
                name="student_id"
                className="form-input"
                placeholder="e.g. 12048592"
                value={formData.student_id}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="form-input-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  className="form-input"
                  placeholder="Min 6 characters"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <div className="form-input-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirm_password"
                  className="form-input"
                  placeholder="Repeat password"
                  value={formData.confirm_password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="input-action-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex="-1"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          </div>

          <label className="signup-terms">
            <input
              type="checkbox"
              name="terms"
              checked={formData.terms}
              onChange={handleChange}
              required
            />
            <span>
              I agree to the Terms of Service and acknowledge the sandbox payment privacy notice.
            </span>
          </label>

          <button type="submit" className="signup-submit-btn" disabled={loading}>
            {loading ? 'Creating Account...' : 'Complete Registration'}
          </button>
        </form>

        <div className="signup-footer">
          Already have an account? <Link to="/login">Sign in here</Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
