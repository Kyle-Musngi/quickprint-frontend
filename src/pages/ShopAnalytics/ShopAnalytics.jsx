import React, { useState, useEffect } from 'react';
import { BarChart2, TrendingUp, Package, CheckCircle2, DollarSign, Calendar } from 'lucide-react';
import { analyticsService } from '../../services/api';
import './ShopAnalytics.css';

const ShopAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsService.getShopOverview()
      .then((res) => setData(res))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-secondary)' }}>Loading analytics...</div>;
  }

  if (!data) {
    return <div style={{ textAlign: 'center', padding: '5rem' }}>No analytics data available.</div>;
  }

  const { status_counts, today_orders, monthly_orders, recorded_payments_total } = data;
  const total = status_counts?.total || 1;
  const completed = status_counts?.completed || 0;
  const completionRate = Math.round((completed / Math.max(1, total)) * 100);

  return (
    <div className="shop-analytics-page">
      <div className="analytics-header">
        <h1 className="analytics-title">Print Shop Analytics & Performance</h1>
        <p style={{ color: 'var(--text-secondary)' }}>
          Review your shop's order volumes, completion rate, and recorded payment summaries.
        </p>
      </div>

      <div className="shop-stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue"><Calendar size={24} /></div>
          <div>
            <div className="stat-num">{today_orders}</div>
            <div className="stat-label">Today's Orders</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon purple"><Package size={24} /></div>
          <div>
            <div className="stat-num">{monthly_orders}</div>
            <div className="stat-label">This Month's Orders</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green"><CheckCircle2 size={24} /></div>
          <div>
            <div className="stat-num">{completionRate}%</div>
            <div className="stat-label">Completion Rate</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon orange"><DollarSign size={24} /></div>
          <div>
            <div className="stat-num">₱{parseFloat(recorded_payments_total || '0').toFixed(2)}</div>
            <div className="stat-label">Recorded Payments (Sandbox)</div>
          </div>
        </div>
      </div>

      <div className="analytics-card">
        <h2 className="analytics-card-title">
          <BarChart2 size={20} style={{ color: 'var(--primary-blue)' }} /> Order Lifecycle Distribution
        </h2>

        <div className="status-bars-list">
          <div className="status-bar-item">
            <div className="status-bar-label">
              <span>New Submissions Awaiting Acceptance</span>
              <strong>{status_counts.submitted} ({Math.round((status_counts.submitted / total) * 100)}%)</strong>
            </div>
            <div className="status-bar-track">
              <div
                className="status-bar-fill"
                style={{ width: `${(status_counts.submitted / total) * 100}%`, backgroundColor: '#F59E0B' }}
              />
            </div>
          </div>

          <div className="status-bar-item">
            <div className="status-bar-label">
              <span>In Production (Accepted / Printing)</span>
              <strong>{(status_counts.accepted || 0) + (status_counts.printing || 0)}</strong>
            </div>
            <div className="status-bar-track">
              <div
                className="status-bar-fill"
                style={{ width: `${(((status_counts.accepted || 0) + (status_counts.printing || 0)) / total) * 100}%`, backgroundColor: 'var(--primary-blue)' }}
              />
            </div>
          </div>

          <div className="status-bar-item">
            <div className="status-bar-label">
              <span>Ready for Counter Pickup</span>
              <strong>{status_counts.ready_for_pickup}</strong>
            </div>
            <div className="status-bar-track">
              <div
                className="status-bar-fill"
                style={{ width: `${(status_counts.ready_for_pickup / total) * 100}%`, backgroundColor: '#9333EA' }}
              />
            </div>
          </div>

          <div className="status-bar-item">
            <div className="status-bar-label">
              <span>Completed & Picked Up</span>
              <strong>{status_counts.completed}</strong>
            </div>
            <div className="status-bar-track">
              <div
                className="status-bar-fill"
                style={{ width: `${(status_counts.completed / total) * 100}%`, backgroundColor: 'var(--color-success)' }}
              />
            </div>
          </div>

          <div className="status-bar-item">
            <div className="status-bar-label">
              <span>Cancelled / Rejected</span>
              <strong>{(status_counts.cancelled || 0) + (status_counts.rejected || 0)}</strong>
            </div>
            <div className="status-bar-track">
              <div
                className="status-bar-fill"
                style={{ width: `${(((status_counts.cancelled || 0) + (status_counts.rejected || 0)) / total) * 100}%`, backgroundColor: 'var(--color-error)' }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopAnalytics;
