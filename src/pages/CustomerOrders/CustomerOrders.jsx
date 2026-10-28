import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, Printer, CreditCard, Star, Clock, ArrowLeft } from 'lucide-react';
import { orderService, paymentService } from '../../services/api';
import {
  formatOrderStatus,
  formatPaymentStatus,
  getOrderStatusBadge,
  getOrderRefundBadge
} from '../../utils/formatOrderStatus';
import { formatCurrency } from '../../utils/formatCurrency';
import './CustomerOrders.css';

const CustomerOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [refunds, setRefunds] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); // all, active, completed, cancelled
  const [loading, setLoading] = useState(true);

  const handleBack = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate('/customer/dashboard');
    }
  };

  useEffect(() => {
    Promise.all([
      orderService.getOrders(),
      paymentService.getRefunds().catch(() => [])
    ])
      .then(([ordersData, refundsData]) => {
        const rawOrders = Array.isArray(ordersData) ? ordersData : (ordersData.results || []);
        const rawRefunds = Array.isArray(refundsData) ? refundsData : (refundsData.results || []);
        // Deduplicate orders by ID to ensure clean list
        const uniqueOrders = Array.from(new Map(rawOrders.map((o) => [o.id, o])).values());
        setOrders(uniqueOrders);
        setRefunds(rawRefunds);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const getOrderRefundInfo = (ord) => {
    if (!ord) return null;
    // 1. Direct object from order serializer
    if (ord.refund_request) return ord.refund_request;
    // 2. Cross-reference from refunds list
    const found = refunds.find((r) => {
      const rOrderId = r.order?.id ?? r.order;
      if (rOrderId && rOrderId === ord.id) return true;
      if (ord.order_number && (r.order_number === ord.order_number || r.order?.order_number === ord.order_number)) return true;
      return false;
    });
    if (found) return found;
    // 3. Fallback to serializer refund_status if present
    if (ord.refund_status) {
      return {
        status: ord.refund_status,
        status_display: ord.refund_status_display
      };
    }
    return null;
  };

  const isActiveStatus = (st) => [
    'pending_acceptance',
    'submitted',
    'received',
    'awaiting_payment',
    'in_production',
    'accepted',
    'printing',
    'ready_for_pickup'
  ].includes(st);

  const isClosedStatus = (st) => ['cancelled', 'rejected', 'expired'].includes(st);

  const filteredOrders = orders.filter((o) => {
    if (activeTab === 'active') {
      const refundInfo = getOrderRefundInfo(o);
      const isRefunding = refundInfo && ['pending', 'under_review', 'processing'].includes(String(refundInfo.status || '').toLowerCase().trim());
      // Active tab in full order list view includes active workflow orders and refunding orders
      return isActiveStatus(o.status) || isRefunding;
    }
    if (activeTab === 'completed') return o.status === 'completed';
    if (activeTab === 'cancelled') return isClosedStatus(o.status);
    return true; // 'all' includes every order
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending_acceptance':
      case 'submitted':
      case 'received':
        return { label: 'Pending Acceptance', color: '#B45309', bg: '#FEF3C7' };
      case 'awaiting_payment':
      case 'accepted':
        return { label: 'Awaiting Payment', color: '#C2410C', bg: '#FFF7ED' };
      case 'in_production':
      case 'printing':
        return { label: 'In Production', color: 'var(--primary-blue)', bg: '#EFF6FF' };
      case 'ready_for_pickup':
        return { label: 'Ready for Pickup', color: '#9333EA', bg: '#FAF5FF' };
      case 'completed':
        return { label: 'Completed', color: 'var(--color-success)', bg: 'var(--color-success-bg)' };
      case 'rejected':
        return { label: 'Rejected', color: 'var(--color-error)', bg: 'var(--color-error-bg)' };
      case 'expired':
        return { label: 'Expired', color: '#4B5563', bg: '#F3F4F6' };
      case 'cancelled':
        return { label: 'Cancelled', color: '#6B7280', bg: '#F3F4F6' };
      default:
        return { label: formatOrderStatus(status), color: 'var(--text-main)', bg: '#F3F4F6' };
    }
  };

  return (
    <div className="customer-orders-page">
      <div className="orders-header">
        <div className="orders-header-title-wrap">
          <button
            type="button"
            className="orders-back-btn"
            onClick={handleBack}
            aria-label="Back to dashboard"
          >
            <ArrowLeft size={18} />
            <span>Back</span>
          </button>
          <div>
            <h1 className="orders-title">My Orders</h1>
            <p style={{ color: 'var(--text-secondary)' }}>View and track all your printing orders.</p>
          </div>
        </div>
        <Link to="/upload-print" className="home-btn-primary">
          <Printer size={18} /> New Print Order
        </Link>
      </div>

      <div className="order-tabs-bar">
        <div className={`order-tab ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>
          All Orders ({orders.length})
        </div>
        <div className={`order-tab ${activeTab === 'active' ? 'active' : ''}`} onClick={() => setActiveTab('active')}>
          Active ({orders.filter(o => {
            const refInfo = getOrderRefundInfo(o);
            const isRefunding = refInfo && ['pending', 'under_review', 'processing'].includes(String(refInfo.status || '').toLowerCase().trim());
            return isActiveStatus(o.status) || isRefunding;
          }).length})
        </div>
        <div className={`order-tab ${activeTab === 'completed' ? 'active' : ''}`} onClick={() => setActiveTab('completed')}>
          Completed ({orders.filter(o => o.status === 'completed').length})
        </div>
        <div className={`order-tab ${activeTab === 'cancelled' ? 'active' : ''}`} onClick={() => setActiveTab('cancelled')}>
          Cancelled / Expired ({orders.filter(o => isClosedStatus(o.status)).length})
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          Loading your orders...
        </div>
      ) : filteredOrders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', background: '#fff', borderRadius: 12, border: '1px solid var(--border-color)' }}>
          <Package size={36} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem' }} />
          <h3 style={{ color: 'var(--dark-blue)', marginBottom: '0.5rem' }}>No orders found</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            You don't have any orders under this category.
          </p>
          <Link to="/shops" className="home-btn-primary" style={{ display: 'inline-flex' }}>
            Find a Shop & Print
          </Link>
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 12, border: '1px solid var(--border-color)', overflowX: 'auto' }}>
          <table className="orders-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Shop</th>
                <th>Pickup Code</th>
                <th>Pickup Schedule</th>
                <th>Order Status</th>
                <th>Payment Status</th>
                <th>Refund Status</th>
                <th>Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((ord) => {
                const orderBadge = getStatusBadge(ord.status);
                const refundInfo = getOrderRefundInfo(ord);
                const refundBadge = refundInfo ? getOrderRefundBadge(refundInfo.status) : null;

                return (
                  <tr key={ord.id}>
                    <td>
                      <strong>{ord.order_number}</strong>
                      {ord.queue_info?.queue_number_display && (
                        <div className="queue-pill-container" style={{ marginTop: '4px' }}>
                          <span className="queue-ticket-tag" style={{ fontSize: '0.74rem' }}>
                            Queue {ord.queue_info.queue_number_display}
                          </span>
                          {ord.queue_info.is_active && ord.queue_info.position != null ? (
                            <span className="queue-position-tag" style={{ fontSize: '0.68rem', padding: '0.12rem 0.4rem' }}>
                              Position {ord.queue_info.position}
                            </span>
                          ) : null}
                        </div>
                      )}
                    </td>
                    <td>{ord.shop_name}</td>
                    <td>
                      {ord.pickup_code ? (
                        <span style={{ background: '#EFF6FF', color: 'var(--primary-blue)', fontWeight: 800, padding: '0.2rem 0.5rem', borderRadius: 4 }}>
                          {ord.pickup_code}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                    <td>{ord.pickup_date || 'Standard'} ({ord.pickup_time_slot || 'Anytime'})</td>
                    <td>
                      <span style={{
                        display: 'inline-block',
                        fontWeight: 700,
                        fontSize: '0.78rem',
                        padding: '0.2rem 0.55rem',
                        borderRadius: 12,
                        textTransform: 'uppercase',
                        backgroundColor: orderBadge.bg,
                        color: orderBadge.color
                      }}>
                        {orderBadge.label}
                      </span>
                    </td>
                    <td>
                      <span style={{
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        color: ord.payment_status === 'paid' ? 'var(--color-success)' : '#B45309'
                      }}>
                        {formatPaymentStatus(ord.payment_status)}
                      </span>
                    </td>
                    <td>
                      {refundBadge ? (
                        <span style={{
                          display: 'inline-block',
                          fontWeight: 700,
                          fontSize: '0.78rem',
                          padding: '0.2rem 0.55rem',
                          borderRadius: 12,
                          textTransform: 'uppercase',
                          backgroundColor: refundBadge.bg,
                          color: refundBadge.color,
                          border: refundBadge.border || 'none',
                          whiteSpace: 'nowrap'
                        }}>
                          {refundBadge.label}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                    <td><strong>{formatCurrency(ord.total_amount)}</strong></td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        {['awaiting_payment', 'accepted'].includes(ord.status) && ord.payment_status !== 'paid' ? (
                          <Link
                            to={`/payment/${ord.id}`}
                            className="btn-primary"
                            style={{
                              padding: '0.35rem 0.75rem',
                              fontSize: '0.8rem',
                              backgroundColor: '#EA580C',
                              color: '#fff',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.3rem',
                              borderRadius: 4,
                              fontWeight: 700,
                              textDecoration: 'none'
                            }}
                          >
                            <CreditCard size={14} /> Pay Now
                          </Link>
                        ) : ord.status === 'completed' ? (
                          ord.is_reviewed ? (
                            <Link
                              to={`/tracking/${ord.id}`}
                              state={{ from: '/customer/orders' }}
                              className="btn-nav-outline"
                              style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', color: 'var(--color-success)' }}
                            >
                              Reviewed ✓
                            </Link>
                          ) : (
                            <Link
                              to={`/tracking/${ord.id}`}
                              state={{ from: '/customer/orders' }}
                              className="btn-nav-outline"
                              style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', borderColor: '#F59E0B', color: '#B45309', fontWeight: 700 }}
                            >
                              <Star size={13} style={{ fill: '#F59E0B', color: '#F59E0B' }} /> Rate Shop
                            </Link>
                          )
                        ) : (
                          <Link
                            to={`/tracking/${ord.id}`}
                            state={{ from: '/customer/orders' }}
                            className="btn-nav-outline"
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
                          >
                            Track
                          </Link>
                        )}

                        {refundInfo && (
                          <Link
                            to={`/tracking/${ord.id}#refund-section`}
                            state={{ from: '/customer/orders', scrollToRefund: true, refundId: refundInfo.id }}
                            className="btn-nav-outline"
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem', borderColor: '#BFDBFE', color: '#1D4ED8', fontWeight: 600 }}
                            title="Track refund request status and details"
                          >
                            Track Refund
                          </Link>
                        )}

                        {String(ord.payment_status || '').toLowerCase().trim() === 'paid' && (
                          <Link
                            to={`/order-summary/${ord.id}`}
                            state={{ from: '/customer/orders' }}
                            className="btn-nav-outline"
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
                          >
                            Receipt
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
  );
};

export default CustomerOrders;
