import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Printer,
  Clock,
  CheckCircle2,
  CreditCard,
  Bell,
  ArrowRight,
  PlusCircle,
  Package,
  HelpCircle,
  Receipt,
  RotateCcw,
  DollarSign
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { orderService, paymentService } from '../../services/api';
import {
  formatOrderStatus,
  getOrderStatusBadge,
  getPaymentStatusBadge,
  formatRefundStatus,
  getRefundStatusBadge
} from '../../utils/formatOrderStatus';
import { formatCurrency, parseAmount } from '../../utils/formatCurrency';
import './CustomerDashboard.css';

const CustomerDashboard = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [refundRequests, setRefundRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refundsLoading, setRefundsLoading] = useState(true);
  const [refundsError, setRefundsError] = useState(null);

  const fetchRefundRequests = async () => {
    setRefundsLoading(true);
    setRefundsError(null);
    try {
      const data = await paymentService.getRefunds();
      const list = Array.isArray(data) ? data : (data.results || []);
      setRefundRequests(list);
    } catch (err) {
      setRefundsError(err.response?.data?.detail || 'Unable to load refund requests. Please try again.');
    } finally {
      setRefundsLoading(false);
    }
  };

  useEffect(() => {
    Promise.all([
      orderService.getOrders(),
      paymentService.getPayments(),
    ])
      .then(([ordersRes, paymentsRes]) => {
        const rawOrders = Array.isArray(ordersRes) ? ordersRes : (ordersRes.results || []);
        const rawPayments = Array.isArray(paymentsRes) ? paymentsRes : (paymentsRes.results || []);
        // Deduplicate orders by ID to prevent duplicate rows on multiple fetches/refreshes
        const uniqueOrders = Array.from(new Map(rawOrders.map((o) => [o.id, o])).values());
        const uniquePayments = Array.from(new Map(rawPayments.map((p) => [p.id, p])).values());
        setOrders(uniqueOrders);
        setPayments(uniquePayments);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    fetchRefundRequests();
  }, []);


  // Standard active and terminal statuses across UQP
  const CLOSED_STATUSES = ['completed', 'cancelled', 'rejected', 'expired'];
  const ACTIVE_STATUSES = [
    'awaiting_payment',
    'accepted',
    'pending_acceptance',
    'submitted',
    'received',
    'in_production',
    'printing',
    'ready_for_pickup'
  ];

  // Track orders with an active/ongoing refund request
  const activeRefundOrderIds = new Set();
  const activeRefundOrderNumbers = new Set();
  refundRequests.forEach((ref) => {
    const refSt = String(ref.status || '').toLowerCase().trim();
    if (['pending', 'under_review', 'processing'].includes(refSt)) {
      const ordId = ref.order?.id ?? ref.order;
      if (ordId) activeRefundOrderIds.add(ordId);
      if (ref.order_number) activeRefundOrderNumbers.add(ref.order_number);
      if (ref.order?.order_number) activeRefundOrderNumbers.add(ref.order.order_number);
    }
  });

  const orderHasActiveRefund = (ord) => {
    if (!ord) return false;
    if (ord.has_active_refund) return true;
    const refSt = String(ord.refund_status || '').toLowerCase().trim();
    if (['pending', 'under_review', 'processing'].includes(refSt)) return true;
    if (activeRefundOrderIds.has(ord.id)) return true;
    if (ord.order_number && activeRefundOrderNumbers.has(ord.order_number)) return true;
    return false;
  };

  const isActiveOrder = (ord) => {
    if (!ord || !ord.status) return false;
    const st = String(ord.status).toLowerCase().trim();
    if (CLOSED_STATUSES.includes(st)) return false;
    return ACTIVE_STATUSES.includes(st) || !CLOSED_STATUSES.includes(st);
  };

  const activeOrders = orders.filter(isActiveOrder);
  // Hide orders that have an ongoing/active refund request from the small Active Orders preview
  const previewActiveOrders = activeOrders.filter((ord) => !orderHasActiveRefund(ord));
  const completedOrders = orders.filter((o) => String(o.status || '').toLowerCase().trim() === 'completed');
  const readyForPickup = orders.filter((o) => String(o.status || '').toLowerCase().trim() === 'ready_for_pickup');

  const formatSchedule = (ord) => {
    if (!ord.pickup_date) return 'Standard / Flexible';
    try {
      const d = new Date(ord.pickup_date);
      const dateStr = !isNaN(d.getTime())
        ? d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
        : ord.pickup_date;
      return ord.pickup_time_slot ? `${dateStr}, ${ord.pickup_time_slot}` : dateStr;
    } catch {
      return `${ord.pickup_date}${ord.pickup_time_slot ? `, ${ord.pickup_time_slot}` : ''}`;
    }
  };

  return (
    <div className="customer-dashboard-page">
      {/* Hero Welcome Widget */}
      <div className="dashboard-hero">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <img
            src="/images/uqp-logo.png"
            alt="Univ Quick Print Logo"
            className="dashboard-hero-logo"
            style={{ width: '56px', height: '56px', objectFit: 'contain', borderRadius: '10px', flexShrink: 0 }}
          />
          <div className="dashboard-hero-content">
            <h1>Welcome, {user?.first_name || user?.username}!</h1>
            <p>Manage your university print orders, check live pickup codes, and track payment history.</p>
          </div>
        </div>
        <Link to="/upload-print" className="start-print-cta-btn">
          <PlusCircle size={20} /> Start New Printing Order
        </Link>
      </div>

      {/* Stats Quick Overview */}
      <div className="dashboard-stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">
            <Package size={24} />
          </div>
          <div>
            <div className="stat-num">{orders.length}</div>
            <div className="stat-label">Total Orders</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon orange">
            <Clock size={24} />
          </div>
          <div>
            <div className="stat-num">{previewActiveOrders.length}</div>
            <div className="stat-label">Active Orders</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div className="stat-num">{readyForPickup.length}</div>
            <div className="stat-label">Ready for Pickup</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon purple">
            <CreditCard size={24} />
          </div>
          <div>
            <div className="stat-num">{payments.length}</div>
            <div className="stat-label">Sandbox Payments</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon amber">
            <RotateCcw size={24} />
          </div>
          <div>
            <div className="stat-num">{refundRequests.length}</div>
            <div className="stat-label">Refund Claims</div>
          </div>
        </div>
      </div>

      {/* Active Orders Widget */}
      <div className="dashboard-section">
        <div className="dashboard-section-header">
          <h2 className="dashboard-section-title">Active Orders</h2>
          <Link to="/customer/orders" style={{ fontSize: '0.9rem', color: 'var(--primary-blue)', fontWeight: 600 }}>
            View All ({orders.length}) &rarr;
          </Link>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
            Loading orders...
          </div>
        ) : previewActiveOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem', background: 'var(--bg-subtle)', borderRadius: 12 }}>
            <Printer size={32} style={{ color: 'var(--text-muted)', margin: '0 auto 0.5rem' }} />
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>No active orders right now.</p>
            <Link to="/shops" className="home-btn-primary" style={{ display: 'inline-flex', padding: '0.5rem 1.25rem', fontSize: '0.9rem' }}>
              Order a Print
            </Link>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Shop</th>
                  <th>Queue</th>
                  <th>Pickup Schedule</th>
                  <th>Order Status</th>
                  <th>Payment Status</th>
                  <th>Amount</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {previewActiveOrders.map((ord) => {
                  const payBadge = getPaymentStatusBadge(ord.payment_status);
                  const orderBadge = getOrderStatusBadge(ord.status);
                  const isAwaitingPay = ['awaiting_payment', 'accepted'].includes(String(ord.status || '').toLowerCase().trim()) && String(ord.payment_status || '').toLowerCase().trim() !== 'paid';
                  const isPaid = String(ord.payment_status || '').toLowerCase().trim() === 'paid';

                  return (
                    <tr key={ord.id}>
                      <td>
                        <strong>{ord.order_number}</strong>
                        {ord.pickup_code && (
                          <div style={{ marginTop: '0.2rem' }}>
                            <span style={{ background: '#EFF6FF', color: 'var(--primary-blue)', fontWeight: 800, padding: '0.15rem 0.45rem', borderRadius: 4, fontSize: '0.78rem' }}>
                              Code: {ord.pickup_code}
                            </span>
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{ord.shop_name || 'Print Shop'}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {ord.documents?.length || ord.document_count || 1} document(s)
                        </div>
                      </td>
                      <td>
                        {ord.queue_info?.queue_number || ord.queue_info?.queue_number_display ? (
                          <div className="queue-pill-container">
                            <span className="queue-ticket-tag">
                              Queue {ord.queue_info.queue_number_display || `#${ord.queue_info.queue_number}`}
                            </span>
                            {ord.queue_info.is_active && ord.queue_info.position != null ? (
                              <span className="queue-position-tag">
                                Position {ord.queue_info.position}
                              </span>
                            ) : null}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>—</span>
                        )}
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>
                        {formatSchedule(ord)}
                      </td>
                      <td>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '0.25rem 0.55rem',
                            borderRadius: 6,
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            color: orderBadge.color,
                            backgroundColor: orderBadge.bg,
                            border: `1px solid ${orderBadge.color}25`
                          }}
                        >
                          {orderBadge.label}
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '0.25rem 0.55rem',
                            borderRadius: 6,
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            color: payBadge.color,
                            backgroundColor: payBadge.bg,
                            border: `1px solid ${payBadge.color}25`
                          }}
                        >
                          {payBadge.label}
                        </span>
                      </td>
                      <td><strong>{formatCurrency(ord.total_amount)}</strong></td>
                      <td>
                        <div style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
                          {isAwaitingPay && (
                            <Link
                              to={`/payment/${ord.id}`}
                              className="btn-order-action btn-action-accept"
                              style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                            >
                              <CreditCard size={14} /> Pay Now
                            </Link>
                          )}
                          <Link
                            to={`/tracking/${ord.id}`}
                            state={{ from: '/customer/dashboard' }}
                            className="btn-nav-outline"
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
                          >
                            Track
                          </Link>
                          {isPaid && (
                            <Link
                              to={`/order-summary/${ord.id}`}
                              state={{ from: '/customer/dashboard' }}
                              className="btn-nav-outline"
                              style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}
                            >
                              <Receipt size={14} /> Receipt
                            </Link>
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

      {/* Customer Refund Requests Section */}
      <div className="dashboard-section" id="refund-requests-section">
        <div className="dashboard-section-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <RotateCcw size={22} style={{ color: 'var(--primary-blue)' }} />
            <h2 className="dashboard-section-title" style={{ margin: 0 }}>Refund Requests</h2>
            {!refundsLoading && refundRequests.length > 0 && (
              <span style={{
                background: '#EFF6FF',
                color: 'var(--primary-blue)',
                fontSize: '0.8rem',
                fontWeight: 700,
                padding: '0.2rem 0.55rem',
                borderRadius: '12px'
              }}>
                {refundRequests.length}
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={fetchRefundRequests}
            disabled={refundsLoading}
            className="btn-nav-outline"
            style={{ padding: '0.4rem 0.85rem', fontSize: '0.825rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
            title="Refresh refund claims"
          >
            <RotateCcw size={14} className={refundsLoading ? 'spin-animation' : ''} />
            {refundsLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {refundsLoading ? (
          <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-secondary)' }}>
            <RotateCcw size={24} className="spin-animation" style={{ margin: '0 auto 0.75rem', color: 'var(--primary-blue)' }} />
            <p style={{ margin: 0 }}>Loading your refund requests...</p>
          </div>
        ) : refundsError ? (
          <div style={{
            background: 'var(--color-error-bg, #FEF2F2)',
            border: '1px solid #FECACA',
            borderRadius: 8,
            padding: '1.25rem',
            textAlign: 'center'
          }}>
            <p style={{ color: '#B91C1C', fontWeight: 600, marginBottom: '0.75rem' }}>{refundsError}</p>
            <button
              type="button"
              onClick={fetchRefundRequests}
              className="btn-nav-outline"
              style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}
            >
              Retry
            </button>
          </div>
        ) : refundRequests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem', background: 'var(--bg-subtle, #F8FAFC)', borderRadius: 12 }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              background: '#F1F5F9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 0.75rem',
              color: 'var(--text-muted, #94A3B8)'
            }}>
              <RotateCcw size={24} />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
              No refund requests yet.
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '460px', margin: '0 auto 1.25rem' }}>
              When you submit a refund request for an eligible order, you can monitor its administrator review, approval, and settlement right here.
            </p>
            <Link to="/customer/orders" className="home-btn-primary" style={{ display: 'inline-flex', padding: '0.5rem 1.25rem', fontSize: '0.9rem' }}>
              View Orders to Check Eligibility
            </Link>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="orders-table">
              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Order #</th>
                  <th>Shop</th>
                  <th>Reason</th>
                  <th>Requested Amount</th>
                  <th>Approved Amount</th>
                  <th>Date Submitted</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {refundRequests.map((ref) => {
                  const statusBadge = getRefundStatusBadge(ref.status);
                  const reqAmt = ref.amount_requested ?? ref.requested_amount;
                  const formattedRequested = formatCurrency(reqAmt);
                  const appAmt = ref.amount_approved ?? ref.approved_amount;
                  const parsedApp = parseAmount(appAmt);
                  const isSettled = ['approved', 'completed', 'refunded'].includes(String(ref.status || '').toLowerCase());
                  const formattedApproved = parsedApp !== null && parsedApp > 0
                    ? formatCurrency(parsedApp)
                    : (isSettled ? formattedRequested : '—');
                  const dateStr = ref.created_at
                    ? new Date(ref.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : '—';
                  const updatedStr = ref.updated_at && ref.updated_at !== ref.created_at
                    ? new Date(ref.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : null;

                  const targetOrderId = (typeof ref.order === 'object' && ref.order !== null)
                    ? (ref.order.id || ref.order.order_id)
                    : (ref.order || ref.order_id);

                  return (
                    <tr key={ref.id}>
                      <td>
                        <strong style={{ fontFamily: 'monospace', color: 'var(--dark-blue)', fontSize: '0.85rem' }}>
                          {ref.refund_reference || `#${ref.id}`}
                        </strong>
                      </td>
                      <td>
                        <Link
                          to={`/tracking/${targetOrderId || ref.id}`}
                          state={{ from: '/customer/dashboard' }}
                          style={{ fontWeight: 600, color: 'var(--primary-blue)', textDecoration: 'none' }}
                          title="Track this order"
                        >
                          {ref.order_number || `#${targetOrderId || ref.id}`}
                        </Link>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{ref.shop_name || 'Print Shop'}</div>
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-main)', maxWidth: '200px' }}>
                        <div>{ref.reason_display || ref.reason?.replace(/_/g, ' ')}</div>
                        {ref.explanation && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }} title={ref.explanation}>
                            "{ref.explanation}"
                          </div>
                        )}
                      </td>
                      <td>
                        <strong>{formattedRequested}</strong>
                      </td>
                      <td>
                        <span style={{ color: formattedApproved !== '—' ? '#047857' : 'var(--text-secondary)', fontWeight: formattedApproved !== '—' ? 700 : 400 }}>
                          {formattedApproved}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        <div>{dateStr}</div>
                        {updatedStr && updatedStr !== dateStr && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Updated {updatedStr}</div>
                        )}
                      </td>
                      <td>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '0.25rem 0.55rem',
                            borderRadius: 6,
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            color: statusBadge.color,
                            backgroundColor: statusBadge.bg,
                            border: `1px solid ${statusBadge.color}25`,
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {ref.status_display || statusBadge.label}
                        </span>
                        {ref.decision_reason && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                            {ref.decision_reason}
                          </div>
                        )}
                      </td>
                      <td>
                        <Link
                          to={`/tracking/${targetOrderId || ref.id}#refund-section`}
                          state={{ from: '/customer/dashboard', scrollToRefund: true, refundId: ref.id }}
                          className="btn-nav-outline"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', whiteSpace: 'nowrap' }}
                          title="View order tracking and refund progress"
                        >
                          Track Refund
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Navigation Cards */}
      <div className="dashboard-nav-grid">
        <Link to="/customer/orders" className="stat-card" style={{ textDecoration: 'none' }}>
          <div className="stat-icon blue"><Package size={22} /></div>
          <div>
            <h4 style={{ color: 'var(--dark-blue)', marginBottom: 2 }}>Order History</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>View completed and cancelled orders</p>
          </div>
        </Link>

        <a href="#refund-requests-section" className="stat-card" style={{ textDecoration: 'none' }}>
          <div className="stat-icon amber"><RotateCcw size={22} /></div>
          <div>
            <h4 style={{ color: 'var(--dark-blue)', marginBottom: 2 }}>Refund Requests</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Track claims, approvals, and settlements</p>
          </div>
        </a>

        <Link to="/customer/notifications" className="stat-card" style={{ textDecoration: 'none' }}>
          <div className="stat-icon green"><Bell size={22} /></div>
          <div>
            <h4 style={{ color: 'var(--dark-blue)', marginBottom: 2 }}>Notifications</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Status alerts and shop updates</p>
          </div>
        </Link>

        <Link to="/customer/questions" className="stat-card" style={{ textDecoration: 'none' }}>
          <div className="stat-icon orange"><HelpCircle size={22} /></div>
          <div>
            <h4 style={{ color: 'var(--dark-blue)', marginBottom: 2 }}>My Support Questions</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>View submitted inquiries & responses</p>
          </div>
        </Link>
      </div>
    </div>
  );
};

export default CustomerDashboard;
