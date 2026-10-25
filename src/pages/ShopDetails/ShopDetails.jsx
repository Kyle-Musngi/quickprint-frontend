import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Clock,
  Phone,
  Mail,
  Printer,
  FileText,
  AlertCircle,
  ArrowRight,
  Star,
  MessageSquare,
  ThumbsUp
} from 'lucide-react';
import { shopService } from '../../services/api';
import { formatTime12Hour } from '../../utils/formatTime';
import ShopStatusBadge from '../../components/ShopStatusBadge/ShopStatusBadge';
import './ShopDetails.css';

const ShopDetails = () => {
  const { id } = useParams();
  const [shop, setShop] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [sortBy, setSortBy] = useState('newest');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    shopService.getShop(id)
      .then((data) => setShop(data))
      .catch((err) => {
        setError(err.response?.data?.detail || 'Could not load printing shop details.');
      })
      .finally(() => setLoading(false));

    shopService.getShopReviews(id)
      .then((data) => {
        const list = Array.isArray(data) ? data : (data.results || []);
        setReviews(list);
      })
      .catch(() => setReviews([]))
      .finally(() => setReviewsLoading(false));
  }, [id]);

  const sortedReviews = [...reviews].sort((a, b) => {
    if (sortBy === 'highest') return b.rating - a.rating;
    if (sortBy === 'lowest') return a.rating - b.rating;
    return new Date(b.created_at) - new Date(a.created_at);
  });

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-secondary)' }}>
        Loading printing shop profile...
      </div>
    );
  }

  if (error || !shop) {
    return (
      <div style={{ maxWidth: 600, margin: '4rem auto', padding: '2rem', textAlign: 'center', background: '#fff', borderRadius: 12 }}>
        <AlertCircle size={40} style={{ color: 'var(--color-error)', margin: '0 auto 1rem' }} />
        <h2>Shop Unavailable</h2>
        <p style={{ color: 'var(--text-secondary)', margin: '1rem 0 1.5rem' }}>{error}</p>
        <Link to="/shops" className="start-print-cta-btn" style={{ background: 'var(--primary-blue)', color: '#fff' }}>
          Back to Shops
        </Link>
      </div>
    );
  }

  const hasReviews = shop.review_count > 0;

  return (
    <div className="shop-details-page">
      <Link to="/shops" className="back-link">
        <ArrowLeft size={16} /> Back to Printing Shops
      </Link>

      {/* Header Banner */}
      <div className="shop-header-card">
        <div className="shop-header-top">
          <div className="shop-title-wrap">
            <h1>{shop.name}</h1>
            <div className="shop-location-sub">
              <MapPin size={18} /> {shop.address}, {shop.city} {shop.barangay ? `• ${shop.barangay}` : ''}
            </div>

            {/* Rating Tag */}
            <div className="shop-header-rating-badge">
              <Star size={18} className="star-icon-filled" />
              {hasReviews ? (
                <span>
                  <strong>★ {shop.average_rating ? Number(shop.average_rating).toFixed(1) : '0.0'} / 5</strong>
                  <span className="rating-count-sep">·</span>
                  <span>{shop.review_count} {shop.review_count === 1 ? 'review' : 'reviews'}</span>
                </span>
              ) : (
                <span className="no-reviews-tag">No reviews yet</span>
              )}
            </div>
          </div>

          <Link to={`/upload-print?shopId=${shop.id}`} className="start-print-cta-btn">
            <Printer size={20} /> Start Printing Here <ArrowRight size={18} />
          </Link>
        </div>

        <div className="shop-header-meta">
          <div className="shop-meta-item">
            <ShopStatusBadge isOpen={shop.is_open} />
          </div>
          <div className="shop-meta-item">
            <Clock size={16} className="shop-meta-item-icon" />
            <span><strong>Hours:</strong> {formatTime12Hour(shop.opening_time)} - {formatTime12Hour(shop.closing_time)} ({shop.operating_days})</span>
          </div>
          <div className="shop-meta-item">
            <Phone size={16} className="shop-meta-item-icon" />
            <span>{shop.phone_number}</span>
          </div>
          <div className="shop-meta-item">
            <Mail size={16} className="shop-meta-item-icon" />
            <span>{shop.email}</span>
          </div>
        </div>
      </div>

      {/* Details Grid */}
      <div className="shop-details-grid">
        <div className="details-main-column">
          {/* Pricing Rules Table */}
          <div className="details-card">
            <h2 className="details-card-title">
              <FileText size={20} style={{ color: 'var(--primary-blue)' }} /> Document Printing Price Matrix
            </h2>
            <div className="pricing-table-wrap">
              <table className="pricing-table">
                <thead>
                  <tr>
                    <th>Paper Size</th>
                    <th>Color Mode</th>
                    <th>Sides</th>
                    <th>Price per Page / Sheet</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {shop.pricing_rules && shop.pricing_rules.length > 0 ? (
                    shop.pricing_rules.map((rule) => (
                      <tr key={rule.id}>
                        <td><strong>{rule.paper_size}</strong></td>
                        <td>{rule.color_mode === 'color' ? 'Full Color' : 'Black & White'}</td>
                        <td>{rule.print_side === 'double' ? 'Double-Sided' : 'Single-Sided'}</td>
                        <td className="price-cell">₱{parseFloat(rule.price_per_page).toFixed(2)}</td>
                        <td>
                          {rule.is_available ? (
                            <span style={{ color: 'var(--color-success)', fontSize: '0.8rem', fontWeight: 600 }}>
                              Available
                            </span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                              Unavailable
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-secondary)' }}>
                        Default pricing rules applied at checkout.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* About & Description */}
          <div className="details-card">
            <h2 className="details-card-title">About this Shop</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: '0.95rem' }}>
              {shop.description || 'Welcome to our campus printing shop. We specialize in fast, high-quality document printing, thesis packaging, study reviewer copies, and student handouts.'}
            </p>
          </div>

          {/* Customer Ratings and Reviews */}
          <div className="details-card reviews-section-card">
            <div className="reviews-section-header">
              <div>
                <h2 className="details-card-title" style={{ marginBottom: '0.35rem' }}>
                  <Star size={20} style={{ color: '#F59E0B' }} /> Customer Ratings & Reviews
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: 0 }}>
                  Genuine feedback from verified students who completed print orders at this shop.
                </p>
              </div>

              {reviews.length > 0 && (
                <div className="reviews-sort-wrap">
                  <label htmlFor="review-sort">Sort by:</label>
                  <select
                    id="review-sort"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="review-sort-select"
                  >
                    <option value="newest">Newest First</option>
                    <option value="highest">Highest Rating</option>
                    <option value="lowest">Lowest Rating</option>
                  </select>
                </div>
              )}
            </div>

            {/* Rating Score Summary */}
            <div className="rating-summary-banner">
              <div className="rating-big-number">
                {hasReviews ? Number(shop.average_rating).toFixed(1) : '—'}
              </div>
              <div className="rating-summary-details">
                <div className="stars-row">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={20}
                      className={hasReviews && star <= Math.round(Number(shop.average_rating)) ? 'star-filled' : 'star-empty'}
                    />
                  ))}
                </div>
                <div className="rating-summary-text">
                  {hasReviews ? (
                    <>Based on <strong>{shop.review_count}</strong> verified customer {shop.review_count === 1 ? 'review' : 'reviews'}</>
                  ) : (
                    <>No verified reviews yet</>
                  )}
                </div>
              </div>
            </div>

            {/* Reviews List */}
            {reviewsLoading ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                Loading verified reviews...
              </div>
            ) : sortedReviews.length === 0 ? (
              <div className="reviews-empty-state">
                <MessageSquare size={36} style={{ color: 'var(--text-muted)', margin: '0 auto 0.75rem' }} />
                <h4>No reviews yet</h4>
                <p>Be the first to share your experience after completing an order.</p>
              </div>
            ) : (
              <div className="reviews-list">
                {sortedReviews.map((rev) => (
                  <div key={rev.id} className="review-item-card">
                    <div className="review-item-header">
                      <div>
                        <div className="reviewer-name">
                          {rev.customer_name || 'Verified Student'}
                        </div>
                        <div className="review-stars-date">
                          <div className="stars-row-small">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                size={14}
                                className={s <= rev.rating ? 'star-filled' : 'star-empty'}
                              />
                            ))}
                          </div>
                          <span className="review-date">
                            {new Date(rev.created_at).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>

                      {rev.order_number && (
                        <span className="review-order-pill">
                          Order #{rev.order_number}
                        </span>
                      )}
                    </div>

                    {rev.review_text && rev.review_text.trim() ? (
                      <p className="review-item-text">{rev.review_text}</p>
                    ) : (
                      <p className="review-item-text-empty">Rated without written comments.</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar: Available Services & Quick Info */}
        <div className="details-sidebar-column">
          <div className="details-card">
            <h2 className="details-card-title">Supported Services</h2>
            <div className="services-list">
              {shop.services && shop.services.length > 0 ? (
                shop.services.map((srv) => (
                  <div key={srv.id} className="service-item-row">
                    <div className="service-item-info">
                      <h4>{srv.name}</h4>
                      <p>{srv.description || 'Available on request'}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  Standard document printing, thesis binding, and photocopying.
                </div>
              )}
            </div>

            <div style={{ marginTop: '2rem' }}>
              <Link
                to={`/upload-print?shopId=${shop.id}`}
                className="view-shop-action-btn"
                style={{ width: '100%', justifyContent: 'center', padding: '0.8rem' }}
              >
                Upload Documents Now <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopDetails;
