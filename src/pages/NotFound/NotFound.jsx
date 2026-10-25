import React from 'react';
import { Link } from 'react-router-dom';
import { Printer, Home, Search } from 'lucide-react';
import './NotFound.css';

const NotFound = () => {
  return (
    <div className="not-found-page">
      <div className="not-found-card">
        <div className="not-found-code">404</div>
        <h1 className="not-found-title">Page Not Found</h1>
        <p className="not-found-desc">
          The page or print document you are looking for does not exist or may have been moved.
        </p>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/" className="home-btn-primary">
            <Home size={18} /> Return Home
          </Link>
          <Link to="/shops" className="home-btn-secondary">
            <Search size={18} /> Find Printing Shops
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
