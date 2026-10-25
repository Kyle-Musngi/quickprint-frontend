import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  CreditCard,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Clock,
  Store,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Calendar,
  ArrowLeft
} from 'lucide-react';
import { orderService, paymentService } from '../../services/api';
import './PaymentPickup.css';

const PaymentPickup = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('gcash');
  const [simulatedOutcome, setSimulatedOutcome] = useState('success');
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    orderService.getOrder(id)
      .then((data) => setOrder(data))
      .catch(() => {
        setErrorMsg('Order not found or access restricted.');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleProcessPayment = async () => {
    setProcessing(true);
    setErrorMsg('');

    try {
      const res = await paymentService.processSandboxPayment({
        order_id: order.id,
        payment_method: paymentMethod,
        simulated_outcome: simulatedOutcome,
      });

      // Navigate to PaymentResult page with transaction details
      navigate(`/payment-result?orderId=${order.id}&status=${simulatedOutcome}&ref=${res.transaction?.transaction_reference || ''}`);
    } catch (err) {
      const msg = err.response?.data?.error || 'Payment simulation failed.';
      setErrorMsg(msg);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-secondary)' }}>
        Loading order details...
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem' }}>
        <h2>Order Not Found</h2>
        <p style={{ color: 'var(--color-error)' }}>{errorMsg}</p>
        <Link to="/customer/orders" style={{ color: 'var(--primary-blue)', marginTop: '1rem', display: 'inline-block' }}>
          Back to Orders
        </Link>
      </div>
    );
  }

  const isPendingAcceptance = order.status === 'pending_acceptance' || order.status === 'submitted';
  const isAwaitingPayment = order.status === 'awaiting_payment' || order.status === 'accepted';
  const isExpired = order.status === 'expired';
  const isRejected = order.status === 'rejected';
  const isPaid = order.payment_status === 'paid';

  return (
    <div className="payment-pickup-page">
      <div className="payment-header">
        <h1 className="payment-title">Sandbox Payment</h1>
        <p className="payment-subtitle">
          Complete test payment simulation for Order #{order.order_number}
        </p>
      </div>

      {/* Mandatory Sandbox Alert Notice */}
      <div className="sandbox-alert-banner">
        <ShieldCheck size={24} style={{ flexShrink: 0 }} />
        <div>
          <strong>Sandbox Payment Mode:</strong> Test Transaction Only. No real money will be transferred from your bank, GCash, or Maya accounts.
        </div>
      </div>

      {/* State Notice Banners */}
      {isPendingAcceptance && (
        <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '1.25rem', borderRadius: 12, marginBottom: '1.5rem', color: '#1E3A8A' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={18} /> Order Pending Shop Review
          </h3>
          <p style={{ fontSize: '0.9rem', marginBottom: '1rem', lineHeight: 1.4 }}>
            The printing shop has not reviewed or accepted this order yet. Payment is only unlocked once the shop approves your request to avoid unnecessary refunds.
          </p>
          <Link to={`/tracking/${order.id}`} className="home-btn-primary" style={{ display: 'inline-flex', padding: '0.6rem 1.2rem', fontSize: '0.9rem' }}>
            Track Order Status
          </Link>
        </div>
      )}

      {isExpired && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', padding: '1.25rem', borderRadius: 12, marginBottom: '1.5rem', color: '#991B1B' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={18} /> Payment Deadline Expired
          </h3>
          <p style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>
            The payment window for this order has expired. Reserved shop capacity has been released. Please place a new printing order.
          </p>
          <Link to="/upload-print" className="home-btn-primary" style={{ display: 'inline-flex', padding: '0.6rem 1.2rem', fontSize: '0.9rem' }}>
            Create New Order
          </Link>
        </div>
      )}

      {isRejected && (
        <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', padding: '1.25rem', borderRadius: 12, marginBottom: '1.5rem', color: '#991B1B' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.35rem' }}>
            Order Rejected by Shop
          </h3>
          <p style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
            Reason: {order.rejection_reason || 'Shop unavailable at requested schedule.'}
          </p>
          <p style={{ fontSize: '0.85rem', color: '#64748B' }}>
            No payment was charged. You may select another shop in the area.
          </p>
        </div>
      )}

      {isPaid && (
        <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '1.25rem', borderRadius: 12, marginBottom: '1.5rem', color: '#166534' }}>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={18} /> Payment Confirmed
          </h3>
          <p style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>
            This order has already been paid and is in production!
          </p>
          <Link to={`/tracking/${order.id}`} className="home-btn-primary" style={{ display: 'inline-flex', padding: '0.6rem 1.2rem', fontSize: '0.9rem' }}>
            View Production Status
          </Link>
        </div>
      )}

      {errorMsg && (
        <div style={{ backgroundColor: 'var(--color-error-bg)', color: 'var(--color-error)', padding: '1rem', borderRadius: 8, marginBottom: '1.5rem', fontWeight: 500 }}>
          <AlertTriangle size={18} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
          {errorMsg}
        </div>
      )}

      {/* Order Summary Snapshot */}
      <div className="payment-card">
        <h2 className="payment-card-title">
          <Store size={20} style={{ color: 'var(--primary-blue)' }} /> Order Overview
        </h2>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--dark-blue)' }}>{order.shop?.name}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{order.shop?.address}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>PAYABLE AMOUNT</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary-blue)' }}>
              ₱{parseFloat(order.total_amount).toFixed(2)}
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.85rem' }}>
          <div>
            <span style={{ color: 'var(--text-secondary)' }}>Scheduled Pickup: </span>
            <strong>{order.pickup_date || 'Standard'}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-secondary)' }}>Time Slot: </span>
            <strong>{order.pickup_time_slot || 'Regular hours'}</strong>
          </div>
          {order.payment_deadline && isAwaitingPayment && (
            <div style={{ gridColumn: 'span 2', background: '#FEF3C7', padding: '0.5rem 0.75rem', borderRadius: 6, color: '#92400E', fontWeight: 600 }}>
              Payment Deadline: {new Date(order.payment_deadline).toLocaleString()}
            </div>
          )}
        </div>
      </div>

      {/* Payment Method Selection (Only active when awaiting payment) */}
      {isAwaitingPayment && (
        <div className="payment-card">
          <h2 className="payment-card-title">
            <CreditCard size={20} style={{ color: 'var(--primary-blue)' }} /> Select Sandbox Payment Method
          </h2>

          <div className="methods-grid">
            {/* GCash */}
            <div
              className={`method-card ${paymentMethod === 'gcash' ? 'active' : ''}`}
              onClick={() => setPaymentMethod('gcash')}
            >
              <div className="method-icon-wrap gcash-bg">G</div>
              <div className="method-name">GCash</div>
              <div className="method-tag">Sandbox e-Wallet</div>
            </div>

            {/* Maya */}
            <div
              className={`method-card ${paymentMethod === 'maya' ? 'active' : ''}`}
              onClick={() => setPaymentMethod('maya')}
            >
              <div className="method-icon-wrap maya-bg">M</div>
              <div className="method-name">Maya</div>
              <div className="method-tag">Sandbox e-Wallet</div>
            </div>

            {/* GoTyme */}
            <div
              className={`method-card ${paymentMethod === 'gotyme' ? 'active' : ''}`}
              onClick={() => setPaymentMethod('gotyme')}
            >
              <div className="method-icon-wrap gotyme-bg">GT</div>
              <div className="method-name">GoTyme Bank</div>
              <div className="method-tag">Sandbox Bank Transfer</div>
            </div>
          </div>

          {/* Sandbox Outcome Simulation Controller */}
          <div className="simulation-box">
            <div className="simulation-title">
              <HelpCircle size={16} /> Sandbox Simulation Outcome
            </div>
            <div className="sim-outcomes">
              <label className="sim-radio-label" style={{ color: 'var(--color-success)' }}>
                <input
                  type="radio"
                  name="simOutcome"
                  value="success"
                  checked={simulatedOutcome === 'success'}
                  onChange={() => setSimulatedOutcome('success')}
                />
                <CheckCircle2 size={16} /> Simulate Success (Paid)
              </label>
              <label className="sim-radio-label" style={{ color: 'var(--color-warning)' }}>
                <input
                  type="radio"
                  name="simOutcome"
                  value="pending"
                  checked={simulatedOutcome === 'pending'}
                  onChange={() => setSimulatedOutcome('pending')}
                />
                <Clock size={16} /> Simulate Pending Payment
              </label>
              <label className="sim-radio-label" style={{ color: 'var(--color-error)' }}>
                <input
                  type="radio"
                  name="simOutcome"
                  value="failed"
                  checked={simulatedOutcome === 'failed'}
                  onChange={() => setSimulatedOutcome('failed')}
                />
                <XCircle size={16} /> Simulate Failed Transaction
              </label>
            </div>
          </div>

          <button
            type="button"
            className="btn-process-payment"
            onClick={handleProcessPayment}
            disabled={processing || isPaid}
          >
            {processing ? 'Simulating Sandbox Payment...' : `Simulate ₱${parseFloat(order.total_amount).toFixed(2)} Payment`} <ArrowRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
};

export default PaymentPickup;
