import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { Printer, ArrowLeft, Download, CheckCircle, CreditCard, AlertCircle } from 'lucide-react';
import { orderService } from '../../services/api';
import './OrderSummary.css';

const OrderSummary = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const handleBack = () => {
    // If the customer arrived from in-app navigation (e.g. from Track Order), pop back
    // so we don't push a redundant Track Order entry to history.
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      // Safe fallback when accessed directly
      navigate(`/tracking/${order.id}`, {
        replace: true,
        state: { from: location.state?.from || '/customer/orders' }
      });
    }
  };

  useEffect(() => {
    orderService.getOrder(id)
      .then((data) => setOrder(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-secondary)' }}>Loading order details...</div>;
  }

  if (!order) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem' }}>
        <h2>Order Not Found</h2>
        <Link to="/customer/orders" style={{ color: 'var(--primary-blue)', marginTop: '1rem', display: 'inline-block' }}>
          Back to Orders
        </Link>
      </div>
    );
  }

  const isPaid = String(order.payment_status || '').toLowerCase().trim() === 'paid';
  const isAwaitingPay = ['awaiting_payment', 'accepted'].includes(String(order.status || '').toLowerCase().trim()) && !isPaid;

  return (
    <div className="order-summary-page">
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <button
          type="button"
          onClick={handleBack}
          className="back-link"
          aria-label="Back to Live Tracking"
        >
          <ArrowLeft size={16} /> <span>Back to Live Tracking</span>
        </button>
        <div style={{ display: 'inline-flex', gap: '0.5rem', alignItems: 'center' }}>
          {isAwaitingPay && (
            <Link
              to={`/payment/${order.id}`}
              className="btn-order-action btn-action-accept"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.45rem 0.9rem', fontSize: '0.85rem', textDecoration: 'none' }}
            >
              <CreditCard size={15} /> Pay Now (₱{parseFloat(order.total_amount).toFixed(2)})
            </Link>
          )}
          {isPaid && (
            <button
              onClick={() => window.print()}
              className="btn-nav-outline"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 0.9rem' }}
            >
              <Printer size={16} /> Print Receipt
            </button>
          )}
        </div>
      </div>

      {!isPaid && (
        <div style={{
          background: '#FFF7ED',
          border: '1px solid #FED7AA',
          color: '#9A3412',
          padding: '0.85rem 1.25rem',
          borderRadius: 8,
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          fontSize: '0.9rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={18} style={{ color: '#EA580C', flexShrink: 0 }} />
            <span>
              <strong>Unpaid Order Summary:</strong> Payment has not been completed. Official payment receipts are generated only after payment is verified.
            </span>
          </div>
          {isAwaitingPay && (
            <Link
              to={`/payment/${order.id}`}
              style={{ color: '#EA580C', fontWeight: 700, textDecoration: 'underline' }}
            >
              Proceed to Payment &rarr;
            </Link>
          )}
        </div>
      )}

      <div className="summary-sheet">
        <div className="summary-header">
          <div>
            <div style={{ fontSize: '0.8rem', color: isPaid ? '#15803D' : 'var(--primary-blue)', fontWeight: 700, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              {isPaid ? (
                <>
                  <CheckCircle size={14} style={{ color: '#15803D' }} /> Univ Quick Print Official Payment Receipt
                </>
              ) : (
                'Univ Quick Print Order Summary & Invoice'
              )}
            </div>
            <div className="summary-ref">{order.order_number}</div>
            <div className="summary-date">Submitted on {new Date(order.created_at).toLocaleString()}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
            {isPaid ? (
              <span style={{
                background: '#DCFCE7',
                color: '#15803D',
                fontWeight: 800,
                padding: '0.25rem 0.65rem',
                borderRadius: 6,
                fontSize: '0.8rem',
                border: '1px solid #86EFAC'
              }}>
                PAYMENT CONFIRMED
              </span>
            ) : (
              <span style={{
                background: '#FFF7ED',
                color: '#C2410C',
                fontWeight: 800,
                padding: '0.25rem 0.65rem',
                borderRadius: 6,
                fontSize: '0.8rem',
                border: '1px solid #FED7AA'
              }}>
                PAYMENT UNPAID
              </span>
            )}
            {order.pickup_code && (
              <div style={{ background: '#EFF6FF', border: '1px dashed var(--primary-blue)', padding: '0.4rem 0.8rem', borderRadius: 8, textAlign: 'center' }}>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>PICKUP CODE</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary-blue)' }}>{order.pickup_code}</div>
              </div>
            )}
          </div>
        </div>

        <div className="summary-grid-2">
          <div>
            <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>PRINTING SHOP</h4>
            <div style={{ fontWeight: 700, color: 'var(--dark-blue)' }}>{order.shop?.name}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{order.shop?.address}, {order.shop?.city}</div>
          </div>
          <div>
            <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>PICKUP SCHEDULE</h4>
            <div style={{ fontWeight: 700, color: 'var(--dark-blue)' }}>{order.pickup_date || 'Standard pickup'}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{order.pickup_time_slot || 'Regular hours'}</div>
          </div>
        </div>

        <table className="summary-table">
          <thead>
            <tr>
              <th>Document</th>
              <th>Pages</th>
              <th>Configuration</th>
              <th>Copies</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {order.documents?.map((doc) => (
              <tr key={doc.id}>
                <td><strong>{doc.original_filename}</strong></td>
                <td>{doc.page_count}</td>
                <td>{doc.paper_size} • {doc.color_mode} • {doc.print_side}</td>
                <td>{doc.copies}</td>
                <td style={{ fontWeight: 700 }}>₱{parseFloat(doc.calculated_total).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="summary-total-box" style={{ background: isPaid ? '#F0FDF4' : '#FFF7ED', borderColor: isPaid ? '#BBF7D0' : '#FED7AA', color: isPaid ? '#15803D' : '#9A3412' }}>
          {isPaid
            ? `Total Paid: ₱${parseFloat(order.total_amount).toFixed(2)} (Official Receipt)`
            : `Amount Due: ₱${parseFloat(order.total_amount).toFixed(2)} (Unpaid)`}
        </div>
      </div>
    </div>
  );
};

export default OrderSummary;
