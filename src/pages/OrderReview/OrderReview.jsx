import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Store,
  FileText,
  Calendar,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { shopService, orderService } from '../../services/api';
import { formatTime12Hour } from '../../utils/formatTime';
import './OrderReview.css';

const OrderReview = () => {
  const navigate = useNavigate();
  const getTodayDateString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getTomorrowDateString = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [draft, setDraft] = useState(null);
  const [pickupDate, setPickupDate] = useState(getTomorrowDateString);
  const [slots, setSlots] = useState([]);
  const [slotsMessage, setSlotsMessage] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const saved = sessionStorage.getItem('uqp_order_draft');
    if (!saved) {
      navigate('/upload-print');
      return;
    }
    setDraft(JSON.parse(saved));
  }, [navigate]);

  // Load available pickup slots for chosen date
  useEffect(() => {
    if (draft?.shopId && pickupDate) {
      setLoadingSlots(true);
      setSlotsMessage('');
      shopService.getPickupSlots(draft.shopId, pickupDate)
        .then((res) => {
          const list = res.slots || [];
          setSlots(list);
          setSlotsMessage(res.message || '');
          const available = list.find((s) => s.is_available);
          if (available) {
            setSelectedSlot(available.time_slot);
          } else {
            setSelectedSlot('');
          }
        })
        .catch((err) => {
          setSlots([]);
          setSlotsMessage(err.response?.data?.error || 'Unable to retrieve pickup slots for this date.');
          setSelectedSlot('');
        })
        .finally(() => setLoadingSlots(false));
    }
  }, [draft?.shopId, pickupDate]);

  const handleConfirmOrder = async () => {
    if (!selectedSlot) {
      setErrorMsg('Please choose an available pickup time slot.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      const formData = new FormData();
      formData.append('shop_id', draft.shopId);
      formData.append('pickup_date', pickupDate);
      formData.append('pickup_time_slot', selectedSlot);
      formData.append('instructions', draft.instructions || '');

      // Append files
      const rawFiles = window.__uqp_upload_files || [];
      rawFiles.forEach((f) => {
        formData.append('files', f);
      });

      // Append file settings
      const fileSettings = draft.filesSummary.map((f) => ({
        paper_size: draft.paperSize,
        color_mode: draft.colorMode,
        print_side: draft.printSide,
        copies: draft.copies,
        manual_page_count: f.pageCount,
        page_range: draft.pageRange || 'all',
        orientation: draft.orientation || 'portrait',
        paper_type: draft.paperType || 'standard_70gsm',
      }));
      formData.append('file_settings', JSON.stringify(fileSettings));

      const createdOrder = await orderService.createOrder(formData);

      // Clear draft memory
      sessionStorage.removeItem('uqp_order_draft');
      window.__uqp_upload_files = null;

      // Navigate to Tracking page to await shop review
      navigate(`/tracking/${createdOrder.id}`);
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Failed to submit order. Please try again.';
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!draft) return null;

  const totalPages = draft.filesSummary.reduce((acc, f) => acc + (f.pageCount || 1), 0);
  const totalAmount = draft.estimatedCost?.total || '0.00';

  return (
    <div className="order-review-page">
      <div className="review-header">
        <h1 className="review-title">Review & Submit Order</h1>
        <p className="review-subtitle">
          Verify your document specifications and preferred pickup schedule before submitting for shop review. Payment is only required after the shop accepts.
        </p>
      </div>

      {errorMsg && (
        <div style={{ backgroundColor: 'var(--color-error-bg)', color: 'var(--color-error)', padding: '1rem', borderRadius: 8, marginBottom: '1.5rem', fontWeight: 500 }}>
          <AlertCircle size={18} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} />
          {errorMsg}
        </div>
      )}

      {/* Selected Shop */}
      <div className="review-card">
        <h2 className="review-card-title">
          <Store size={20} style={{ color: 'var(--primary-blue)' }} /> Printing Partner
        </h2>
        <div className="shop-summary-box">
          <div className="shop-summary-info">
            <h3>{draft.shop?.name || 'Selected Print Shop'}</h3>
            <p>{draft.shop?.address}, {draft.shop?.city}</p>
            <p style={{ marginTop: '0.25rem', color: 'var(--dark-blue)', fontWeight: 600 }}>
              Operating Hours: {formatTime12Hour(draft.shop?.opening_time)} - {formatTime12Hour(draft.shop?.closing_time)}
            </p>
          </div>
          <Link to={`/shops/${draft.shopId}`} className="btn-nav-outline">
            View Shop Info
          </Link>
        </div>
      </div>

      {/* Documents Breakdown */}
      <div className="review-card">
        <h2 className="review-card-title">
          <FileText size={20} style={{ color: 'var(--primary-blue)' }} /> Document Specifications
        </h2>

        <div className="docs-review-table-wrap">
          <table className="docs-review-table">
            <thead>
              <tr>
                <th>Document Name</th>
                <th>Type</th>
                <th>Pages & Range</th>
                <th>Physical Sheets</th>
                <th>Copies & Collation</th>
                <th>Color & Layout</th>
              </tr>
            </thead>
            <tbody>
              {draft.filesSummary.map((doc, idx) => {
                const effPages = doc.effectivePages || doc.pageCount;
                const sheets = draft.printSide === 'double' ? Math.ceil(effPages / 2) : effPages;
                return (
                  <tr key={idx}>
                    <td><strong>{doc.name}</strong></td>
                    <td>
                      <span className="doc-type-pill" style={{ background: '#E0E7FF', color: '#3730A3', padding: '2px 6px', borderRadius: 4, fontSize: '0.75rem', fontWeight: 700 }}>
                        {doc.docType || 'PDF'}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: '#15803D', fontWeight: 600 }}>✓ {doc.pageCount} page(s)</span>
                      {draft.pageRange && draft.pageRange !== 'all' ? (
                        <div style={{ fontSize: '0.75rem', color: '#0369A1', marginTop: 2 }}>
                          Range: {draft.pageRange} ({effPages} printed)
                        </div>
                      ) : (
                        <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 2 }}>All pages</div>
                      )}
                    </td>
                    <td>
                      {sheets} sheet(s) {draft.printSide === 'double' && <small style={{ color: '#64748B' }}>(back-to-back)</small>}
                    </td>
                    <td>
                      {draft.copies} {draft.copies > 1 ? 'copies' : 'copy'}
                      {draft.copies > 1 && (
                        <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 2 }}>
                          {draft.collated ? 'Collated' : 'Uncollated'}
                        </div>
                      )}
                    </td>
                    <td>
                      {draft.colorMode === 'color' ? 'Full Color' : 'Black & White'} •{' '}
                      {draft.printSide === 'double' ? 'Double-Sided' : 'Single'} ({draft.paperSize})
                      <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 2 }}>
                        {draft.orientation === 'landscape' ? 'Landscape' : 'Portrait'} • {draft.paperType?.replace('_', ' ')?.toUpperCase() || 'STANDARD'}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {draft.instructions && (
          <div style={{ marginTop: '1.25rem', padding: '1rem', background: 'var(--bg-subtle)', borderRadius: 8, fontSize: '0.9rem' }}>
            <strong>Special Instructions:</strong> {draft.instructions}
          </div>
        )}
      </div>

      {/* Pickup Scheduling */}
      <div className="review-card">
        <h2 className="review-card-title">
          <Calendar size={20} style={{ color: 'var(--primary-blue)' }} /> Schedule Pickup
        </h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Choose the date and time slot you intend to collect your printed documents.
        </p>

        <div className="pickup-picker-grid">
          <div className="form-group">
            <label className="form-label">Pickup Date</label>
            <input
              type="date"
              className="form-input"
              value={pickupDate}
              min={getTodayDateString()}
              onChange={(e) => setPickupDate(e.target.value)}
            />
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem', display: 'block' }}>
              Shop Operating Schedule: {draft.shop?.operating_days || 'Standard'} ({formatTime12Hour(draft.shop?.opening_time)} - {formatTime12Hour(draft.shop?.closing_time)})
            </span>
          </div>

          <div className="form-group">
            <label className="form-label">Available Time Slots</label>
            {loadingSlots ? (
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', padding: '0.75rem', background: 'var(--bg-subtle)', borderRadius: 8 }}>
                Checking {draft.shop?.name || 'print shop'} operating schedule and available capacity...
              </div>
            ) : slots.length === 0 ? (
              <div style={{ fontSize: '0.9rem', color: '#991B1B', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', padding: '0.85rem 1rem', borderRadius: 8 }}>
                {slotsMessage || `No pickup slots are available for this date. ${draft.shop?.name || 'The shop'} may be closed on this day or all pickup slots are booked to maximum capacity. Please select another date.`}
              </div>
            ) : (
              <>
                <div className="slots-grid">
                  {slots.map((slot, idx) => (
                    <button
                      key={idx}
                      type="button"
                      disabled={!slot.is_available}
                      className={`slot-btn ${selectedSlot === slot.time_slot ? 'active' : ''}`}
                      onClick={() => setSelectedSlot(slot.time_slot)}
                      title={slot.is_available ? `Available (${slot.capacity - slot.booked_count} spots left)` : slot.is_past ? 'Time passed' : 'Slot at full capacity'}
                    >
                      {slot.time_slot}
                      {!slot.is_available && (
                        <span style={{ display: 'block', fontSize: '0.68rem', opacity: 0.8 }}>
                          {slot.is_past ? '(Past)' : '(Full)'}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                {selectedSlot && (
                  <div style={{ marginTop: '0.85rem', padding: '0.65rem 0.85rem', backgroundColor: '#EFF6FF', borderRadius: 6, fontSize: '0.85rem', color: 'var(--primary-blue)', fontWeight: 600 }}>
                    ✓ Selected Pickup: {pickupDate} at {selectedSlot} (Cebu Local Time)
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Total & Action Buttons */}
      <div className="review-card" style={{ background: '#F8FAFC' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Estimated Order Total</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--dark-blue)' }}>
              ₱{parseFloat(totalAmount).toFixed(2)}
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--primary-blue, #2563EB)', fontWeight: 600, marginTop: '0.25rem' }}>
              ✓ No payment required now • Pay only after shop accepts
            </div>
          </div>

          <div className="review-actions">
            <Link to="/upload-print" className="btn-nav-outline">
              <ArrowLeft size={16} /> Edit Settings
            </Link>
            <button
              type="button"
              className="home-btn-primary"
              onClick={handleConfirmOrder}
              disabled={submitting || !selectedSlot}
            >
              {submitting ? 'Submitting Order...' : 'Submit Order for Review'} <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderReview;
