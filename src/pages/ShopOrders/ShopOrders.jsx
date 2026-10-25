import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Package,
  CheckCircle,
  XCircle,
  Printer,
  Clock,
  Download,
  AlertCircle,
  RotateCcw,
  Check,
  CreditCard,
  Calendar
} from 'lucide-react';
import { orderService } from '../../services/api';
import { formatOrderStatus } from '../../utils/formatOrderStatus';
import './ShopOrders.css';

const ShopOrders = () => {
  const { id: targetOrderId } = useParams();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchShopOrders = async () => {
    try {
      const data = await orderService.getOrders({ view: 'shop' });
      const list = Array.isArray(data) ? data : (data.results || []);
      setOrders(list);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShopOrders();
    const interval = setInterval(fetchShopOrders, 12000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (targetOrderId && orders.length > 0) {
      const el = document.getElementById(`order-card-${targetOrderId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [targetOrderId, orders]);

  const handleAction = async (orderId, actionFn, arg) => {
    setActionLoadingId(orderId);
    try {
      await actionFn(orderId, arg);
      await fetchShopOrders();
    } catch (err) {
      alert(err.response?.data?.error || err.response?.data?.detail || 'Action failed.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = (orderId) => {
    const reason = window.prompt('Please enter reason for rejecting this order:');
    if (reason && reason.trim()) {
      handleAction(orderId, orderService.rejectOrder, reason.trim());
    }
  };

  const handleConfirmPickup = (orderId, pickupCode) => {
    const code = window.prompt(`Confirm customer pickup. Enter pickup code (${pickupCode || ''}):`, pickupCode || '');
    if (code !== null) {
      handleAction(orderId, orderService.confirmPickup, code.trim());
    }
  };

  const isPending = (status) => ['pending_acceptance', 'submitted', 'received'].includes(status);
  const isAwaitingPay = (status) => status === 'awaiting_payment';
  const isInProduction = (status) => ['in_production', 'accepted', 'printing'].includes(status);
  const isReady = (status) => status === 'ready_for_pickup';
  const isCompleted = (status) => status === 'completed';
  const isClosed = (status) => ['rejected', 'expired', 'cancelled'].includes(status);

  const filteredOrders = orders.filter((o) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'pending') return isPending(o.status);
    if (statusFilter === 'awaiting_payment') return isAwaitingPay(o.status);
    if (statusFilter === 'production') return isInProduction(o.status);
    if (statusFilter === 'ready') return isReady(o.status);
    if (statusFilter === 'completed') return isCompleted(o.status);
    if (statusFilter === 'closed') return isClosed(o.status);
    return true;
  });

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'pending_acceptance':
      case 'submitted':
      case 'received':
        return { bg: '#FEF3C7', color: '#B45309', label: 'Pending Acceptance' };
      case 'awaiting_payment':
        return { bg: '#FFF7ED', color: '#C2410C', label: 'Awaiting Payment' };
      case 'in_production':
      case 'accepted':
      case 'printing':
        return { bg: '#EFF6FF', color: 'var(--primary-blue)', label: 'In Production' };
      case 'ready_for_pickup':
        return { bg: '#FAF5FF', color: '#9333EA', label: 'Ready for Pickup' };
      case 'completed':
        return { bg: 'var(--color-success-bg)', color: 'var(--color-success)', label: 'Completed' };
      case 'rejected':
        return { bg: '#FEE2E2', color: '#DC2626', label: 'Rejected' };
      case 'expired':
        return { bg: '#F3F4F6', color: '#4B5563', label: 'Expired' };
      case 'cancelled':
        return { bg: '#F3F4F6', color: '#6B7280', label: 'Cancelled' };
      default:
        return { bg: '#F3F4F6', color: '#374151', label: formatOrderStatus(status) };
    }
  };

  return (
    <div className="shop-orders-page">
      <div className="shop-orders-header">
        <div>
          <h1 className="shop-orders-title">Shop Orders Queue</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Review incoming student print requests, accept orders to issue payment requests, and manage production workflow.
          </p>
        </div>

        <button onClick={fetchShopOrders} className="btn-nav-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
          <RotateCcw size={16} /> Refresh Queue
        </button>
      </div>

      {/* Filter Chips */}
      <div className="orders-filter-chips">
        <button
          className={`filter-chip ${statusFilter === 'all' ? 'active' : ''}`}
          onClick={() => setStatusFilter('all')}
        >
          All Orders ({orders.length})
        </button>
        <button
          className={`filter-chip ${statusFilter === 'pending' ? 'active' : ''}`}
          onClick={() => setStatusFilter('pending')}
        >
          Pending Review ({orders.filter(o => isPending(o.status)).length})
        </button>
        <button
          className={`filter-chip ${statusFilter === 'awaiting_payment' ? 'active' : ''}`}
          onClick={() => setStatusFilter('awaiting_payment')}
        >
          Awaiting Payment ({orders.filter(o => isAwaitingPay(o.status)).length})
        </button>
        <button
          className={`filter-chip ${statusFilter === 'production' ? 'active' : ''}`}
          onClick={() => setStatusFilter('production')}
        >
          In Production ({orders.filter(o => isInProduction(o.status)).length})
        </button>
        <button
          className={`filter-chip ${statusFilter === 'ready' ? 'active' : ''}`}
          onClick={() => setStatusFilter('ready')}
        >
          Ready for Pickup ({orders.filter(o => isReady(o.status)).length})
        </button>
        <button
          className={`filter-chip ${statusFilter === 'completed' ? 'active' : ''}`}
          onClick={() => setStatusFilter('completed')}
        >
          Completed ({orders.filter(o => isCompleted(o.status)).length})
        </button>
        <button
          className={`filter-chip ${statusFilter === 'closed' ? 'active' : ''}`}
          onClick={() => setStatusFilter('closed')}
        >
          Rejected / Expired ({orders.filter(o => isClosed(o.status)).length})
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
          Loading order queue...
        </div>
      ) : filteredOrders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', background: '#fff', borderRadius: 12, border: '1px solid var(--border-color)' }}>
          <Package size={36} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem' }} />
          <h3 style={{ color: 'var(--dark-blue)', marginBottom: '0.5rem' }}>No orders in this category</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Orders matching this status will appear here automatically.</p>
        </div>
      ) : (
        <div>
          {filteredOrders.map((ord) => {
            const badge = getStatusBadgeStyle(ord.status);
            return (
              <div
                key={ord.id}
                id={`order-card-${ord.id}`}
                className="shop-order-card"
                style={
                  String(ord.id) === String(targetOrderId)
                    ? { border: '2px solid var(--primary-blue)', boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.2)' }
                    : undefined
                }
              >
                <div className="shop-order-top">
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
                      <h3 style={{ fontSize: '1.2rem', color: 'var(--dark-blue)', fontWeight: 800 }}>
                        Order #{ord.order_number}
                      </h3>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.65rem',
                        borderRadius: 20,
                        textTransform: 'uppercase',
                        backgroundColor: badge.bg,
                        color: badge.color,
                      }}>
                        {badge.label}
                      </span>

                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        padding: '0.15rem 0.5rem',
                        borderRadius: 12,
                        textTransform: 'uppercase',
                        backgroundColor: ord.payment_status === 'paid' ? '#DCFCE7' : '#FEF3C7',
                        color: ord.payment_status === 'paid' ? '#15803D' : '#B45309',
                      }}>
                        {ord.payment_status === 'paid' ? 'Paid' : 'Unpaid'}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Customer: <strong>{ord.customer_name}</strong> • Scheduled Pickup: <strong>{ord.pickup_date || 'Standard'} ({ord.pickup_time_slot || 'Anytime'})</strong>
                    </div>

                    {ord.document && (
                      <div style={{ marginTop: '0.4rem', fontSize: '0.82rem' }}>
                        <a
                          href={ord.document}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: 'var(--primary-blue)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontWeight: 600 }}
                        >
                          <Download size={14} /> Download Document
                        </a>
                        <span style={{ margin: '0 0.5rem', color: 'var(--text-muted)' }}>•</span>
                        <span>{ord.pages || 1} pages × {ord.copies || 1} copies</span>
                      </div>
                    )}
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    {ord.pickup_code ? (
                      <div className="order-code-badge">{ord.pickup_code}</div>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Code pending acceptance</span>
                    )}
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--dark-blue)', marginTop: '0.25rem' }}>
                      ₱{parseFloat(ord.total_amount).toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* State notices */}
                {isAwaitingPay(ord.status) && (
                  <div className="shop-order-notice-box notice-awaiting-pay">
                    <CreditCard size={16} />
                    <span>
                      Order accepted! Waiting for customer to pay before starting production.
                      {ord.payment_deadline && (
                        <strong> (Payment deadline: {new Date(ord.payment_deadline).toLocaleString()})</strong>
                      )}
                    </span>
                  </div>
                )}

                {ord.status === 'rejected' && (
                  <div className="shop-order-notice-box notice-rejected">
                    <XCircle size={16} />
                    <span>Rejected: {ord.rejection_reason || 'No reason provided.'}</span>
                  </div>
                )}

                {ord.status === 'expired' && (
                  <div className="shop-order-notice-box notice-expired">
                    <AlertCircle size={16} />
                    <span>Payment deadline expired without payment. Pickup capacity has been released.</span>
                  </div>
                )}

                {/* Action Buttons Workflow */}
                <div className="order-actions-bar">
                  {/* 1. If Pending Acceptance: Shop can Accept or Reject */}
                  {isPending(ord.status) && (
                    <>
                      <button
                        className="btn-order-action btn-action-accept"
                        disabled={actionLoadingId === ord.id}
                        onClick={() => handleAction(ord.id, orderService.acceptOrder)}
                      >
                        <Check size={16} /> Accept Order (Issues UQP Code & Requests Payment)
                      </button>
                      <button
                        className="btn-order-action btn-action-reject"
                        disabled={actionLoadingId === ord.id}
                        onClick={() => handleReject(ord.id)}
                      >
                        <XCircle size={16} /> Reject Order
                      </button>
                    </>
                  )}

                  {/* 2. If Awaiting Payment: Shop must wait for payment confirmation */}
                  {isAwaitingPay(ord.status) && (
                    <button
                      className="btn-order-action btn-action-disabled"
                      disabled={true}
                      title="Customer must complete payment before production begins"
                    >
                      <Clock size={16} /> Waiting for Customer Payment
                    </button>
                  )}

                  {/* 3. If In Production / Paid: Mark Ready for Pickup */}
                  {isInProduction(ord.status) && (
                    <button
                      className="btn-order-action btn-action-ready"
                      disabled={actionLoadingId === ord.id}
                      onClick={() => handleAction(ord.id, orderService.readyForPickup)}
                    >
                      <Clock size={16} /> Mark Ready for Pickup
                    </button>
                  )}

                  {/* 4. If Ready for Pickup: Confirm Pickup */}
                  {isReady(ord.status) && (
                    <button
                      className="btn-order-action btn-action-pickup"
                      disabled={actionLoadingId === ord.id}
                      onClick={() => handleConfirmPickup(ord.id, ord.pickup_code)}
                    >
                      <CheckCircle size={16} /> Confirm Customer Pickup
                    </button>
                  )}

                  {isCompleted(ord.status) && (
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-success)', fontWeight: 600 }}>
                      ✓ Order completed & picked up
                    </span>
                  )}

                  <Link to={`/tracking/${ord.id}`} className="btn-nav-outline" style={{ fontSize: '0.85rem', marginLeft: 'auto' }}>
                    View Full Tracking Details
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ShopOrders;
