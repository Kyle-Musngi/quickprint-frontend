import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Store,
  Package,
  Clock,
  Printer,
  CheckCircle2,
  DollarSign,
  Settings,
  ListOrdered,
  BarChart2,
  AlertTriangle,
  Star,
  RotateCcw,
  AlertCircle,
  HelpCircle,
  Check,
  X
} from 'lucide-react';
import { analyticsService, orderService } from '../../services/api';
import ShopOrders from '../ShopOrders/ShopOrders';
import ShopServices from '../ShopServices/ShopServices';
import ShopAnalytics from '../ShopAnalytics/ShopAnalytics';
import ShopSettings from '../ShopSettings/ShopSettings';
import ShopReviewsTab from './ShopReviewsTab';
import ShopRefundsTab from './ShopRefundsTab';
import { formatTime12Hour } from '../../utils/formatTime';
import { formatOrderStatus, getOrderStatusBadge } from '../../utils/formatOrderStatus';
import './ShopDashboard.css';

const ShopDashboard = () => {
  const location = useLocation();
  const queryTab = new URLSearchParams(location.search).get('tab');
  const initialTab = queryTab || 'overview';

  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isNoShop, setIsNoShop] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [visitedTabs, setVisitedTabs] = useState(() => new Set([initialTab]));
  const [actionLoadingId, setActionLoadingId] = useState(null);

  useEffect(() => {
    if (queryTab) {
      setActiveTab(queryTab);
      setVisitedTabs((prev) => new Set([...prev, queryTab]));
    }
  }, [queryTab]);

  const switchTab = (tab) => {
    setActiveTab(tab);
    setVisitedTabs((prev) => new Set([...prev, tab]));
  };

  const fetchOverview = async () => {
    setLoading(true);
    setErrorMsg('');
    setIsNoShop(false);
    try {
      const data = await analyticsService.getShopOverview();
      setOverview(data);
    } catch (err) {
      if (err.response?.status === 404) {
        setIsNoShop(true);
      } else {
        setErrorMsg(err.response?.data?.error || err.response?.data?.detail || 'Could not load printing shop dashboard. Please retry.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const handleQuickAccept = async (orderId) => {
    setActionLoadingId(orderId);
    try {
      await orderService.acceptOrder(orderId);
      await fetchOverview();
    } catch (err) {
      alert(err.response?.data?.error || err.response?.data?.detail || 'Failed to accept order.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleQuickReject = async (orderId) => {
    const reason = window.prompt('Please provide a reason for declining this order:');
    if (!reason || !reason.trim()) return;
    setActionLoadingId(orderId);
    try {
      await orderService.rejectOrder(orderId, reason.trim());
      await fetchOverview();
    } catch (err) {
      alert(err.response?.data?.error || err.response?.data?.detail || 'Failed to reject order.');
    } finally {
      setActionLoadingId(null);
    }
  };

  if (loading) {
    return (
      <div className="shop-dashboard-page">
        <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-secondary)' }}>
          Loading print shop dashboard...
        </div>
      </div>
    );
  }

  // Server or network error state
  if (errorMsg) {
    return (
      <div className="shop-dashboard-page">
        <div style={{ maxWidth: 640, margin: '4rem auto', padding: '2.5rem', textAlign: 'center', background: '#fff', borderRadius: 12, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
          <AlertCircle size={44} style={{ color: '#F59E0B', margin: '0 auto 1rem' }} />
          <h2 style={{ color: 'var(--dark-blue)', marginBottom: '0.75rem' }}>Unable to Load Shop Dashboard</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.75rem', lineHeight: 1.6 }}>
            {errorMsg}
          </p>
          <button
            type="button"
            onClick={fetchOverview}
            className="home-btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', margin: '0 auto' }}
          >
            <RotateCcw size={16} /> Retry
          </button>
        </div>
      </div>
    );
  }

  // Genuine no-registered-shop state
  if (isNoShop || !overview?.shop) {
    return (
      <div className="shop-dashboard-page">
        <div style={{ maxWidth: 640, margin: '4rem auto', padding: '2.5rem', textAlign: 'center', background: '#fff', borderRadius: 12, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
          <Store size={44} style={{ color: 'var(--primary-blue)', margin: '0 auto 1rem' }} />
          <h2 style={{ color: 'var(--dark-blue)', marginBottom: '0.75rem' }}>No Registered Print Shop Found</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.75rem', lineHeight: 1.6 }}>
            You have not registered a printing shop under this account yet. Register your business to start receiving and processing student printing orders.
          </p>
          <Link to="/shop-registration" className="home-btn-primary" style={{ display: 'inline-flex' }}>
            Register Your Printing Shop
          </Link>
        </div>
      </div>
    );
  }

  const { shop, status_counts = {} } = overview;
  const isApproved = shop.status === 'approved';
  const isPending = shop.status === 'pending';
  const isSuspended = shop.status === 'suspended';
  const isRejected = shop.status === 'rejected';
  const pendingRefunds = status_counts?.refund_requests ?? overview?.pending_refunds_count ?? 0;

  return (
    <div className="shop-dashboard-page">
      {/* Hero Widget */}
      <div className="shop-dash-hero">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <img
            src="/images/uqp-logo.png"
            alt="Univ Quick Print Logo"
            className="shop-hero-logo"
            style={{ width: '54px', height: '54px', objectFit: 'contain', borderRadius: '10px', flexShrink: 0 }}
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
              <h1 className="shop-dash-hero-title">{shop.name}</h1>
              <span className={`shop-dash-status-pill pill-${shop.status}`}>
                {shop.status}
              </span>
            </div>
            <p style={{ color: '#94A3B8' }}>
              Operating Hours: {formatTime12Hour(shop.opening_time)} - {formatTime12Hour(shop.closing_time)} • {shop.is_open ? '● Open to Customers' : '○ Closed'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {isApproved ? (
            <button type="button" onClick={() => switchTab('orders')} className="home-btn-primary">
              <ListOrdered size={18} /> Manage Orders Queue
            </button>
          ) : (
            <button type="button" onClick={() => switchTab('settings')} className="home-btn-primary">
              <Settings size={18} /> View / Edit Application
            </button>
          )}
        </div>
      </div>

      {/* Subnavigation Bar */}
      <nav className="shop-portal-nav" aria-label="Shop portal sections">
        <button
          type="button"
          onClick={() => switchTab('overview')}
          className={`portal-nav-link ${activeTab === 'overview' ? 'active' : ''}`}
          aria-pressed={activeTab === 'overview'}
        >
          <Store size={16} /> Overview
        </button>
        <button
          type="button"
          onClick={() => switchTab('orders')}
          className={`portal-nav-link ${activeTab === 'orders' ? 'active' : ''}`}
          aria-pressed={activeTab === 'orders'}
        >
          <Package size={16} /> Orders Queue ({status_counts?.submitted || 0} New)
        </button>
        <button
          type="button"
          onClick={() => switchTab('refunds')}
          className={`portal-nav-link ${activeTab === 'refunds' ? 'active' : ''}`}
          aria-pressed={activeTab === 'refunds'}
        >
          <DollarSign size={16} /> Refunds {pendingRefunds > 0 && `(${pendingRefunds})`}
        </button>
        <button
          type="button"
          onClick={() => switchTab('pricing')}
          className={`portal-nav-link ${activeTab === 'pricing' ? 'active' : ''}`}
          aria-pressed={activeTab === 'pricing'}
        >
          <Printer size={16} /> Pricing & Services
        </button>
        <button
          type="button"
          onClick={() => switchTab('reviews')}
          className={`portal-nav-link ${activeTab === 'reviews' ? 'active' : ''}`}
          aria-pressed={activeTab === 'reviews'}
        >
          <Star size={16} /> Ratings & Reviews
        </button>
        <button
          type="button"
          onClick={() => switchTab('analytics')}
          className={`portal-nav-link ${activeTab === 'analytics' ? 'active' : ''}`}
          aria-pressed={activeTab === 'analytics'}
        >
          <BarChart2 size={16} /> Analytics
        </button>
        <button
          type="button"
          onClick={() => switchTab('settings')}
          className={`portal-nav-link ${activeTab === 'settings' ? 'active' : ''}`}
          aria-pressed={activeTab === 'settings'}
        >
          <Settings size={16} /> Shop Settings
        </button>
      </nav>

      <div className="shop-portal-content">
        <div style={{ display: activeTab === 'overview' ? 'block' : 'none' }}>
          {/* Unapproved Notice if Pending */}
          {isPending && (
            <div style={{ backgroundColor: 'var(--color-warning-bg)', border: '1px solid rgba(245, 158, 11, 0.4)', color: '#92400E', padding: '1.25rem', borderRadius: 12, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <AlertTriangle size={22} style={{ flexShrink: 0 }} />
              <div>
                <strong>Application Under Review:</strong> Your printing shop registration has been submitted and is awaiting administrator verification. Once approved by a platform administrator, your shop will appear in student search results and become active to receive orders.
              </div>
            </div>
          )}

          {/* Suspended Notice */}
          {isSuspended && (
            <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', padding: '1.25rem', borderRadius: 12, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <AlertTriangle size={22} style={{ flexShrink: 0 }} />
              <div>
                <strong>Shop Temporarily Suspended:</strong> This printing shop is currently suspended by platform administration and is excluded from student search results. New orders cannot be accepted at this time.
              </div>
            </div>
          )}

          {/* Rejected Notice */}
          {isRejected && (
            <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', padding: '1.25rem', borderRadius: 12, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <AlertTriangle size={22} style={{ flexShrink: 0 }} />
              <div>
                <strong>Application Declined:</strong> Your shop application was not approved. {shop.rejection_reason ? `Reason: ${shop.rejection_reason}` : 'Please review your shop details and contact platform administrators.'}
              </div>
            </div>
          )}

          <div className="shop-stats-grid">
            <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => switchTab('orders')}>
              <div className="stat-icon orange">
                <Clock size={24} />
              </div>
              <div>
                <div className="stat-num">{status_counts?.submitted || 0}</div>
                <div className="stat-label">Awaiting Acceptance</div>
              </div>
            </div>

            <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => switchTab('orders')}>
              <div className="stat-icon blue">
                <Printer size={24} />
              </div>
              <div>
                <div className="stat-num">
                  {(status_counts?.in_production || status_counts?.accepted || 0) + (status_counts?.printing || 0)}
                </div>
                <div className="stat-label">In Production</div>
              </div>
            </div>

            <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => switchTab('orders')}>
              <div className="stat-icon green">
                <CheckCircle2 size={24} />
              </div>
              <div>
                <div className="stat-num">{status_counts?.ready_for_pickup || 0}</div>
                <div className="stat-label">Ready for Pickup</div>
              </div>
            </div>

            <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => switchTab('refunds')}>
              <div className="stat-icon purple">
                <HelpCircle size={24} />
              </div>
              <div>
                <div className="stat-num">{pendingRefunds}</div>
                <div className="stat-label">Refund Claims</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon purple">
                <DollarSign size={24} />
              </div>
              <div>
                <div className="stat-num">₱{parseFloat(overview.recorded_payments_total || '0').toFixed(2)}</div>
                <div className="stat-label">Recorded Payments (Sandbox)</div>
              </div>
            </div>
          </div>

          {/* Recent Orders Queue */}
          <div className="dashboard-section">
            <div className="dashboard-section-header">
              <h2 className="dashboard-section-title">Recent Incoming Orders</h2>
              <button
                type="button"
                onClick={() => switchTab('orders')}
                style={{ fontSize: '0.9rem', color: 'var(--primary-blue)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
              >
                Open Full Queue &rarr;
              </button>
            </div>

            {(!overview.recent_orders || overview.recent_orders.length === 0) ? (
              <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--bg-subtle)', borderRadius: 12 }}>
                <Package size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 0.5rem' }} />
                <p style={{ color: 'var(--text-secondary)' }}>No orders received yet.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="orders-table">
                  <thead>
                    <tr>
                      <th>Order #</th>
                      <th>Customer</th>
                      <th>Pickup Code</th>
                      <th>Schedule</th>
                      <th>Status</th>
                      <th>Total</th>
                      <th>Direct Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overview.recent_orders.map((ord) => {
                      const isOrderPending = ['submitted', 'pending_acceptance', 'received'].includes(ord.status);
                      return (
                        <tr key={ord.id}>
                          <td><strong>{ord.order_number}</strong></td>
                          <td>{ord.customer__first_name} {ord.customer__last_name}</td>
                          <td>
                            {ord.pickup_code ? (
                              <span style={{ background: '#EFF6FF', color: 'var(--primary-blue)', fontWeight: 800, padding: '0.2rem 0.5rem', borderRadius: 4 }}>
                                {ord.pickup_code}
                              </span>
                            ) : (
                              <span style={{ color: 'var(--text-muted)' }}>Not issued</span>
                            )}
                          </td>
                          <td>{ord.pickup_date || 'Standard'} ({ord.pickup_time_slot || 'Anytime'})</td>
                          <td>
                            <span className={`badge ${getOrderStatusBadge(ord.status)}`}>
                              {formatOrderStatus(ord.status)}
                            </span>
                          </td>
                          <td><strong>₱{parseFloat(ord.total_amount).toFixed(2)}</strong></td>
                          <td>
                            <div style={{ display: 'inline-flex', gap: '0.35rem', alignItems: 'center' }}>
                              {isOrderPending ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleQuickAccept(ord.id)}
                                    disabled={actionLoadingId === ord.id}
                                    className="btn-order-action btn-action-accept"
                                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                                    title="Quick Accept Order"
                                  >
                                    <Check size={14} /> Accept
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleQuickReject(ord.id)}
                                    disabled={actionLoadingId === ord.id}
                                    className="btn-order-action btn-action-reject"
                                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                                    title="Quick Reject Order"
                                  >
                                    <X size={14} /> Reject
                                  </button>
                                </>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => switchTab('orders')}
                                  className="btn-nav-outline"
                                  style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem' }}
                                >
                                  Manage in Queue &rarr;
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {visitedTabs.has('orders') && (
          <div style={{ display: activeTab === 'orders' ? 'block' : 'none' }}>
            <ShopOrders />
          </div>
        )}

        {visitedTabs.has('refunds') && (
          <div style={{ display: activeTab === 'refunds' ? 'block' : 'none' }}>
            <ShopRefundsTab />
          </div>
        )}

        {visitedTabs.has('pricing') && (
          <div style={{ display: activeTab === 'pricing' ? 'block' : 'none' }}>
            <ShopServices />
          </div>
        )}

        {visitedTabs.has('reviews') && (
          <div style={{ display: activeTab === 'reviews' ? 'block' : 'none' }}>
            <ShopReviewsTab />
          </div>
        )}

        {visitedTabs.has('analytics') && (
          <div style={{ display: activeTab === 'analytics' ? 'block' : 'none' }}>
            <ShopAnalytics />
          </div>
        )}

        {visitedTabs.has('settings') && (
          <div style={{ display: activeTab === 'settings' ? 'block' : 'none' }}>
            <ShopSettings />
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopDashboard;
