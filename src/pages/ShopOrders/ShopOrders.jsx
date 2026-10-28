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
  Calendar,
  Eye,
  FileText,
  Loader2,
  Users
} from 'lucide-react';
import { orderService } from '../../services/api';
import { formatOrderStatus } from '../../utils/formatOrderStatus';
import './ShopOrders.css';

const formatFileSize = (bytes) => {
  if (!bytes || bytes === 0) return '0 KB';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const ShopOrders = () => {
  const { id: targetOrderId } = useParams();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [docLoadingState, setDocLoadingState] = useState({});


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

  const handleViewDocument = async (orderId, doc) => {
    setDocLoadingState((prev) => ({ ...prev, [doc.id]: 'viewing' }));
    try {
      await orderService.viewDocument(orderId, doc.id);
    } catch (err) {
      alert(err.message || 'Unable to open document for preview.');
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


  const isPending = (status) => ['pending_acceptance', 'submitted', 'received'].includes(status);
  const isAwaitingPay = (status) => status === 'awaiting_payment';
  const isInProduction = (status) => ['in_production', 'accepted', 'printing'].includes(status);
  const isReady = (status) => status === 'ready_for_pickup';
  const isCompleted = (status) => status === 'completed';
  const isClosed = (status) => ['rejected', 'expired', 'cancelled'].includes(status);

  const filteredOrders = orders.filter((o) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'active_queue') return Boolean(o.queue_info?.is_active);
    if (statusFilter === 'pending') return isPending(o.status);
    if (statusFilter === 'awaiting_payment') return isAwaitingPay(o.status);
    if (statusFilter === 'production') return isInProduction(o.status);
    if (statusFilter === 'ready') return isReady(o.status);
    if (statusFilter === 'completed') return isCompleted(o.status);
    if (statusFilter === 'closed') return isClosed(o.status);
    return true;
  }).sort((a, b) => {
    if (statusFilter === 'active_queue') {
      const posA = a.queue_info?.position || 9999;
      const posB = b.queue_info?.position || 9999;
      return posA - posB;
    }
    return 0;
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
          className={`filter-chip ${statusFilter === 'active_queue' ? 'active' : ''}`}
          onClick={() => setStatusFilter('active_queue')}
          style={{ borderColor: 'var(--primary-blue)', fontWeight: 700 }}
        >
          <Users size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
          Active Queue ({orders.filter(o => o.queue_info?.is_active).length})
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: '1.2rem', color: 'var(--dark-blue)', fontWeight: 800 }}>
                        Order #{ord.order_number}
                      </h3>

                      {ord.queue_info && (
                        <span
                          className={`shop-queue-tag ${ord.queue_info.is_active ? 'tag-active' : 'tag-done'}`}
                          title={ord.queue_info.is_active ? `Current Position: ${ord.queue_info.position}` : 'Completed or Inactive in Queue'}
                        >
                          <Users size={12} />
                          <strong>Queue {ord.queue_info.queue_number_display || `#${ord.queue_info.queue_number}`}</strong>
                          {ord.queue_info.is_active && ord.queue_info.position ? (
                            <span className="queue-pos-badge">Pos {ord.queue_info.position}</span>
                          ) : null}
                        </span>
                      )}

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
                      Customer: <strong>{ord.customer_name}</strong> • Scheduled: <strong>{ord.pickup_date || 'Standard'} ({ord.pickup_time_slot || 'Anytime'})</strong> • Placed: <strong>{new Date(ord.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}</strong>
                    </div>
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

                {/* Uploaded Customer Documents Section */}
                <div className="order-documents-section">
                  <div className="order-documents-header">
                    <FileText size={15} style={{ color: 'var(--primary-blue, #2563EB)' }} />
                    <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-main, #1E293B)' }}>
                      Customer Uploaded Documents ({ord.documents?.length || 0})
                    </span>
                  </div>

                  {(!ord.documents || ord.documents.length === 0) ? (
                    <div className="order-no-documents-msg">
                      <AlertCircle size={14} style={{ color: 'var(--text-muted)' }} />
                      <span>No document attached to this order.</span>
                    </div>
                  ) : (
                    <div className="order-documents-list">
                      {ord.documents.map((doc) => {
                        const isViewing = docLoadingState[doc.id] === 'viewing';
                        const isDownloading = docLoadingState[doc.id] === 'downloading';
                        const fileExt = (doc.file_type || 'file').toUpperCase();

                        return (
                          <div key={doc.id} className="order-doc-item">
                            <div className="order-doc-info">
                              <span className={`doc-type-pill doc-type-${(doc.file_type || '').toLowerCase()}`}>
                                {fileExt}
                              </span>
                              <div className="order-doc-meta">
                                <span className="order-doc-filename" title={doc.original_filename}>
                                  {doc.original_filename}
                                </span>
                                <span className="order-doc-specs">
                                  {doc.file_size > 0 && <span>{formatFileSize(doc.file_size)} • </span>}
                                  <span>
                                    {doc.page_count || 1} pgs • {doc.copies || 1} {doc.copies > 1 ? 'copies' : 'copy'} • {doc.color_mode === 'color' ? 'Full Color' : 'B&W'} • {doc.paper_size || 'A4'} ({doc.print_side || 'single'})
                                  </span>
                                </span>
                              </div>
                            </div>

                            <div className="order-doc-actions">
                              {doc.is_previewable && (
                                <button
                                  type="button"
                                  className="btn-doc-action btn-doc-view"
                                  disabled={isViewing || isDownloading}
                                  onClick={() => handleViewDocument(ord.id, doc)}
                                  title="Preview document in browser"
                                >
                                  {isViewing ? <Loader2 size={13} className="spin" /> : <Eye size={13} />}
                                  <span>{isViewing ? 'Opening...' : 'View'}</span>
                                </button>
                              )}

                              <button
                                type="button"
                                className="btn-doc-action btn-doc-download"
                                disabled={isViewing || isDownloading}
                                onClick={() => handleDownloadDocument(ord.id, doc)}
                                title="Download document to device"
                              >
                                {isDownloading ? <Loader2 size={13} className="spin" /> : <Download size={13} />}
                                <span>{isDownloading ? 'Saving...' : 'Download'}</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
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
