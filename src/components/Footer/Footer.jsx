import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Footer.css';

const CURRENT_YEAR = new Date().getFullYear();

const Footer = () => {
  const { user } = useAuth();

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-brand">
          <div className="footer-logo">
            <img
              src="/images/uqp-logo.png"
              alt="Univ Quick Print Logo"
              className="footer-brand-logo"
            />
            <span>Univ Quick Print</span>
          </div>
          <p className="footer-tagline">Campus Printing Made Simple.</p>
        </div>

        <div>
          <h4 className="footer-col-title">Quick Links</h4>
          <ul className="footer-links">
            <li><Link to="/" className="footer-link">Home</Link></li>
            <li><Link to="/shops" className="footer-link">Find Printing Shops</Link></li>
            <li><a href="/#how-it-works" className="footer-link">How It Works</a></li>
            {(!user || user.role === 'shop_owner') && (
              <li><Link to="/shop-registration" className="footer-link">Shop Owner Registration</Link></li>
            )}
            {user && user.role === 'customer' && (
              <li><Link to="/customer/dashboard" className="footer-link">Customer Dashboard</Link></li>
            )}
          </ul>
        </div>

        <div>
          <h4 className="footer-col-title">Support</h4>
          <ul className="footer-links">
            <li className="footer-link" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Mail size={16} /> support@univquickprint.ph
            </li>
            <li className="footer-link" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Phone size={16} /> (02) 8888-UQP (877)
            </li>
            <li><a href="/privacy" className="footer-link">Privacy Policy</a></li>
            <li><a href="/terms" className="footer-link">Terms of Service</a></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <div>&copy; {CURRENT_YEAR} Univ Quick Print. All rights reserved.</div>
      </div>
    </footer>
  );
};

export default Footer;
