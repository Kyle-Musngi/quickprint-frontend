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
        const orderList = Array.isArray(ordersRes) ? ordersRes : (ordersRes.results || []);
        const paymentList = Array.isArray(paymentsRes) ? paymentsRes : (paymentsRes.results || []);
        setOrders(orderList);
        setPayments(paymentList);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Include ALL non-closed orders in Active Orders (including awaiting_payment, submitted, accepted, in_production, ready_for_pickup)
  const isClosed = (st) => ['completed', 'cancelled', 'rejected', 'expired'].includes(st);
  const activeOrders = orders.filter((o) => !isClosed(o.status));
  const completedOrders = orders.filter((o) => o.status === 'completed');
  const readyForPickup = orders.filter((o) => o.status === 'ready_for_pickup');

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
                  <th>Date</th>
                  <th>Shop</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Payment Status</th>
                  <th>Order Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {activeOrders.map((ord) => {
                  const payBadge = getPaymentStatusBadge(ord.payment_status);
                  const isAwaitingPay = ['awaiting_payment', 'accepted'].includes(ord.status) && ord.payment_status !== 'paid';

                  return (
                    <tr key={ord.id}>
                      <td>
                        <strong>{ord.order_number}</strong>
                        {ord.pickup_code && (
                          <div style={{ marginTop: '0.2rem' }}>
                            <span style={{ background: '#EFF6FF', color: 'var(--primary-blue)', fontWeight: 800, padding: '0.15rem 0.4rem', borderRadius: 4, fontSize: '0.78rem' }}>
                              Code: {ord.pickup_code}
                            </span>
                          </div>
                        )}
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {ord.created_at ? new Date(ord.created_at).toLocaleDateString() : 'Recent'}
                      </td>
                      <td>{ord.shop_name || 'Print Shop'}</td>
                      <td style={{ fontSize: '0.85rem' }}>
                        {ord.documents?.length || ord.document_count || 1} document(s)
                      </td>
                      <td><strong>₱{parseFloat(ord.total_amount).toFixed(2)}</strong></td>
                      <td>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '0.25rem 0.55rem',
                            borderRadius: 6,
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            color: payBadge.color,
                            backgroundColor: payBadge.bg
                          }}
                        >
                          {payBadge.label}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${getOrderStatusBadge(ord.status)}`}>
                          {formatOrderStatus(ord.status)}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'inline-flex', gap: '0.4rem', alignItems: 'center' }}>
                          {isAwaitingPay && (
                            <Link
                              to={`/payment/${ord.id}`}
                              className="btn-order-action btn-action-accept"
                              style={{ padding: '0.3rem 0.65rem', fontSize: '0.8rem', textDecoration: 'none' }}
                            >
                              Pay Now
                            </Link>
                          )}
                          <Link
                            to={`/tracking/${ord.id}`}
                            className="btn-nav-outline"
                            style={{ padding: '0.3rem 0.65rem', fontSize: '0.8rem' }}
                          >
                            Track
                          </Link>
                          <Link
                            to={`/order-summary/${ord.id}`}
                            className="btn-nav-outline"
                            style={{ padding: '0.3rem 0.65rem', fontSize: '0.8rem' }}
                          >
                            Receipt
                          </Link>
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
