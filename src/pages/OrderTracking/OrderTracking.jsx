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
  FileText
} from 'lucide-react';
import { orderService, shopService } from '../../services/api';
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
    // 10-second polling for live status tracking
    const interval = setInterval(fetchOrder, 10000);
    return () => clearInterval(interval);
  }, [id]);

  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    setCancelling(true);
    try {
      await orderService.cancelOrder(order.id, 'Cancelled by customer');
      await fetchOrder();
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
    </div>
  );
};

export default OrderTracking;
