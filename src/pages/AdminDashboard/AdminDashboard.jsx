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
  HelpCircle,
  DollarSign,
  Eye,
  Check,
  X
} from 'lucide-react';
import { analyticsService, paymentService } from '../../services/api';
import { formatOrderStatus, getOrderStatusBadge } from '../../utils/formatOrderStatus';
import { formatCurrency, parseAmount } from '../../utils/formatCurrency';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [adminRefunds, setAdminRefunds] = useState([]);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [actionModal, setActionModal] = useState(null); // { type: 'approve' | 'reject', refund: obj }
  const [actionNotes, setActionNotes] = useState('');
  const [approvedAmount, setApprovedAmount] = useState('');

  const fetchMetrics = async () => {
    setLoading(true);
    setErrorStatus(null);
    setErrorMessage('');
    try {
      const [res, refundsRes] = await Promise.all([
        analyticsService.getAdminOverview(),
        paymentService.getRefunds({ view: 'admin' }).catch(() => [])
      ]);
      setData(res);
      setAdminRefunds(Array.isArray(refundsRes) ? refundsRes : (refundsRes.results || []));
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

  const handleOpenAction = (type, refund) => {
    setActionModal({ type, refund });
    setActionNotes('');
    const rawReq = refund.amount_requested ?? refund.requested_amount;
    const parsed = parseAmount(rawReq);
    setApprovedAmount(parsed !== null ? parsed.toFixed(2) : '');
  };

  const handleConfirmAction = async () => {
    if (!actionModal) return;
    const { type, refund } = actionModal;
    if (type === 'reject' && !actionNotes.trim()) {
      alert('Please provide a decision note explaining the rejection.');
      return;
    }

    const rawReq = refund.amount_requested ?? refund.requested_amount;
    const maxEligible = parseAmount(rawReq);

    let finalApprovedAmount = null;
    if (type === 'approve') {
      const parsedApproved = parseAmount(approvedAmount);
      if (parsedApproved === null || parsedApproved <= 0) {
        alert('Please specify a valid approved refund amount greater than ₱0.00.');
        return;
      }
      if (maxEligible !== null && parsedApproved > maxEligible) {
        alert(`Approved refund amount (${formatCurrency(parsedApproved)}) cannot exceed the eligible requested amount (${formatCurrency(maxEligible)}).`);
        return;
      }
      finalApprovedAmount = parsedApproved;
    }

    setActionLoadingId(refund.id);
    try {
      const payload = {
        action: type,
        decision_notes: actionNotes.trim(),
        amount_approved: finalApprovedAmount
      };
      await paymentService.processRefundAction(refund.id, payload);
      setActionModal(null);
      await fetchMetrics();
    } catch (err) {
      alert(err.response?.data?.error || err.response?.data?.detail || 'Failed to update refund.');
    } finally {
      setActionLoadingId(null);
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
          <div className="admin-icon-box">
            <Printer size={26} color="#FFFFFF" />
          </div>
          <div>
            <h1 className="admin-title">Platform Administration</h1>
            <p className="admin-subtitle">
              System-wide overview for Univ Quick Print operations in the Philippines.
            </p>
          </div>
        </div>

        <div className="admin-header-actions">
          <button
            type="button"
            onClick={fetchMetrics}
            className="admin-action-btn outline"
            title="Refresh metrics"
          >
            <RotateCcw size={15} /> Refresh
          </button>
          <Link to="/admin/questions" className="admin-action-btn outline">
            <HelpCircle size={16} /> Customer Questions
          </Link>
          <Link to="/admin/approvals" className="admin-action-btn primary">
            <Store size={18} /> Review Pending Shops ({shops.pending || 0})
          </Link>
        </div>
      </div>

      {/* Main Stats Counters */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-icon blue"><Users size={24} /></div>
          <div>
            <div className="admin-stat-num">{users.total || 0}</div>
            <div className="admin-stat-label">TOTAL USERS</div>
            <div className="admin-stat-sub">
              {users.customers || 0} students · {users.shop_owners || 0} shop owners
            </div>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon orange"><Store size={24} /></div>
          <div>
            <div className="admin-stat-num">{shops.total || 0}</div>
            <div className="admin-stat-label">REGISTERED SHOPS</div>
            <div className="admin-stat-sub">
              {shops.approved || 0} approved · {shops.pending || 0} pending
            </div>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon green"><Package size={24} /></div>
          <div>
            <div className="admin-stat-num">{orders.total || 0}</div>
            <div className="admin-stat-label">TOTAL PLATFORM ORDERS</div>
            <div className="admin-stat-sub">
              {orders.completed || 0} completed · {orders.active || 0} active
            </div>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon purple"><CreditCard size={24} /></div>
          <div>
            <div className="admin-stat-num">₱{parseFloat(payments.total_volume || '0').toFixed(2)}</div>
            <div className="admin-stat-label">SANDBOX VOLUME ({payments.successful_count || 0} PAID TXNS)</div>
            <div className="admin-stat-sub">
              Simulated sandbox payments
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown Cards */}
      <div className="admin-grid-2">
        {/* Order Status Distribution */}
        <div className="admin-section-card">
          <div className="admin-section-header">
            <h3 className="admin-section-title">
              <Package size={18} style={{ color: 'var(--primary-blue, #2563EB)' }} /> Platform Order Pipeline
            </h3>
          </div>
          <div className="admin-pipeline-grid-6">
            <div className="admin-pipeline-box">
              <div className="admin-pipeline-label">Awaiting Acceptance</div>
              <div className="admin-pipeline-num" style={{ color: '#D97706' }}>{orders.pending_acceptance || 0}</div>
            </div>
            <div className="admin-pipeline-box">
              <div className="admin-pipeline-label">Awaiting Payment</div>
              <div className="admin-pipeline-num" style={{ color: '#EA580C' }}>{orders.awaiting_payment || 0}</div>
            </div>
            <div className="admin-pipeline-box">
              <div className="admin-pipeline-label">In Production</div>
              <div className="admin-pipeline-num" style={{ color: 'var(--primary-blue, #2563EB)' }}>{orders.in_production || 0}</div>
            </div>
            <div className="admin-pipeline-box">
              <div className="admin-pipeline-label">Ready for Pickup</div>
              <div className="admin-pipeline-num" style={{ color: '#9333EA' }}>{orders.ready_for_pickup || 0}</div>
            </div>
            <div className="admin-pipeline-box">
              <div className="admin-pipeline-label">Completed</div>
              <div className="admin-pipeline-num" style={{ color: 'var(--color-success, #16A34A)' }}>{orders.completed || 0}</div>
            </div>
            <div className="admin-pipeline-box">
              <div className="admin-pipeline-label">Cancelled / Rejected</div>
              <div className="admin-pipeline-num" style={{ color: '#64748B' }}>
                {(orders.cancelled || 0) + (orders.rejected || 0) + (orders.expired || 0)}
              </div>
            </div>
          </div>
        </div>

        {/* Shop Network Distribution */}
        <div className="admin-section-card">
          <div className="admin-section-header">
            <h3 className="admin-section-title">
              <Store size={18} style={{ color: 'var(--primary-blue, #2563EB)' }} /> Shop Approval Status
            </h3>
          </div>
          <div className="admin-pipeline-grid-4">
            <div className="admin-pipeline-box">
              <div className="admin-pipeline-label">Approved & Operating</div>
              <div className="admin-pipeline-num" style={{ color: 'var(--color-success, #16A34A)' }}>{shops.approved || 0}</div>
            </div>
            <div className="admin-pipeline-box">
              <div className="admin-pipeline-label">Pending Verification</div>
              <div className="admin-pipeline-num" style={{ color: '#D97706' }}>{shops.pending || 0}</div>
            </div>
            <div className="admin-pipeline-box">
              <div className="admin-pipeline-label">Suspended</div>
              <div className="admin-pipeline-num" style={{ color: 'var(--color-error, #DC2626)' }}>{shops.suspended || 0}</div>
            </div>
            <div className="admin-pipeline-box">
              <div className="admin-pipeline-label">Rejected Applications</div>
              <div className="admin-pipeline-num" style={{ color: '#64748B' }}>{shops.rejected || 0}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2 Column Details */}
      <div className="admin-grid-2">
        {/* Recent Registered Shops */}
        <div className="admin-section-card">
          <div className="admin-section-header">
            <h2 className="admin-section-title">Printing Shops</h2>
            <Link to="/admin/approvals" style={{ fontSize: '0.85rem', color: 'var(--primary-blue, #2563EB)', fontWeight: 600 }}>
              Approvals Queue &rarr;
            </Link>
          </div>

          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>SHOP NAME</th>
                  <th>LOCATION</th>
                  <th>OWNER</th>
                  <th>STATUS</th>
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
        <div className="admin-section-card">
          <div className="admin-section-header">
            <h2 className="admin-section-title">Recent Platform Orders</h2>
          </div>

          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ORDER #</th>
                  <th>SHOP</th>
                  <th>STATUS</th>
                  <th>TOTAL</th>
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

      {/* Admin Platform Refund Management Section */}
      <div className="admin-section-card" style={{ marginTop: '2rem' }}>
        <div className="admin-section-header">
          <h2 className="admin-section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <DollarSign size={20} style={{ color: 'var(--primary-blue, #2563EB)' }} /> Platform Refund Management
          </h2>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            {adminRefunds.filter((r) => ['pending', 'under_review'].includes(r.status.toLowerCase())).length} Claims Pending Review
          </span>
        </div>

        {adminRefunds.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 8, color: 'var(--text-secondary)' }}>
            No customer refund claims registered on the platform.
          </div>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>CLAIM #</th>
                  <th>ORDER #</th>
                  <th>CUSTOMER</th>
                  <th>REASON</th>
                  <th>REQUESTED</th>
                  <th>STATUS</th>
                  <th>DECISION ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {adminRefunds.map((ref) => {
                  const isActionable = ['pending', 'under_review'].includes(ref.status.toLowerCase());
                  return (
                    <tr key={ref.id}>
                      <td><strong>#{ref.id}</strong></td>
                      <td><strong>{ref.order_number || `#${ref.order}`}</strong></td>
                      <td>{ref.customer_name || 'Customer'}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{ref.reason.replace(/_/g, ' ')}</div>
                        {ref.customer_explanation && (
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: 220, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            {ref.customer_explanation}
                          </div>
                        )}
                      </td>
                      <td><strong>{formatCurrency(ref.amount_requested ?? ref.requested_amount)}</strong></td>
                      <td>
                        <span className={`badge ${ref.status === 'completed' || ref.status === 'approved' ? 'badge-success' : ref.status === 'rejected' ? 'badge-error' : 'badge-warning'}`} style={{ textTransform: 'uppercase', fontWeight: 700, fontSize: '0.75rem' }}>
                          {ref.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                          {isActionable ? (
                            <>
                              <button
                                type="button"
                                className="btn-order-action btn-action-accept"
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                                disabled={actionLoadingId === ref.id}
                                onClick={() => handleOpenAction('approve', ref)}
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                className="btn-order-action btn-action-reject"
                                style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                                disabled={actionLoadingId === ref.id}
                                onClick={() => handleOpenAction('reject', ref)}
                              >
                                Reject
                              </button>
                            </>
                          ) : (
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                              {(ref.amount_approved !== null && ref.amount_approved !== undefined) || ref.approved_amount ? formatCurrency(ref.amount_approved ?? ref.approved_amount) : 'Closed'}
                            </span>
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

      {/* Admin Action Modal for Refunds */}
      {actionModal && (
        <div className="admin-modal-overlay" onClick={() => setActionModal(null)}>
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 style={{ margin: 0, color: actionModal.type === 'approve' ? 'var(--color-success)' : 'var(--color-error)' }}>
                {actionModal.type === 'approve' ? 'Approve Refund Request' : 'Reject Refund Request'}
              </h3>
              <button type="button" className="admin-modal-close" onClick={() => setActionModal(null)}>
                &times;
              </button>
            </div>
            <div className="admin-modal-body">
              <p style={{ color: 'var(--text-main)', marginBottom: '1rem' }}>
                Order #{actionModal.refund.order_number || actionModal.refund.order} — Requested amount: <strong>{formatCurrency(actionModal.refund.amount_requested ?? actionModal.refund.requested_amount)}</strong>
              </p>

              {actionModal.type === 'approve' && (
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>
                    Authorized Refund Amount (₱):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={parseAmount(actionModal.refund.amount_requested ?? actionModal.refund.requested_amount) || undefined}
                    className="form-input"
                    value={approvedAmount}
                    onChange={(e) => setApprovedAmount(e.target.value)}
                    required
                  />
                  <small style={{ color: 'var(--text-muted)' }}>
                    Maximum eligible balance: {formatCurrency(actionModal.refund.amount_requested ?? actionModal.refund.requested_amount)}
                  </small>
                </div>
              )}

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Decision Explanation {actionModal.type === 'reject' ? '(required)' : '(optional)'}:
                </label>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder={actionModal.type === 'approve' ? 'Administrative approval note...' : 'Explain why the refund request is declined...'}
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                />
              </div>
            </div>
            <div className="admin-modal-footer">
              <button type="button" className="btn-nav-outline" onClick={() => setActionModal(null)}>
                Cancel
              </button>
              <button
                type="button"
                className={`btn-order-action ${actionModal.type === 'approve' ? 'btn-action-accept' : 'btn-action-reject'}`}
                disabled={actionModal.type === 'reject' && !actionNotes.trim()}
                onClick={handleConfirmAction}
              >
                Confirm {actionModal.type === 'approve' ? 'Approval' : 'Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
