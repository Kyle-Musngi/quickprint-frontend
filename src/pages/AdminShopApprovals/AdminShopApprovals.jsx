import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Store,
  Check,
  X,
  AlertTriangle,
  Clock,
  MapPin,
  Mail,
  Phone,
  RotateCcw,
  ArrowLeft,
  Eye,
  ShieldAlert,
  CheckCircle,
  FileText,
  ExternalLink,
  Download,
  HelpCircle,
  History
} from 'lucide-react';
import { shopService } from '../../services/api';
import { formatTime12Hour } from '../../utils/formatTime';
import './AdminShopApprovals.css';

const AdminShopApprovals = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'approved', 'suspended'
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState({ text: '', type: '' });

  // Modal states
  const [selectedShopDetails, setSelectedShopDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [suspensionModalShop, setSuspensionModalShop] = useState(null);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [rejectionModalShop, setRejectionModalShop] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [moreInfoModalShop, setMoreInfoModalShop] = useState(null);
  const [moreInfoReason, setMoreInfoReason] = useState('');

  const fetchShops = async (statusFilter = activeTab) => {
    setLoading(true);
    try {
      const data = await shopService.getAllShopsAdmin({ status: statusFilter });
      const list = Array.isArray(data) ? data : (data.results || []);
      setShops(list);
    } catch {
      setShops([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShops(activeTab);
  }, [activeTab]);

  const showToast = (text, type = 'success') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => setFeedbackMsg({ text: '', type: '' }), 4500);
  };

  const handleOpenDetails = async (shop) => {
    setSelectedShopDetails(shop);
    setDetailsLoading(true);
    try {
      const fullShop = await shopService.getShop(shop.id);
      setSelectedShopDetails(fullShop);
    } catch {
      // keep shop as is
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleShopAction = async (shopId, action, reason = '') => {
    setActionLoadingId(shopId);
    try {
      const res = await shopService.adminShopAction(shopId, action, reason);
      showToast(res.message || `Action '${action}' succeeded.`, 'success');
      // If modal was open for this shop, update details
      if (selectedShopDetails && selectedShopDetails.id === shopId) {
        handleOpenDetails(selectedShopDetails);
      }
      // Refresh list immediately from backend
      await fetchShops(activeTab);
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.detail || 'Action failed.';
      showToast(msg, 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleApprove = (shop) => {
    if (window.confirm(`Are you sure you want to approve "${shop.name}"? The applicant's account role will be changed to Shop Owner and their shop will become active.`)) {
      handleShopAction(shop.id, 'approve');
    }
  };

  const confirmReject = () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejecting this shop application.');
      return;
    }
    const shopId = rejectionModalShop.id;
    const reason = rejectionReason.trim();
    setRejectionModalShop(null);
    setRejectionReason('');
    handleShopAction(shopId, 'reject', reason);
  };

  const confirmMoreInfo = () => {
    if (!moreInfoReason.trim()) {
      alert('Please specify the additional information or documents required.');
      return;
    }
    const shopId = moreInfoModalShop.id;
    const reason = moreInfoReason.trim();
    setMoreInfoModalShop(null);
    setMoreInfoReason('');
    handleShopAction(shopId, 'more_info', reason);
  };

  const confirmSuspend = () => {
    if (!suspensionReason.trim()) {
      alert('Please enter a reason for suspending this shop.');
      return;
    }
    const shopId = suspensionModalShop.id;
    const reason = suspensionReason.trim();
    setSuspensionModalShop(null);
    setSuspensionReason('');
    handleShopAction(shopId, 'suspend', reason);
  };

  const handleReactivate = (shop) => {
    if (window.confirm(`Reactivate "${shop.name}"? This shop will be restored to active operational status.`)) {
      handleShopAction(shop.id, 'reactivate');
    }
  };

  return (
    <div className="admin-approvals-page">
      {/* Top Navigation & Header */}
      <div className="approvals-top-nav">
        <button
          type="button"
          onClick={() => navigate('/admin/dashboard')}
          className="btn-nav-outline"
          aria-label="Back to Admin Dashboard"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
        <button
          type="button"
          onClick={() => fetchShops(activeTab)}
          className="btn-nav-outline"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <RotateCcw size={16} /> Refresh
        </button>
      </div>

      <div className="approvals-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <img
          src="/images/uqp-logo.png"
          alt="Univ Quick Print Logo"
          style={{ width: '48px', height: '48px', objectFit: 'contain', borderRadius: '8px', flexShrink: 0 }}
        />
        <div>
          <h1 className="approvals-title">Printing Shop Management</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            Review pending applications, inspect business details, and manage active operations for verified campus shops.
          </p>
        </div>
      </div>

      {feedbackMsg.text && (
        <div className={`approvals-toast toast-${feedbackMsg.type}`}>
          {feedbackMsg.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="approvals-tabs-bar" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'pending'}
          className={`approvals-tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Review Pending Applications
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'approved'}
          className={`approvals-tab-btn ${activeTab === 'approved' ? 'active' : ''}`}
          onClick={() => setActiveTab('approved')}
        >
          Approvals Queue (Active Shops)
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'suspended'}
          className={`approvals-tab-btn ${activeTab === 'suspended' ? 'active' : ''}`}
          onClick={() => setActiveTab('suspended')}
        >
          Suspended Shops
        </button>
      </div>

      {/* Content Area */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
          Loading shop records...
        </div>
      ) : shops.length === 0 ? (
        <div className="approvals-empty-state">
          <Store size={44} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem' }} />
          <h3>No {activeTab === 'pending' ? 'Pending Applications' : activeTab === 'approved' ? 'Approved Shops' : 'Suspended Shops'}</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            {activeTab === 'pending'
              ? 'There are currently no printing shops awaiting administrator approval.'
              : activeTab === 'approved'
                ? 'No active approved shops found.'
                : 'No suspended shops found.'}
          </p>
        </div>
      ) : (
        <div className="approval-shops-list">
          {shops.map((shop) => (
            <div key={shop.id} className="approval-shop-card">
              <div className="approval-card-main">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                    <h2 className="approval-shop-name">{shop.name}</h2>
                    <span className={`shop-dash-status-pill pill-${shop.status}`}>
                      {shop.status}
                    </span>
                    {activeTab === 'approved' && (
                      <span className="operational-badge active">
                        ● Operational
                      </span>
                    )}
                    {activeTab === 'suspended' && (
                      <span className="operational-badge suspended">
                        ○ Inactive / Suspended
                      </span>
                    )}
                  </div>

                  <p className="approval-shop-desc">
                    {shop.description || 'No description provided.'}
                  </p>

                  <div className="approval-meta-grid">
                    <div className="meta-item">
                      <MapPin size={15} style={{ color: 'var(--primary-blue)' }} /> {shop.address}, {shop.city}
                    </div>
                    <div className="meta-item">
                      <Clock size={15} /> {formatTime12Hour(shop.opening_time)} - {formatTime12Hour(shop.closing_time)} ({shop.operating_days})
                    </div>
                    <div className="meta-item">
                      <Phone size={15} /> {shop.phone_number || 'N/A'}
                    </div>
                    <div className="meta-item">
                      <Mail size={15} /> {shop.email || 'N/A'}
                    </div>
                    {shop.created_at && (
                      <div className="meta-item" style={{ color: 'var(--text-muted)' }}>
                        Submitted: {new Date(shop.created_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>

                {shop.owner && (
                  <div className="approval-owner-card">
                    <div style={{ fontWeight: 700, color: 'var(--dark-blue)', marginBottom: '0.2rem' }}>
                      Shop Owner
                    </div>
                    <div style={{ fontWeight: 600 }}>{shop.owner.full_name || shop.owner.username}</div>
                    <div style={{ color: 'var(--text-secondary)' }}>@{shop.owner.username}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{shop.owner.email}</div>
                  </div>
                )}
              </div>

              {shop.rejection_reason && (
                <div className="approval-reason-banner">
                  <strong>{activeTab === 'suspended' ? 'Suspension Reason:' : 'Rejection Reason:'}</strong> {shop.rejection_reason}
                </div>
              )}

              {/* Action Buttons */}
              <div className="approval-actions">
                <button
                  type="button"
                  className="btn-nav-outline"
                  onClick={() => handleOpenDetails(shop)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <Eye size={16} /> View Application
                </button>

                {/* Pending tab actions */}
                {activeTab === 'pending' && (
                  <>
                    <button
                      type="button"
                      className="btn-order-action btn-action-accept"
                      disabled={actionLoadingId === shop.id}
                      onClick={() => handleApprove(shop)}
                    >
                      <Check size={16} /> Approve Shop
                    </button>
                    <button
                      type="button"
                      className="btn-nav-outline"
                      disabled={actionLoadingId === shop.id}
                      onClick={() => {
                        setMoreInfoModalShop(shop);
                        setMoreInfoReason('');
                      }}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                      <HelpCircle size={16} /> Request Info
                    </button>
                    <button
                      type="button"
                      className="btn-order-action btn-action-reject"
                      disabled={actionLoadingId === shop.id}
                      onClick={() => {
                        setRejectionModalShop(shop);
                        setRejectionReason('');
                      }}
                    >
                      <X size={16} /> Reject Application
                    </button>
                  </>
                )}

                {/* Approved tab actions */}
                {activeTab === 'approved' && (
                  <button
                    type="button"
                    className="btn-order-action btn-action-reject"
                    disabled={actionLoadingId === shop.id}
                    onClick={() => {
                      setSuspensionModalShop(shop);
                      setSuspensionReason('');
                    }}
                  >
                    <ShieldAlert size={16} /> Suspend Shop
                  </button>
                )}

                {/* Suspended tab actions */}
                {activeTab === 'suspended' && (
                  <button
                    type="button"
                    className="btn-order-action btn-action-accept"
                    disabled={actionLoadingId === shop.id}
                    onClick={() => handleReactivate(shop)}
                  >
                    <Check size={16} /> Reactivate Shop
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: View Full Shop Application Details */}
      {selectedShopDetails && (
        <div className="admin-modal-overlay" onClick={() => setSelectedShopDetails(null)}>
          <div className="admin-modal-card" style={{ maxWidth: '680px' }} onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 style={{ margin: 0, color: 'var(--dark-blue)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Store size={20} style={{ color: 'var(--primary-blue)' }} /> {selectedShopDetails.name} — Application Details
              </h3>
              <button type="button" className="admin-modal-close" onClick={() => setSelectedShopDetails(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="admin-modal-body">
              {detailsLoading && (
                <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-secondary)' }}>
                  Refreshing latest verification records...
                </div>
              )}
              <div className="modal-section">
                <h4>General Information</h4>
                <p><strong>Status:</strong> <span className={`shop-dash-status-pill pill-${selectedShopDetails.status}`}>{selectedShopDetails.status}</span></p>
                <p><strong>Description:</strong> {selectedShopDetails.description || 'None'}</p>
                <p><strong>Location:</strong> {selectedShopDetails.address}, {selectedShopDetails.barangay ? `${selectedShopDetails.barangay}, ` : ''}{selectedShopDetails.city}</p>
                <p><strong>Contact:</strong> {selectedShopDetails.phone_number} • {selectedShopDetails.email}</p>
                <p><strong>Coordinates:</strong> {selectedShopDetails.latitude}, {selectedShopDetails.longitude}</p>
              </div>

              <div className="modal-section">
                <h4>Operating Schedule & Capacity</h4>
                <p><strong>Operating Days:</strong> {selectedShopDetails.operating_days || 'Standard'}</p>
                <p><strong>Hours:</strong> {formatTime12Hour(selectedShopDetails.opening_time)} - {formatTime12Hour(selectedShopDetails.closing_time)}</p>
                <p><strong>Pickup Slot Interval:</strong> {selectedShopDetails.pickup_slot_interval_minutes || 30} minutes</p>
                <p><strong>Slot Capacity:</strong> {selectedShopDetails.slot_capacity || 5} concurrent orders per slot</p>
              </div>

              {selectedShopDetails.owner && (
                <div className="modal-section">
                  <h4>Applicant Account</h4>
                  <p><strong>Name:</strong> {selectedShopDetails.owner.full_name || selectedShopDetails.owner.username}</p>
                  <p><strong>Username:</strong> @{selectedShopDetails.owner.username}</p>
                  <p><strong>Email:</strong> {selectedShopDetails.owner.email}</p>
                  <p><strong>Role:</strong> {selectedShopDetails.owner.role}</p>
                </div>
              )}

              {/* Verification Documents */}
              <div className="modal-section">
                <h4>Verification Documents</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 6 }}>
                    <div>
                      <strong>Valid Government ID:</strong>
                      <span style={{ marginLeft: '0.5rem', color: selectedShopDetails.government_id ? 'var(--color-success)' : 'var(--text-muted)' }}>
                        {selectedShopDetails.government_id ? 'Uploaded' : 'Not provided'}
                      </span>
                    </div>
                    {selectedShopDetails.government_id && (
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <a
                          href={shopService.getVerificationDocumentUrl(selectedShopDetails.id, 'government_id', 'inline')}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-nav-outline"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
                        >
                          <ExternalLink size={13} /> View
                        </a>
                        <a
                          href={shopService.getVerificationDocumentUrl(selectedShopDetails.id, 'government_id', 'attachment')}
                          download
                          className="btn-nav-outline"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
                        >
                          <Download size={13} />
                        </a>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 6 }}>
                    <div>
                      <strong>Business Permit:</strong>
                      <span style={{ marginLeft: '0.5rem', color: selectedShopDetails.business_permit ? 'var(--color-success)' : 'var(--text-muted)' }}>
                        {selectedShopDetails.business_permit ? 'Uploaded' : 'Not provided'}
                      </span>
                    </div>
                    {selectedShopDetails.business_permit && (
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <a
                          href={shopService.getVerificationDocumentUrl(selectedShopDetails.id, 'business_permit', 'inline')}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-nav-outline"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
                        >
                          <ExternalLink size={13} /> View
                        </a>
                        <a
                          href={shopService.getVerificationDocumentUrl(selectedShopDetails.id, 'business_permit', 'attachment')}
                          download
                          className="btn-nav-outline"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
                        >
                          <Download size={13} />
                        </a>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0.75rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 6 }}>
                    <div>
                      <strong>Proof of Ownership / Lease:</strong>
                      <span style={{ marginLeft: '0.5rem', color: selectedShopDetails.proof_of_ownership ? 'var(--color-success)' : 'var(--text-muted)' }}>
                        {selectedShopDetails.proof_of_ownership ? 'Uploaded' : 'Not provided'}
                      </span>
                    </div>
                    {selectedShopDetails.proof_of_ownership && (
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <a
                          href={shopService.getVerificationDocumentUrl(selectedShopDetails.id, 'proof_of_ownership', 'inline')}
                          target="_blank"
                          rel="noreferrer"
                          className="btn-nav-outline"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
                        >
                          <ExternalLink size={13} /> View
                        </a>
                        <a
                          href={shopService.getVerificationDocumentUrl(selectedShopDetails.id, 'proof_of_ownership', 'attachment')}
                          download
                          className="btn-nav-outline"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
                        >
                          <Download size={13} />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Audit History */}
              {selectedShopDetails.audit_logs && selectedShopDetails.audit_logs.length > 0 && (
                <div className="modal-section">
                  <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <History size={16} /> Application Audit History
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                    {selectedShopDetails.audit_logs.map((log) => (
                      <div key={log.id} style={{ padding: '0.5rem 0.75rem', borderLeft: '3px solid var(--primary-blue)', backgroundColor: 'var(--bg-subtle)', borderRadius: 4, fontSize: '0.85rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                          <span>Action: {log.action}</span>
                          <span style={{ color: 'var(--text-muted)' }}>{new Date(log.created_at).toLocaleString()}</span>
                        </div>
                        <div style={{ color: 'var(--text-secondary)' }}>By: {log.actor_name || 'System / Applicant'}</div>
                        {log.notes && <div style={{ marginTop: '0.25rem', color: 'var(--text-main)' }}>Notes: {log.notes}</div>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="admin-modal-footer">
              <button type="button" className="btn-nav-outline" onClick={() => setSelectedShopDetails(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Suspend Shop Confirmation */}
      {suspensionModalShop && (
        <div className="admin-modal-overlay" onClick={() => setSuspensionModalShop(null)}>
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 style={{ margin: 0, color: 'var(--color-error)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldAlert size={20} /> Suspend Printing Shop
              </h3>
              <button type="button" className="admin-modal-close" onClick={() => setSuspensionModalShop(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="admin-modal-body">
              <p style={{ color: 'var(--text-main)', marginBottom: '1rem', lineHeight: 1.5 }}>
                Are you sure you want to suspend <strong>"{suspensionModalShop.name}"</strong>?
              </p>
              <div style={{ backgroundColor: '#FEF2F2', padding: '0.85rem 1rem', borderRadius: 8, fontSize: '0.85rem', color: '#991B1B', marginBottom: '1.25rem' }}>
                ● The shop will be immediately removed from public customer search.<br />
                ● It cannot receive new orders while suspended.<br />
                ● Existing completed orders and history will remain intact.
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Reason for Suspension (required):
                </label>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="e.g. Failure to fulfill orders, academic code violation, or customer dispute..."
                  value={suspensionReason}
                  onChange={(e) => setSuspensionReason(e.target.value)}
                />
              </div>
            </div>
            <div className="admin-modal-footer">
              <button type="button" className="btn-nav-outline" onClick={() => setSuspensionModalShop(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn-order-action btn-action-reject"
                disabled={!suspensionReason.trim()}
                onClick={confirmSuspend}
              >
                Confirm Suspension
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Reject Shop Application */}
      {rejectionModalShop && (
        <div className="admin-modal-overlay" onClick={() => setRejectionModalShop(null)}>
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 style={{ margin: 0, color: 'var(--color-error)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <X size={20} /> Reject Shop Application
              </h3>
              <button type="button" className="admin-modal-close" onClick={() => setRejectionModalShop(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="admin-modal-body">
              <p style={{ color: 'var(--text-main)', marginBottom: '1rem' }}>
                Please provide the reason for declining <strong>"{rejectionModalShop.name}"</strong>. The owner will be notified to adjust their registration.
              </p>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Rejection Reason (required):
                </label>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="e.g. Incomplete business address, duplicate registration, or invalid contact information..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                />
              </div>
            </div>
            <div className="admin-modal-footer">
              <button type="button" className="btn-nav-outline" onClick={() => setRejectionModalShop(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn-order-action btn-action-reject"
                disabled={!rejectionReason.trim()}
                onClick={confirmReject}
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Request More Information */}
      {moreInfoModalShop && (
        <div className="admin-modal-overlay" onClick={() => setMoreInfoModalShop(null)}>
          <div className="admin-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h3 style={{ margin: 0, color: 'var(--primary-blue)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <HelpCircle size={20} /> Request More Information
              </h3>
              <button type="button" className="admin-modal-close" onClick={() => setMoreInfoModalShop(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="admin-modal-body">
              <p style={{ color: 'var(--text-main)', marginBottom: '1rem' }}>
                Specify what additional verification evidence or clarifications are needed from <strong>"{moreInfoModalShop.name}"</strong>. The status will be set to <em>More Information Required</em>.
              </p>
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 600 }}>
                  Information / Document Requirements (required):
                </label>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="e.g. Please provide a clearer copy of your Mayor's Business Permit and campus authorization..."
                  value={moreInfoReason}
                  onChange={(e) => setMoreInfoReason(e.target.value)}
                />
              </div>
            </div>
            <div className="admin-modal-footer">
              <button type="button" className="btn-nav-outline" onClick={() => setMoreInfoModalShop(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn-order-action btn-action-accept"
                disabled={!moreInfoReason.trim()}
                onClick={confirmMoreInfo}
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminShopApprovals;
