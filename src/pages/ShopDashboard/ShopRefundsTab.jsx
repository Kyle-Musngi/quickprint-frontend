import React, { useState, useEffect } from 'react';
import {
  RotateCcw,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Eye,
  FileText,
  DollarSign,
  AlertTriangle
} from 'lucide-react';
import { paymentService } from '../../services/api';
import { formatCurrency, parseAmount } from '../../utils/formatCurrency';

const ShopRefundsTab = () => {
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Modal states
  const [selectedRefund, setSelectedRefund] = useState(null);
  const [actionModal, setActionModal] = useState(null); // { type: 'approve' | 'reject', refund: obj }
  const [actionNotes, setActionNotes] = useState('');
  const [approvedAmount, setApprovedAmount] = useState('');

  const fetchRefunds = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const data = await paymentService.getRefunds({ view: 'shop' });
      const list = Array.isArray(data) ? data : (data.results || []);
      setRefunds(list);
    } catch (err) {
      setErrorMsg(err.response?.data?.error || err.response?.data?.detail || 'Failed to load refund requests.');
      setRefunds([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRefunds();
  }, []);

  const handleOpenAction = (type, refund) => {
    setActionModal({ type, refund });
    setActionNotes('');
    const rawReq = refund.amount_requested ?? refund.requested_amount;
    const parsed = parseAmount(rawReq);
    setApprovedAmount(parsed !== null ? parsed.toFixed(2) : '');
  };

  const handleConfirmAction = async () => {
    if (!actionModal) return;
    const { type, refund } = actionModal;
    if (type === 'reject' && !actionNotes.trim()) {
      alert('Please provide a reason for rejecting this refund request.');
      return;
    }

    const rawReq = refund.amount_requested ?? refund.requested_amount;
    const maxEligible = parseAmount(rawReq);

    let finalApprovedAmount = null;
    if (type === 'approve') {
      const parsedApproved = parseAmount(approvedAmount);
      if (parsedApproved === null || parsedApproved <= 0) {
        alert('Please specify a valid approved refund amount greater than ₱0.00.');
        return;
      }
      if (maxEligible !== null && parsedApproved > maxEligible) {
        alert(`Approved refund amount (${formatCurrency(parsedApproved)}) cannot exceed the eligible requested amount (${formatCurrency(maxEligible)}).`);
        return;
      }
      finalApprovedAmount = parsedApproved;
    }

    setActionLoadingId(refund.id);
    try {
      const payload = {
        action: type,
        decision_notes: actionNotes.trim(),
        amount_approved: finalApprovedAmount
      };

      await paymentService.processRefundAction(refund.id, payload);
      setActionModal(null);
      await fetchRefunds();
    } catch (err) {
      alert(err.response?.data?.error || err.response?.data?.detail || 'Failed to update refund request.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredRefunds = refunds.filter((r) => {
    if (statusFilter === 'all') return true;
    return r.status.toLowerCase() === statusFilter.toLowerCase();
  });

  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'approved' || s === 'completed') return 'badge-success';
    if (s === 'pending' || s === 'under_review') return 'badge-warning';
    if (s === 'rejected' || s === 'failed') return 'badge-error';
    return 'badge-secondary';
  };

  return (
    <div className="shop-refunds-tab" style={{ padding: '1rem 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--dark-blue)', margin: 0 }}>
            Customer Refund Requests
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Review customer refund claims for cancelled, defective, or rejected orders.
          </p>
        </div>
        <button
          type="button"
          onClick={fetchRefunds}
          className="btn-nav-outline"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <RotateCcw size={15} /> Refresh Requests
        </button>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {['all', 'pending', 'under_review', 'approved', 'rejected', 'completed'].map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setStatusFilter(tab)}
            className={`btn-nav-outline ${statusFilter === tab ? 'active' : ''}`}
            style={{
              padding: '0.4rem 0.9rem',
              fontSize: '0.85rem',
              textTransform: 'capitalize',
              backgroundColor: statusFilter === tab ? 'var(--primary-blue)' : 'transparent',
              color: statusFilter === tab ? '#ffffff' : 'var(--text-secondary)',
              borderColor: statusFilter === tab ? 'var(--primary-blue)' : 'var(--border-color)'
            }}
          >
            {tab.replace('_', ' ')}
          </button>
        ))}
      </div>

      {errorMsg && (
        <div style={{ padding: '1rem', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8, color: '#991B1B', marginBottom: '1.5rem' }}>
          {errorMsg}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          Loading refund records...
        </div>
      ) : filteredRefunds.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3.5rem 1.5rem', backgroundColor: '#ffffff', border: '1px solid var(--border-color)', borderRadius: 12 }}>
          <DollarSign size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 0.75rem' }} />
          <h3 style={{ color: 'var(--dark-blue)', marginBottom: '0.25rem' }}>No Refund Requests Found</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            There are no refund requests matching the current filter.
          </p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', backgroundColor: '#ffffff', borderRadius: 12, border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
          <table className="orders-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left', backgroundColor: 'var(--bg-subtle)' }}>
                <th style={{ padding: '0.9rem 1rem' }}>Order #</th>
                <th style={{ padding: '0.9rem 1rem' }}>Customer</th>
                <th style={{ padding: '0.9rem 1rem' }}>Reason</th>
                <th style={{ padding: '0.9rem 1rem' }}>Requested Amount</th>
                <th style={{ padding: '0.9rem 1rem' }}>Status</th>
                <th style={{ padding: '0.9rem 1rem' }}>Submitted</th>
                <th style={{ padding: '0.9rem 1rem', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRefunds.map((refund) => (
                <tr key={refund.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.9rem 1rem', fontWeight: 700, color: 'var(--dark-blue)' }}>
                    {refund.order_number || `#${refund.order}`}
                  </td>
                  <td style={{ padding: '0.9rem 1rem' }}>
                    {refund.customer_name || 'Customer'}
                  </td>
                  <td style={{ padding: '0.9rem 1rem' }}>
                    <div style={{ fontWeight: 600 }}>{refund.reason}</div>
                    {refund.customer_explanation && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', maxWidth: 260, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {refund.customer_explanation}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '0.9rem 1rem', fontWeight: 700 }}>
                    {formatCurrency(refund.amount_requested ?? refund.requested_amount)}
                  </td>
                  <td style={{ padding: '0.9rem 1rem' }}>
                    <span className={`badge ${getStatusBadge(refund.status)}`} style={{ padding: '0.25rem 0.6rem', borderRadius: 6, fontSize: '0.78rem', textTransform: 'uppercase', fontWeight: 700 }}>
                      {refund.status}
                    </span>
                  </td>
                  <td style={{ padding: '0.9rem 1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {new Date(refund.created_at).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '0.9rem 1rem', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        className="btn-nav-outline"
                        onClick={() => setSelectedRefund(refund)}
                        style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
                      >
                        <Eye size={13} /> View
                      </button>
                      {['pending', 'under_review'].includes(refund.status.toLowerCase()) && (
                        <>
                          <button
                            type="button"
                            className="btn-order-action btn-action-accept"
                            onClick={() => handleOpenAction('approve', refund)}
                            disabled={actionLoadingId === refund.id}
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            className="btn-order-action btn-action-reject"
                            onClick={() => handleOpenAction('reject', refund)}
                            disabled={actionLoadingId === refund.id}
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: View Details */}
      {selectedRefund && (
        <div className="admin-modal-overlay" onClick={() => setSelectedRefund(null)}>
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 style={{ margin: 0, color: 'var(--dark-blue)' }}>
                Refund Request Details — Order #{selectedRefund.order_number || selectedRefund.order}
              </h3>
              <button type="button" className="admin-modal-close" onClick={() => setSelectedRefund(null)}>
                &times;
              </button>
            </div>
            <div className="admin-modal-body">
              <div className="modal-section">
                <h4>Claim Overview</h4>
                <p><strong>Status:</strong> <span style={{ textTransform: 'uppercase', fontWeight: 700 }}>{selectedRefund.status}</span></p>
                <p><strong>Reason:</strong> {selectedRefund.reason}</p>
                <p><strong>Customer Explanation:</strong> {selectedRefund.customer_explanation || selectedRefund.explanation || 'None provided'}</p>
                <p><strong>Requested Amount:</strong> {formatCurrency(selectedRefund.amount_requested ?? selectedRefund.requested_amount)}</p>
                {(selectedRefund.amount_approved !== null && selectedRefund.amount_approved !== undefined && selectedRefund.amount_approved > 0) || (selectedRefund.approved_amount && selectedRefund.approved_amount > 0) ? (
                  <p><strong>Approved / Processed Amount:</strong> {formatCurrency(selectedRefund.amount_approved ?? selectedRefund.approved_amount)}</p>
                ) : null}
                {(selectedRefund.decision_notes || selectedRefund.decision_reason) && (
                  <p><strong>Decision Notes:</strong> {selectedRefund.decision_notes || selectedRefund.decision_reason}</p>
                )}
                <p><strong>Submitted On:</strong> {new Date(selectedRefund.created_at).toLocaleString()}</p>
              </div>

              {selectedRefund.audit_logs && selectedRefund.audit_logs.length > 0 && (
                <div className="modal-section">
                  <h4>Audit History</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.5rem' }}>
                    {selectedRefund.audit_logs.map((log) => (
                      <div key={log.id} style={{ padding: '0.5rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 4, fontSize: '0.82rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                          <span>Action: {log.action}</span>
                          <span style={{ color: 'var(--text-muted)' }}>{new Date(log.created_at).toLocaleString()}</span>
                        </div>
                        <div style={{ color: 'var(--text-secondary)' }}>By: {log.actor_name || 'System'}</div>
                        {log.notes && <div style={{ color: 'var(--text-main)', marginTop: '0.2rem' }}>{log.notes}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="admin-modal-footer">
              <button type="button" className="btn-nav-outline" onClick={() => setSelectedRefund(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Approve or Reject Refund */}
      {actionModal && (
        <div className="admin-modal-overlay" onClick={() => setActionModal(null)}>
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 style={{ margin: 0, color: actionModal.type === 'approve' ? 'var(--color-success)' : 'var(--color-error)' }}>
                {actionModal.type === 'approve' ? 'Approve Refund Request' : 'Reject Refund Request'}
              </h3>
              <button type="button" className="admin-modal-close" onClick={() => setActionModal(null)}>
                &times;
              </button>
            </div>
            <div className="admin-modal-body">
              <p style={{ color: 'var(--text-main)', marginBottom: '1rem' }}>
                Order #{actionModal.refund.order_number || actionModal.refund.order} — Requested amount: <strong>{formatCurrency(actionModal.refund.amount_requested ?? actionModal.refund.requested_amount)}</strong>
              </p>

              {actionModal.type === 'approve' && (
                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>
                    Approved Refund Amount (₱):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={parseAmount(actionModal.refund.amount_requested ?? actionModal.refund.requested_amount) || undefined}
                    className="form-input"
                    value={approvedAmount}
                    onChange={(e) => setApprovedAmount(e.target.value)}
                    required
                  />
                  <small style={{ color: 'var(--text-muted)' }}>
                    Maximum eligible balance: {formatCurrency(actionModal.refund.amount_requested ?? actionModal.refund.requested_amount)}
                  </small>
                </div>
              )}

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Decision Explanation {actionModal.type === 'reject' ? '(required)' : '(optional)'}:
                </label>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder={actionModal.type === 'approve' ? 'Optional note regarding the refund approval...' : 'Explain why the refund request cannot be granted...'}
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                />
              </div>
            </div>
            <div className="admin-modal-footer">
              <button type="button" className="btn-nav-outline" onClick={() => setActionModal(null)}>
                Cancel
              </button>
              <button
                type="button"
                className={`btn-order-action ${actionModal.type === 'approve' ? 'btn-action-accept' : 'btn-action-reject'}`}
                disabled={actionModal.type === 'reject' && !actionNotes.trim()}
                onClick={handleConfirmAction}
              >
                Confirm {actionModal.type === 'approve' ? 'Approval' : 'Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopRefundsTab;
