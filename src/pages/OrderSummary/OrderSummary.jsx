import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Printer, ArrowLeft, Download, CheckCircle } from 'lucide-react';
import { orderService } from '../../services/api';
import './OrderSummary.css';

const OrderSummary = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderService.getOrder(id)
      .then((data) => setOrder(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-secondary)' }}>Loading order receipt...</div>;
  }

  if (!order) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem' }}>
        <h2>Order Not Found</h2>
        <Link to="/customer/orders" style={{ color: 'var(--primary-blue)', marginTop: '1rem', display: 'inline-block' }}>
          Back to Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="order-summary-page">
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to={`/tracking/${order.id}`} className="back-link">
          <ArrowLeft size={16} /> Back to Live Tracking
        </Link>
        <button
          onClick={() => window.print()}
          className="btn-nav-outline"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <Printer size={16} /> Print Receipt
        </button>
      </div>

      <div className="summary-sheet">
        <div className="summary-header">
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--primary-blue)', fontWeight: 700, textTransform: 'uppercase' }}>
              Univ Quick Print Order Receipt
            </div>
            <div className="summary-ref">{order.order_number}</div>
            <div className="summary-date">Submitted on {new Date(order.created_at).toLocaleString()}</div>
          </div>
          {order.pickup_code && (
            <div style={{ background: '#EFF6FF', border: '1px dashed var(--primary-blue)', padding: '0.6rem 1rem', borderRadius: 8, textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>PICKUP CODE</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary-blue)' }}>{order.pickup_code}</div>
            </div>
          )}
        </div>

        <div className="summary-grid-2">
          <div>
            <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>PRINTING SHOP</h4>
            <div style={{ fontWeight: 700, color: 'var(--dark-blue)' }}>{order.shop?.name}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{order.shop?.address}, {order.shop?.city}</div>
          </div>
          <div>
            <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>PICKUP SCHEDULE</h4>
            <div style={{ fontWeight: 700, color: 'var(--dark-blue)' }}>{order.pickup_date || 'Standard pickup'}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{order.pickup_time_slot || 'Regular hours'}</div>
          </div>
        </div>

        <table className="summary-table">
          <thead>
            <tr>
              <th>Document</th>
              <th>Pages</th>
              <th>Configuration</th>
              <th>Copies</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {order.documents?.map((doc) => (
              <tr key={doc.id}>
                <td><strong>{doc.original_filename}</strong></td>
                <td>{doc.page_count}</td>
                <td>{doc.paper_size} • {doc.color_mode} • {doc.print_side}</td>
                <td>{doc.copies}</td>
                <td style={{ fontWeight: 700 }}>₱{parseFloat(doc.calculated_total).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="summary-total-box">
          Total Payable: ₱{parseFloat(order.total_amount).toFixed(2)}
        </div>
      </div>
    </div>
  );
};

export default OrderSummary;
