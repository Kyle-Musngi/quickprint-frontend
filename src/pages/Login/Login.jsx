import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Lock, User, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Login.css';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const noticeMsg = location.state?.message || null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setErrorMsg('Please enter both username and password.');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      await login({ username, password });

      // Return to ask question modal if login was triggered from question button
      if (location.state?.askQuestion) {
        navigate('/?askQuestion=true', { replace: true });
      } else {
        // Navigate cleanly to the Home page as requested
        navigate('/', { replace: true });
      }
    } catch (err) {
      const detail = err.response?.data?.detail || 'Invalid username or password.';
      setErrorMsg(detail);
    } finally {
      setLoading(false);
    }
  };

  const setDemoUser = (user, pass) => {
    setUsername(user);
    setPassword(pass);
    setErrorMsg('');
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <Link to="/" className="login-logo-link" title="Univ Quick Print Home">
            <img
              src="/images/uqp-logo.png"
              alt="Univ Quick Print Logo"
              className="login-brand-logo"
            />
          </Link>
          <h2 className="login-title">Welcome Back</h2>
          <p className="login-subtitle">Sign in to your Univ Quick Print account</p>
        </div>

        {noticeMsg && (
          <div style={{ backgroundColor: '#EFF6FF', color: '#1D4ED8', padding: '0.85rem 1rem', borderRadius: 8, fontSize: '0.9rem', marginBottom: '1.25rem', border: '1px solid #BFDBFE' }}>
            {noticeMsg}
          </div>
        )}

        {errorMsg && <div className="login-error-alert">{errorMsg}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label className="form-label">Username</label>
            <div className="form-input-wrap">
              <input
                type="text"
                className="form-input"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div className="form-input-wrap">
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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

          <button type="submit" className="login-submit-btn" disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        {/* Instant Demo Fill for Testing */}
        <div className="demo-credentials-box">
          <div className="demo-box-title">
            <Sparkles size={14} /> One-Click Demo Logins
          </div>
          <div className="demo-buttons-row">
            <button
              type="button"
              className="demo-fill-btn"
              onClick={() => setDemoUser('student', 'StudentPass123!')}
            >
              Student
            </button>
            <button
              type="button"
              className="demo-fill-btn"
              onClick={() => setDemoUser('owner_taft', 'OwnerPass123!')}
            >
              Shop Owner
            </button>
            <button
              type="button"
              className="demo-fill-btn"
              onClick={() => setDemoUser('admin', 'AdminPass123!')}
            >
              Admin
            </button>
          </div>
        </div>

        <div className="login-footer">
          Don't have an account yet? <Link to="/signup">Sign up here</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
