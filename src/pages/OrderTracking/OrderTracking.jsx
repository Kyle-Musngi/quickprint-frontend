import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Clock,
  CheckCircle2,
  Store,
  Calendar,
  AlertCircle,
  RotateCcw,
  Receipt,
  CreditCard,
  Star,
  ArrowRight,
  ShieldAlert,
  Send,
  Users,
  Eye,
  Download,
  Loader2,
  FileText,
  DollarSign,
  HelpCircle
} from 'lucide-react';
import { orderService, shopService, paymentService } from '../../services/api';
import './OrderTracking.css';

const RATING_LABELS = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Very Good',
  5: 'Excellent'
};

const OrderTracking = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [docLoadingState, setDocLoadingState] = useState({});

  // Refund states
  const [refundEligibility, setRefundEligibility] = useState(null);
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [refundReason, setRefundReason] = useState('cancelled_before_printing');
  const [refundExplanation, setRefundExplanation] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [submittingRefund, setSubmittingRefund] = useState(false);
  const [cancellingRefundId, setCancellingRefundId] = useState(null);
  const [refundToast, setRefundToast] = useState({ text: '', type: '' });

  const handleViewDocument = async (orderId, doc) => {
    setDocLoadingState((prev) => ({ ...prev, [doc.id]: 'viewing' }));
    try {
      await orderService.viewDocument(orderId, doc.id);
    } catch (err) {
      alert(err.message || 'Unable to preview document.');
    } finally {
      setDocLoadingState((prev) => ({ ...prev, [doc.id]: null }));
    }
  };

  const handleDownloadDocument = async (orderId, doc) => {
    setDocLoadingState((prev) => ({ ...prev, [doc.id]: 'downloading' }));
    try {
      await orderService.downloadDocument(orderId, doc.id, doc.original_filename);
    } catch (err) {
      alert(err.message || 'Unable to download document.');
    } finally {
      setDocLoadingState((prev) => ({ ...prev, [doc.id]: null }));
    }
  };


  // Review state
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState('');
  const [reviewError, setReviewError] = useState('');

  const fetchRefundEligibility = async () => {
    try {
      const data = await paymentService.getRefundEligibility(id);
      setRefundEligibility(data);
      if (data?.remaining_refundable_balance) {
        setRefundAmount(data.remaining_refundable_balance);
      }
    } catch {
      setRefundEligibility(null);
    }
  };

  const fetchOrder = async () => {
    try {
      const data = await orderService.getOrder(id);
      setOrder(data);
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || 'Order tracking details not found.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    fetchRefundEligibility();
    // 10-second polling for live status tracking
    const interval = setInterval(() => {
      fetchOrder();
      fetchRefundEligibility();
    }, 10000);
    return () => clearInterval(interval);
  }, [id]);

  const showRefundToast = (text, type = 'success') => {
    setRefundToast({ text, type });
    setTimeout(() => setRefundToast({ text: '', type: '' }), 5000);
  };

  const handleOpenRefundModal = () => {
    if (refundEligibility?.remaining_refundable_balance) {
      setRefundAmount(refundEligibility.remaining_refundable_balance);
    }
    setRefundExplanation('');
    setRefundModalOpen(true);
  };

  const handleCreateRefund = async (e) => {
    e.preventDefault();
    setSubmittingRefund(true);
    try {
      await paymentService.createRefundRequest({
        order_id: order.id,
        reason: refundReason,
        customer_explanation: refundExplanation.trim(),
        requested_amount: parseFloat(refundAmount) || undefined
      });
      showRefundToast('Refund request submitted successfully. The shop owner and admin will review it.', 'success');
      setRefundModalOpen(false);
      await fetchRefundEligibility();
      await fetchOrder();
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.detail || 'Failed to submit refund request.';
      alert(msg);
    } finally {
      setSubmittingRefund(false);
    }
  };

  const handleCancelRefund = async (refundId) => {
    if (!window.confirm('Are you sure you want to cancel this pending refund request?')) return;
    setCancellingRefundId(refundId);
    try {
      await paymentService.cancelRefund(refundId);
      showRefundToast('Refund request has been cancelled.', 'info');
      await fetchRefundEligibility();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to cancel refund request.');
    } finally {
      setCancellingRefundId(null);
    }
  };

  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    setCancelling(true);
    try {
      await orderService.cancelOrder(order.id, 'Cancelled by customer');
      await fetchOrder();
      await fetchRefundEligibility();
    } catch (err) {
      alert(err.response?.data?.error || 'Could not cancel order.');
    } finally {
      setCancelling(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!order?.shop?.id) return;

    setSubmittingReview(true);
    setReviewError('');
    setReviewSuccessMsg('');

    try {
      await shopService.submitShopReview(order.shop.id, {
        order_id: order.id,
        rating,
        review_text: reviewText.trim()
      });
      setReviewSuccessMsg('Thank you! Your rating and review have been published.');
      await fetchOrder();
    } catch (err) {
      setReviewError(err.response?.data?.error || 'Failed to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-secondary)' }}>
        Loading order status timeline...
      </div>
    );
  }

  if (errorMsg || !order) {
    return (
      <div style={{ maxWidth: 600, margin: '4rem auto', padding: '2rem', textAlign: 'center', background: '#fff', borderRadius: 12 }}>
        <AlertCircle size={40} style={{ color: 'var(--color-error)', margin: '0 auto 1rem' }} />
        <h2>Order Not Found</h2>
        <p style={{ color: 'var(--text-secondary)', margin: '1rem 0' }}>{errorMsg}</p>
        <Link to="/customer/orders" className="home-btn-primary">
          Back to Orders
        </Link>
      </div>
    );
  }

  const steps = [
    {
      key: 'pending_acceptance',
      title: '1. Order Submitted',
      desc: 'Received by print shop. Awaiting shop owner review & acceptance.'
    },
    {
      key: 'awaiting_payment',
      title: '2. Accepted by Shop',
      desc: 'Shop approved order. Awaiting payment before production begins.'
    },
    {
      key: 'in_production',
      title: '3. In Production',
      desc: 'Payment confirmed. Documents being printed & prepared.'
    },
    {
      key: 'ready_for_pickup',
      title: '4. Ready for Pickup',
      desc: 'Printed & packaged. Ready at shop counter with your pickup code.'
    },
    {
      key: 'completed',
      title: '5. Completed',
      desc: 'Order picked up and confirmed.'
    },
  ];

  // Map legacy & active statuses to timeline indices
  const getStatusIndex = (st) => {
    switch (st) {
      case 'pending_acceptance':
      case 'submitted':
      case 'received':
        return 0;
      case 'awaiting_payment':
      case 'accepted':
        return 1;
      case 'in_production':
      case 'printing':
        return 2;
      case 'ready_for_pickup':
        return 3;
      case 'completed':
        return 4;
      default:
        return -1;
    }
  };

  const currentIndex = getStatusIndex(order.status);
  const isPendingAcceptance = order.status === 'pending_acceptance' || order.status === 'submitted';
  const isAwaitingPayment = order.status === 'awaiting_payment' || order.status === 'accepted';
  const isExpired = order.status === 'expired';
  const isRejected = order.status === 'rejected';
  const isCompleted = order.status === 'completed';

  return (
    <div className="order-tracking-page">
      <div className="tracking-header">
        <div>
          <h1 className="tracking-title">Track Order</h1>
          <p className="tracking-sub">Order #{order.order_number}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button onClick={fetchOrder} className="btn-nav-outline" title="Refresh status">
            <RotateCcw size={16} /> Refresh
          </button>
          <Link to={`/order-summary/${order.id}`} className="btn-nav-outline">
            <Receipt size={16} /> Receipt
          </Link>
        </div>
      </div>

      {/* Prominent Callout: Awaiting Payment after Shop Acceptance */}
      {isAwaitingPayment && (
        <div className="awaiting-payment-callout">
          <div className="callout-content">
            <h3>🎉 Shop Accepted Your Order!</h3>
            <p>
              {order.shop?.name} has reviewed your requirements and approved this order.
              Please complete payment of <strong>₱{parseFloat(order.total_amount).toFixed(2)}</strong> to start printing.
            </p>
            {order.payment_deadline && (
              <div className="deadline-pill">
                <Clock size={14} />
                Payment Deadline: {new Date(order.payment_deadline).toLocaleString()}
              </div>
            )}
          </div>
          <div>
            <Link to={`/payment/${order.id}`} className="btn-pay-now-large">
              <CreditCard size={18} /> Pay Now (Sandbox) <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      )}

      {/* Pending Shop Acceptance Notice */}
      {isPendingAcceptance && (
        <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '1.25rem', borderRadius: 12, marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <Clock size={22} style={{ color: 'var(--primary-blue, #2563EB)', flexShrink: 0 }} />
          <div>
            <strong style={{ color: '#1E3A8A' }}>Pending Shop Review:</strong> The shop owner is reviewing your documents, print options, and requested pickup time. You will be notified the moment they accept your order so you can proceed to payment.
          </div>
        </div>
      )}

      {/* Prominent Global Pickup Code Banner (Ready for pickup / In Production) */}
      {order.pickup_code && !isPendingAcceptance && (
        <div className="pickup-code-banner">
          <div>
            <div className="pickup-code-label">GLOBAL PICKUP CODE</div>
            <div className="pickup-code-display">{order.pickup_code}</div>
            <p style={{ color: '#DBEAFE', fontSize: '0.85rem', marginTop: '0.25rem' }}>
              Present this code at {order.shop?.name} counter upon collection.
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', padding: '0.4rem 0.8rem', borderRadius: 20, fontSize: '0.8rem', fontWeight: 600 }}>
              {order.status === 'ready_for_pickup' ? 'Ready for Pickup Now' : 'Code Active'}
            </span>
          </div>
        </div>
      )}

      {/* Rejection / Expiration alerts */}
      {isRejected && (
        <div style={{ backgroundColor: 'var(--color-error-bg)', color: 'var(--color-error)', padding: '1.25rem', borderRadius: 12, marginBottom: '2rem' }}>
          <h4 style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Order Rejected by Shop</h4>
          <p style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>Reason: {order.rejection_reason || 'Shop unavailable at requested schedule'}</p>
          <small style={{ color: '#64748B' }}>No payment was charged. You may place a new order with another shop.</small>
        </div>
      )}

      {isExpired && (
        <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B', padding: '1.25rem', borderRadius: 12, marginBottom: '2rem' }}>
          <h4 style={{ fontWeight: 700, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldAlert size={18} /> Payment Deadline Expired
          </h4>
          <p style={{ fontSize: '0.9rem' }}>
            Payment was not completed before the expiration deadline. Reserved pickup capacity has been released.
          </p>
        </div>
      )}

      {order.status === 'cancelled' && (
        <div style={{ backgroundColor: '#F1F5F9', color: 'var(--text-secondary)', padding: '1.25rem', borderRadius: 12, marginBottom: '2rem' }}>
          <h4 style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Order Cancelled</h4>
          <p style={{ fontSize: '0.9rem' }}>Reason: {order.cancellation_reason || 'Cancelled by customer'}</p>
        </div>
      )}

      {/* FEATURE: Printing Queue Card */}
      {order.queue_info && (
        <div className="printing-queue-card">
          <div className="queue-card-header">
            <div className="queue-header-left">
              <Users size={20} className="queue-header-icon" />
              <div>
                <h3 className="queue-card-title">Live Printing Queue</h3>
                <p className="queue-shop-subtitle">Shop: <strong>{order.queue_info.shop_name || order.shop?.name}</strong></p>
              </div>
            </div>
            <div className="queue-header-right">
              <span className={`queue-badge-pill ${order.queue_info.is_active ? 'badge-active' : 'badge-inactive'}`}>
                {order.queue_info.is_active ? 'In Active Queue' : 'Queue Finished'}
              </span>
            </div>
          </div>

          <div className="queue-grid">
            {/* 1. Permanent Queue Number */}
            <div className="queue-metric-box metric-ticket">
              <div className="metric-label">Queue Number</div>
              <div className="metric-val ticket-number">{order.queue_info.queue_number_display || `#${order.queue_info.queue_number}`}</div>
              <div className="metric-hint">Your permanent shop ticket for today</div>
            </div>

            {/* 2. Dynamic Queue Position */}
            <div className="queue-metric-box metric-position">
              <div className="metric-label">Current Position</div>
              <div className="metric-val position-number">
                {order.queue_info.is_active ? (
                  order.queue_info.position === 1 ? '1st' : `${order.queue_info.position}`
                ) : '—'}
              </div>
              <div className="metric-hint">
                {order.queue_info.is_active 
                  ? (order.queue_info.position === 1 ? 'You are next in line!' : `Position in shop line`)
                  : 'Order has exited active queue'}
              </div>
            </div>

            {/* 3. Orders Ahead */}
            <div className="queue-metric-box metric-ahead">
              <div className="metric-label">Orders Ahead</div>
              <div className="metric-val ahead-number">
                {order.queue_info.is_active ? order.queue_info.orders_ahead : 0}
              </div>
              <div className="metric-hint">
                {order.queue_info.is_active 
                  ? (order.queue_info.orders_ahead === 0 ? 'No orders ahead of you' : `${order.queue_info.orders_ahead} eligible orders ahead`)
                  : 'No active orders ahead'}
              </div>
            </div>

            {/* 4. Estimated Wait Time */}
            <div className="queue-metric-box metric-wait">
              <div className="metric-label">Estimated Wait</div>
              <div className="metric-val wait-text">
                {order.queue_info.estimated_wait_display || 'Calculating...'}
              </div>
              <div className="metric-hint">Based on shop queue & pages</div>
            </div>
          </div>

          <div className="queue-explainer-footer">
            <div className="explainer-item">
              <Clock size={14} />
              <span>
                <strong>Queue Number vs. Position:</strong> Your <strong>Queue Number ({order.queue_info.queue_number_display})</strong> is your permanent assigned ticket. Your <strong>Current Position ({order.queue_info.is_active ? order.queue_info.position : 'Completed'})</strong> updates dynamically in real-time as preceding orders finish printing.
              </span>
            </div>
            <div className="queue-last-updated">
              Last updated: {new Date(order.queue_info.updated_at || Date.now()).toLocaleTimeString()} (Updates automatically)
            </div>
          </div>
        </div>
      )}

      {/* Status Timeline */}
      <div className="tracking-card">
        <h2 className="tracking-card-title">
          <Clock size={20} style={{ color: 'var(--primary-blue)' }} /> Production & Delivery Status
        </h2>

        <div className="timeline">
          {steps.map((st, idx) => {
            let stateClass = 'upcoming';

            if (currentIndex === idx) {
              stateClass = 'current';
            } else if (currentIndex > idx) {
              stateClass = 'completed';
            }

            return (
              <div key={st.key} className={`timeline-step ${stateClass}`}>
                <div className="timeline-dot">
                  {stateClass === 'completed' ? '✓' : idx + 1}
                </div>
                <div className="timeline-content">
                  <h4>{st.title}</h4>
                  <p>{st.desc}</p>
                  {stateClass === 'current' && (
                    <div className="timeline-time">Current State</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Cancellation option if early in the lifecycle */}
        {(isPendingAcceptance || isAwaitingPayment) && (
          <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', textAlign: 'right' }}>
            <button
              onClick={handleCancelOrder}
              disabled={cancelling}
              style={{ color: 'var(--color-error)', fontSize: '0.85rem', fontWeight: 600, border: 'none', background: 'none', cursor: 'pointer' }}
            >
              {cancelling ? 'Cancelling...' : 'Cancel this Order'}
            </button>
          </div>
        )}
      </div>

      {/* Fulfillment Information */}
      <div className="tracking-card">
        <h2 className="tracking-card-title">
          <Store size={20} style={{ color: 'var(--primary-blue)' }} /> Fulfillment Information
        </h2>

        <div className="tracking-info-grid">
          <div className="info-item">
            <span className="info-item-label">Print Shop</span>
            <span className="info-item-value">{order.shop?.name}</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {order.shop?.address}, {order.shop?.city}
            </span>
          </div>

          <div className="info-item">
            <span className="info-item-label">Pickup Schedule</span>
            <span className="info-item-value">
              {order.pickup_date ? `${order.pickup_date} (${order.pickup_time_slot || 'Regular hours'})` : 'Standard Pickup'}
            </span>
          </div>

          <div className="info-item">
            <span className="info-item-label">Payment Status</span>
            <span className="info-item-value" style={{ textTransform: 'uppercase', color: order.payment_status === 'paid' ? 'var(--color-success)' : isAwaitingPayment ? '#D97706' : 'var(--text-secondary)' }}>
              {order.payment_status}
            </span>
          </div>

          <div className="info-item">
            <span className="info-item-label">Total Amount</span>
            <span className="info-item-value" style={{ color: 'var(--primary-blue)', fontSize: '1.25rem' }}>
              ₱{parseFloat(order.total_amount).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Documents attached */}
        <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
          <h4 style={{ fontSize: '0.9rem', color: 'var(--dark-blue)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <FileText size={16} style={{ color: 'var(--primary-blue)' }} /> Included Documents ({order.documents?.length || 0}):
          </h4>
          <div className="tracking-doc-list">
            {order.documents?.map((doc) => {
              const isViewing = docLoadingState[doc.id] === 'viewing';
              const isDownloading = docLoadingState[doc.id] === 'downloading';

              return (
                <div key={doc.id} className="tracking-doc-item">
                  <div className="tracking-doc-meta">
                    <span className="tracking-doc-name">{doc.original_filename}</span>
                    <span className="tracking-doc-specs">
                      {doc.page_count} pgs • {doc.copies} copy • {doc.color_mode === 'color' ? 'Color' : 'B&W'} • ₱{parseFloat(doc.calculated_total).toFixed(2)}
                    </span>
                  </div>
                  <div className="tracking-doc-actions">
                    {doc.is_previewable && (
                      <button
                        type="button"
                        className="btn-tracking-doc"
                        disabled={isViewing || isDownloading}
                        onClick={() => handleViewDocument(order.id, doc)}
                        title="Preview document"
                      >
                        {isViewing ? <Loader2 size={13} className="spin" /> : <Eye size={13} />}
                        <span>{isViewing ? 'Opening...' : 'View'}</span>
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn-tracking-doc"
                      disabled={isViewing || isDownloading}
                      onClick={() => handleDownloadDocument(order.id, doc)}
                      title="Download document"
                    >
                      {isDownloading ? <Loader2 size={13} className="spin" /> : <Download size={13} />}
                      <span>{isDownloading ? 'Saving...' : 'Download'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Toast Alert */}
      {refundToast.text && (
        <div style={{
          backgroundColor: refundToast.type === 'success' ? '#ECFDF5' : '#EFF6FF',
          color: refundToast.type === 'success' ? '#065F46' : 'var(--primary-blue)',
          border: `1px solid ${refundToast.type === 'success' ? '#A7F3D0' : '#BFDBFE'}`,
          padding: '0.85rem 1.25rem',
          borderRadius: 8,
          marginBottom: '1.5rem',
          fontWeight: 600
        }}>
          {refundToast.text}
        </div>
      )}

      {/* FEATURE 4: Customer Refund Management Section */}
      {(refundEligibility?.existing_refunds?.length > 0 || refundEligibility?.eligible) && (
        <div className="tracking-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
            <h2 className="tracking-card-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <DollarSign size={20} style={{ color: 'var(--primary-blue)' }} /> Refund Management
            </h2>
            {refundEligibility?.eligible && (
              <button
                type="button"
                onClick={handleOpenRefundModal}
                className="btn-order-action btn-action-neutral"
                style={{ padding: '0.4rem 0.9rem', fontSize: '0.85rem' }}
              >
                Request a Refund
              </button>
            )}
          </div>

          {refundEligibility?.eligible && (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
              This order is currently eligible for a refund of up to <strong>₱{parseFloat(refundEligibility.remaining_refundable_balance).toFixed(2)}</strong>.
            </p>
          )}

          {refundEligibility?.existing_refunds?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {refundEligibility.existing_refunds.map((ref) => (
                <div key={ref.id} style={{
                  border: '1px solid var(--border-color)',
                  borderRadius: 8,
                  padding: '1rem',
                  backgroundColor: 'var(--bg-subtle)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <div>
                      <span style={{ fontWeight: 700, color: 'var(--dark-blue)' }}>Claim #{ref.id}</span>
                      <span style={{ marginLeft: '0.5rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        Reason: {ref.reason.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <span className="badge badge-warning" style={{ textTransform: 'uppercase', fontWeight: 700 }}>
                      {ref.status}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                    Requested: <strong>₱{parseFloat(ref.requested_amount).toFixed(2)}</strong>
                    {ref.approved_amount && (
                      <span style={{ marginLeft: '1rem', color: 'var(--color-success)', fontWeight: 700 }}>
                        Approved: ₱{parseFloat(ref.approved_amount).toFixed(2)}
                      </span>
                    )}
                  </div>

                  {ref.customer_explanation && (
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                      <em>Note: "{ref.customer_explanation}"</em>
                    </div>
                  )}

                  {ref.decision_notes && (
                    <div style={{ fontSize: '0.85rem', color: 'var(--dark-blue)', backgroundColor: '#ffffff', padding: '0.5rem 0.75rem', borderRadius: 6, marginBottom: '0.5rem', border: '1px solid var(--border-color)' }}>
                      <strong>Decision Note:</strong> {ref.decision_notes}
                    </div>
                  )}

                  {ref.status.toLowerCase() === 'pending' && (
                    <div style={{ textAlign: 'right', marginTop: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => handleCancelRefund(ref.id)}
                        disabled={cancellingRefundId === ref.id}
                        style={{ color: 'var(--color-error)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
                      >
                        {cancellingRefundId === ref.id ? 'Cancelling...' : 'Cancel Refund Request'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      )}

      {/* FEATURE 2: Rate This Shop Section (Only on Completed Orders) */}
      {isCompleted && (
        <div className="review-card-section">
          <h2 className="tracking-card-title">
            <Star size={20} style={{ color: '#F59E0B' }} /> Rate & Review {order.shop?.name}
          </h2>

          {order.is_reviewed || order.review ? (
            <div className="existing-review-box">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ fontWeight: 700, color: 'var(--dark-blue)' }}>Your Rating:</span>
                <div style={{ display: 'flex', color: '#F59E0B' }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={18}
                      fill={star <= (order.review?.rating || 5) ? '#F59E0B' : 'none'}
                      stroke="#F59E0B"
                    />
                  ))}
                </div>
                <span style={{ fontSize: '0.85rem', color: '#64748B' }}>
                  ({order.review?.rating || 5}/5 - {RATING_LABELS[order.review?.rating || 5]})
                </span>
              </div>
              {order.review?.review_text && (
                <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontStyle: 'italic', margin: '0.5rem 0' }}>
                  "{order.review.review_text}"
                </p>
              )}
              <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                Submitted on {order.review?.created_at ? new Date(order.review.created_at).toLocaleDateString() : 'recently'}
              </div>
            </div>
          ) : (
            <form onSubmit={handleReviewSubmit}>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                Help fellow students by rating print quality, paper finish, turnaround time, and shop customer service.
              </p>

              {reviewError && (
                <div style={{ backgroundColor: '#FEF2F2', color: '#DC2626', padding: '0.75rem', borderRadius: 8, fontSize: '0.85rem', margin: '1rem 0' }}>
                  {reviewError}
                </div>
              )}

              {reviewSuccessMsg && (
                <div style={{ backgroundColor: '#F0FDF4', color: '#166534', padding: '0.75rem', borderRadius: 8, fontSize: '0.85rem', margin: '1rem 0' }}>
                  {reviewSuccessMsg}
                </div>
              )}

              {/* 5-Star Selector */}
              <div className="rating-stars-interactive" role="radiogroup" aria-label="Rating scale 1 to 5 stars">
                {[1, 2, 3, 4, 5].map((star) => {
                  const activeVal = hoverRating || rating;
                  return (
                    <button
                      key={star}
                      type="button"
                      className={`star-rating-btn ${star <= activeVal ? 'active' : ''}`}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      aria-label={`${star} star: ${RATING_LABELS[star]}`}
                    >
                      <Star
                        size={28}
                        fill={star <= activeVal ? '#F59E0B' : 'none'}
                        stroke="#F59E0B"
                      />
                    </button>
                  );
                })}
                <span className="star-label-hint">
                  {RATING_LABELS[hoverRating || rating]} ({hoverRating || rating}/5)
                </span>
              </div>

              {/* Optional Review Text */}
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', display: 'block', marginTop: '0.75rem' }}>
                Written Review (Optional)
              </label>
              <textarea
                className="review-textarea"
                rows="3"
                placeholder="Share your experience (e.g. crisp printing, fast pickup counter, neat thesis binding)..."
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                maxLength={1000}
              />

              <div style={{ marginTop: '1rem', textAlign: 'right' }}>
                <button
                  type="submit"
                  className="home-btn-primary"
                  disabled={submittingReview}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.65rem 1.4rem' }}
                >
                  <Send size={16} />
                  {submittingReview ? 'Submitting Review...' : 'Submit Review'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Modal: Request a Refund */}
      {refundModalOpen && (
        <div className="admin-modal-overlay" onClick={() => setRefundModalOpen(false)}>
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 style={{ margin: 0, color: 'var(--dark-blue)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <DollarSign size={20} style={{ color: 'var(--primary-blue)' }} /> Request Refund for Order #{order.order_number}
              </h3>
              <button type="button" className="admin-modal-close" onClick={() => setRefundModalOpen(false)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleCreateRefund}>
              <div className="admin-modal-body">
                <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '0.75rem 1rem', borderRadius: 8, marginBottom: '1.25rem', fontSize: '0.9rem' }}>
                  <div>Total Order Paid: <strong>₱{parseFloat(refundEligibility?.total_paid || order.total_amount).toFixed(2)}</strong></div>
                  <div>Maximum Refundable Balance: <strong>₱{parseFloat(refundEligibility?.remaining_refundable_balance || 0).toFixed(2)}</strong></div>
                </div>

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>
                    Reason for Refund:
                  </label>
                  <select
                    className="form-input"
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    required
                  >
                    <option value="cancelled_before_printing">Customer cancelled before printing started</option>
                    <option value="shop_rejected">Shop rejected the order</option>
                    <option value="shop_unfulfillable">Shop cannot complete the order</option>
                    <option value="duplicate_payment">Duplicate payment</option>
                    <option value="incorrect_defective_printing">Incorrect or defective printing</option>
                    <option value="payment_unconfirmed_order">Payment succeeded but order not confirmed</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>
                    Requested Amount (₱):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={refundEligibility?.remaining_refundable_balance || order.total_amount}
                    className="form-input"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>
                    Explanation / Details (Optional):
                  </label>
                  <textarea
                    className="form-input"
                    rows={3}
                    placeholder="Provide details about why you are requesting a refund..."
                    value={refundExplanation}
                    onChange={(e) => setRefundExplanation(e.target.value)}
                  />
                </div>
              </div>
              <div className="admin-modal-footer">
                <button type="button" className="btn-nav-outline" onClick={() => setRefundModalOpen(false)}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-order-action btn-action-accept"
                  disabled={submittingRefund}
                >
                  {submittingRefund ? 'Submitting...' : 'Submit Refund Claim'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderTracking;
