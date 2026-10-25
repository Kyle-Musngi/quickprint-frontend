import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Users,
  Store,
  Package,
  CreditCard,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  RotateCcw,
  Clock,
  Printer,
  XCircle,
  HelpCircle
} from 'lucide-react';
import { analyticsService } from '../../services/api';
import { formatOrderStatus, getOrderStatusBadge } from '../../utils/formatOrderStatus';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchMetrics = async () => {
    setLoading(true);
    setErrorStatus(null);
    setErrorMessage('');
    try {
      const res = await analyticsService.getAdminOverview();
      setData(res);
    } catch (err) {
      const status = err.response?.status;
      setErrorStatus(status || 500);
      setErrorMessage(
        status === 403
          ? 'Access Denied: You do not have administrator privileges to view system-wide platform metrics.'
          : err.response?.data?.error || 'Could not load platform metrics from the server. Please retry.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  if (loading) {
    return (
      <div className="admin-dashboard-page">
        <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-secondary)' }}>
          Loading platform metrics...
        </div>
      </div>
    );
  }

  if (errorStatus) {
    return (
      <div className="admin-dashboard-page">
        <div style={{
          maxWidth: 600,
          margin: '4rem auto',
          padding: '2.5rem',
          textAlign: 'center',
          background: '#ffffff',
          borderRadius: 12,
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          {errorStatus === 403 ? (
            <Shield size={44} style={{ color: 'var(--color-error)', margin: '0 auto 1rem' }} />
          ) : (
            <AlertCircle size={44} style={{ color: '#F59E0B', margin: '0 auto 1rem' }} />
          )}

          <h2 style={{ color: 'var(--dark-blue)', marginBottom: '0.75rem', fontSize: '1.4rem' }}>
            {errorStatus === 403 ? 'Administrator Access Required' : 'Could Not Load Platform Metrics'}
          </h2>

          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.75rem', lineHeight: 1.6, fontSize: '0.95rem' }}>
            {errorMessage}
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
            {errorStatus === 403 ? (
              <Link to="/" className="home-btn-primary">
                Return to Home
              </Link>
            ) : (
              <button
                type="button"
                onClick={fetchMetrics}
                className="home-btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <RotateCcw size={16} /> Retry
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const {
    users = {},
    shops = {},
    orders = {},
    payments = {},
    recent_shops = [],
    recent_orders = []
  } = data || {};

  return (
    <div className="admin-dashboard-page">
      <div className="admin-header">
        <div className="admin-header-left">
          <img
            src="/images/uqp-logo.png"
            alt="Univ Quick Print Logo"
            className="admin-header-logo"
            style={{ width: '48px', height: '48px', objectFit: 'contain', borderRadius: '8px', flexShrink: 0 }}
          />
          <div>
            <h1 className="admin-title">Platform Administration</h1>
            <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
              System-wide overview for Univ Quick Print operations in the Philippines.
            </p>
          </div>
        </div>

        <div className="admin-header-actions">
          <button
            type="button"
            onClick={fetchMetrics}
            className="btn-nav-outline"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            title="Refresh metrics"
          >
            <RotateCcw size={15} /> Refresh
          </button>
          <Link to="/admin/questions" className="btn-nav-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <HelpCircle size={16} /> Customer Questions
          </Link>
          <Link to="/admin/approvals" className="home-btn-primary">
            <Store size={18} /> Review Pending Shops ({shops.pending || 0})
          </Link>
        </div>
      </div>

      {/* Main Stats Counters */}
      <div className="shop-stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue"><Users size={24} /></div>
          <div>
            <div className="stat-num">{users.total || 0}</div>
            <div className="stat-label">Total Users</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              {users.customers || 0} students • {users.shop_owners || 0} shop owners
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon orange"><Store size={24} /></div>
          <div>
            <div className="stat-num">{shops.total || 0}</div>
            <div className="stat-label">Registered Shops</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              {shops.approved || 0} approved • {shops.pending || 0} pending
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green"><Package size={24} /></div>
          <div>
            <div className="stat-num">{orders.total || 0}</div>
            <div className="stat-label">Total Platform Orders</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              {orders.completed || 0} completed • {orders.active || 0} active
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon purple"><CreditCard size={24} /></div>
          <div>
            <div className="stat-num">₱{parseFloat(payments.total_volume || '0').toFixed(2)}</div>
            <div className="stat-label">Sandbox Volume ({payments.successful_count || 0} paid txns)</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              Simulated sandbox payments
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown Cards */}
      <div className="admin-grid-2" style={{ marginBottom: '2rem' }}>
        {/* Order Status Distribution */}
        <div className="dashboard-section" style={{ padding: '1.5rem', background: '#fff', borderRadius: 12, border: '1px solid var(--border-color)' }}>
          <h3 style={{ fontSize: '1.1rem', color: 'var(--dark-blue)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Package size={18} style={{ color: 'var(--primary-blue)' }} /> Platform Order Pipeline
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            <div style={{ padding: '0.75rem', background: 'var(--bg-subtle)', borderRadius: 8 }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Awaiting Acceptance</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#B45309' }}>{orders.pending_acceptance || 0}</div>
            </div>
            <div style={{ padding: '0.75rem', background: 'var(--bg-subtle)', borderRadius: 8 }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Awaiting Payment</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#C2410C' }}>{orders.awaiting_payment || 0}</div>
            </div>
            <div style={{ padding: '0.75rem', background: 'var(--bg-subtle)', borderRadius: 8 }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>In Production</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary-blue)' }}>{orders.in_production || 0}</div>
            </div>
            <div style={{ padding: '0.75rem', background: 'var(--bg-subtle)', borderRadius: 8 }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Ready for Pickup</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#9333EA' }}>{orders.ready_for_pickup || 0}</div>
            </div>
            <div style={{ padding: '0.75rem', background: 'var(--bg-subtle)', borderRadius: 8 }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Completed</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-success)' }}>{orders.completed || 0}</div>
            </div>
            <div style={{ padding: '0.75rem', background: 'var(--bg-subtle)', borderRadius: 8 }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Cancelled / Rejected</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#6B7280' }}>
                {(orders.cancelled || 0) + (orders.rejected || 0) + (orders.expired || 0)}
              </div>
            </div>
          </div>
        </div>

        {/* Shop Network Distribution */}
        <div className="dashboard-section" style={{ padding: '1.5rem', background: '#fff', borderRadius: 12, border: '1px solid var(--border-color)' }}>
          <h3 style={{ fontSize: '1.1rem', color: 'var(--dark-blue)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Store size={18} style={{ color: 'var(--primary-blue)' }} /> Shop Approval Status
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            <div style={{ padding: '0.75rem', background: 'var(--bg-subtle)', borderRadius: 8 }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Approved & Operating</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-success)' }}>{shops.approved || 0}</div>
            </div>
            <div style={{ padding: '0.75rem', background: 'var(--bg-subtle)', borderRadius: 8 }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Pending Verification</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#D97706' }}>{shops.pending || 0}</div>
            </div>
            <div style={{ padding: '0.75rem', background: 'var(--bg-subtle)', borderRadius: 8 }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Suspended</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-error)' }}>{shops.suspended || 0}</div>
            </div>
            <div style={{ padding: '0.75rem', background: 'var(--bg-subtle)', borderRadius: 8 }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Rejected Applications</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#6B7280' }}>{shops.rejected || 0}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2 Column Details */}
      <div className="admin-grid-2">
        {/* Recent Registered Shops */}
        <div className="dashboard-section">
          <div className="dashboard-section-header">
            <h2 className="dashboard-section-title">Printing Shops</h2>
            <Link to="/admin/approvals" style={{ fontSize: '0.85rem', color: 'var(--primary-blue)', fontWeight: 600 }}>
              Approvals Queue &rarr;
            </Link>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Shop Name</th>
                  <th>Location</th>
                  <th>Owner</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recent_shops.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-secondary)' }}>
                      No shops registered yet.
                    </td>
                  </tr>
                ) : (
                  recent_shops.map((s) => (
                    <tr key={s.id}>
                      <td><strong>{s.name}</strong></td>
                      <td>{s.city}</td>
                      <td>{s.owner__first_name ? `${s.owner__first_name} ${s.owner__last_name}` : '—'}</td>
                      <td>
                        <span className={`shop-dash-status-pill pill-${s.status}`} style={{ fontSize: '0.7rem' }}>
                          {s.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="dashboard-section">
          <div className="dashboard-section-header">
            <h2 className="dashboard-section-title">Recent Platform Orders</h2>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Shop</th>
                  <th>Status</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {recent_orders.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-secondary)' }}>
                      No platform orders created yet.
                    </td>
                  </tr>
                ) : (
                  recent_orders.map((o) => (
                    <tr key={o.id}>
                      <td><strong>{o.order_number}</strong></td>
                      <td>{o.shop__name}</td>
                      <td>
                        <span className={`badge ${getOrderStatusBadge(o.status)}`}>
                          {formatOrderStatus(o.status)}
                        </span>
                      </td>
                      <td>₱{parseFloat(o.total_amount).toFixed(2)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
