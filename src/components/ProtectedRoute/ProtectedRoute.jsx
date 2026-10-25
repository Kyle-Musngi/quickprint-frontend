import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
        Loading authentication status...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0) {
    const hasRole = allowedRoles.includes(user.role) || (allowedRoles.includes('admin') && user.is_superuser);
    if (!hasRole) {
      let destinationLink = '/';
      let destinationLabel = 'Return to Homepage';
      if (user.role === 'customer') {
        destinationLink = '/customer/dashboard';
        destinationLabel = 'Go to Student Dashboard';
      } else if (user.role === 'shop_owner' || user.role === 'shop_staff') {
        destinationLink = '/shop/dashboard';
        destinationLabel = 'Go to Shop Portal';
      } else if (user.role === 'admin' || user.is_superuser) {
        destinationLink = '/admin/dashboard';
        destinationLabel = 'Go to Admin Panel';
      }

      return (
        <div style={{ maxWidth: 600, margin: '4rem auto', padding: '2.5rem', textAlign: 'center', background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <h2 style={{ color: 'var(--color-error)', marginBottom: '1rem', fontSize: '1.5rem', fontWeight: 800 }}>Access Denied</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.6 }}>
            You are currently signed in as <strong>{user.full_name || user.username}</strong> ({user.role}), which does not have permission to view this section.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href={destinationLink} style={{ display: 'inline-flex', padding: '0.65rem 1.25rem', background: 'var(--primary-blue)', color: '#fff', borderRadius: 8, fontWeight: 600, textDecoration: 'none' }}>
              {destinationLabel}
            </a>
            <a href="/" style={{ display: 'inline-flex', padding: '0.65rem 1.25rem', border: '1px solid var(--border-color)', color: 'var(--dark-blue)', borderRadius: 8, fontWeight: 600, textDecoration: 'none' }}>
              Homepage
            </a>
          </div>
        </div>
      );
    }
  }

  return children;
};

export default ProtectedRoute;
