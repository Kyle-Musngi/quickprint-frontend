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
  Receipt
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { orderService, paymentService } from '../../services/api';
import { formatOrderStatus, getOrderStatusBadge, getPaymentStatusBadge } from '../../utils/formatOrderStatus';
import './CustomerDashboard.css';

const CustomerDashboard = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const isActiveOrder = (ord) => {
    if (!ord || !ord.status) return false;
    const st = String(ord.status).toLowerCase().trim();
    if (CLOSED_STATUSES.includes(st)) return false;
    return ACTIVE_STATUSES.includes(st) || !CLOSED_STATUSES.includes(st);
  };

  const activeOrders = orders.filter(isActiveOrder);
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
            <div className="stat-num">{activeOrders.length}</div>
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
        ) : activeOrders.length === 0 ? (
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
                {activeOrders.map((ord) => {
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
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                            <span style={{
                              fontWeight: 700,
                              color: ord.queue_info.is_active ? '#2563EB' : 'var(--text-secondary)',
                              fontSize: '0.85rem'
                            }}>
                              Queue {ord.queue_info.queue_number_display || `#${ord.queue_info.queue_number}`}
                            </span>
                            {ord.queue_info.is_active && ord.queue_info.position ? (
                              <span style={{
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                background: '#EFF6FF',
                                color: '#1D4ED8',
                                padding: '0.1rem 0.4rem',
                                borderRadius: 4,
                                border: '1px solid #BFDBFE'
                              }}>
                                Pos {ord.queue_info.position}
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
                      <td><strong>₱{parseFloat(ord.total_amount).toFixed(2)}</strong></td>
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
                            className="btn-nav-outline"
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
                          >
                            Track
                          </Link>
                          {isPaid && (
                            <Link
                              to={`/order-summary/${ord.id}`}
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

      {/* Quick Navigation Cards */}
      <div className="dashboard-nav-grid">
        <Link to="/customer/orders" className="stat-card" style={{ textDecoration: 'none' }}>
          <div className="stat-icon blue"><Package size={22} /></div>
          <div>
            <h4 style={{ color: 'var(--dark-blue)', marginBottom: 2 }}>Order History</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>View completed and cancelled orders</p>
          </div>
        </Link>

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
