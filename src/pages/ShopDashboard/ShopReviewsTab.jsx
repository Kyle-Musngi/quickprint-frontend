import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, ShieldCheck, ArrowUpDown } from 'lucide-react';
import { shopService } from '../../services/api';

const ShopReviewsTab = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('newest');

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await shopService.getMyShopReviews({ sort: sortBy });
      setData(res);
    } catch {
      setData({ average_rating: 0, review_count: 0, reviews: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [sortBy]);

  if (loading && !data) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
        Loading customer reviews...
      </div>
    );
  }

  const { average_rating, review_count, reviews = [] } = data || {};
  const hasReviews = review_count > 0;

  return (
    <div className="shop-reviews-tab">
      <div className="reviews-tab-header">
        <div>
          <h2 className="dashboard-section-title" style={{ marginBottom: '0.25rem' }}>
            Customer Ratings & Reviews
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Feedback from students who completed and collected their print orders.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <label htmlFor="shop-review-sort" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <ArrowUpDown size={14} /> Sort:
          </label>
          <select
            id="shop-review-sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="review-sort-select"
          >
            <option value="newest">Newest First</option>
            <option value="highest">Highest Rating</option>
            <option value="lowest">Lowest Rating</option>
          </select>
        </div>
      </div>

      {/* Summary Banner */}
      <div className="shop-owner-rating-summary">
        <div className="rating-score-box">
          <div className="rating-huge-number">
            {hasReviews ? Number(average_rating).toFixed(1) : '—'}
          </div>
          <div>
            <div className="stars-row">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  size={18}
                  className={hasReviews && s <= Math.round(Number(average_rating)) ? 'star-filled' : 'star-empty'}
                />
              ))}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              {hasReviews ? `${review_count} verified ${review_count === 1 ? 'review' : 'reviews'}` : 'No reviews yet'}
            </div>
          </div>
        </div>

        <div className="rating-integrity-notice">
          <ShieldCheck size={20} style={{ color: 'var(--primary-blue)', flexShrink: 0 }} />
          <span>
            <strong>Rating Integrity:</strong> Only customers with confirmed completed orders can submit reviews.
            Reviews and star ratings cannot be altered or removed by shop owners.
          </span>
        </div>
      </div>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="reviews-empty-box">
          <MessageSquare size={36} style={{ color: 'var(--text-muted)', margin: '0 auto 0.75rem' }} />
          <h3>No reviews yet</h3>
          <p>Once students pick up their completed orders, their ratings and reviews will appear here.</p>
        </div>
      ) : (
        <div className="shop-owner-reviews-list">
          {reviews.map((rev) => (
            <div key={rev.id} className="owner-review-card">
              <div className="owner-review-top">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span className="owner-reviewer-name">{rev.customer_name || 'Verified Customer'}</span>
                    {rev.order_number && (
                      <span className="review-order-ref">Order #{rev.order_number}</span>
                    )}
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

                <div className="owner-review-rating-pill">
                  ★ {rev.rating} / 5
                </div>
              </div>

              {rev.review_text && rev.review_text.trim() ? (
                <p className="owner-review-text">{rev.review_text}</p>
              ) : (
                <p className="owner-review-text-empty">Customer gave a star rating without written feedback.</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ShopReviewsTab;
