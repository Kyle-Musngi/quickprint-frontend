import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  HelpCircle,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  PlusCircle,
  ChevronLeft
} from 'lucide-react';
import { supportService } from '../../services/api';
import './CustomerSupportQuestions.css';

const CustomerSupportQuestions = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supportService.getMyQuestions()
      .then((data) => {
        const list = Array.isArray(data) ? data : (data.results || []);
        setQuestions(list);
      })
      .catch(() => setQuestions([]))
      .finally(() => setLoading(false));
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'open':
        return (
          <span style={{ background: '#FEF3C7', color: '#B45309', fontWeight: 700, fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: 12, textTransform: 'uppercase' }}>
            Open
          </span>
        );
      case 'in_progress':
        return (
          <span style={{ background: '#EFF6FF', color: '#1D4ED8', fontWeight: 700, fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: 12, textTransform: 'uppercase' }}>
            In Progress
          </span>
        );
      case 'answered':
      case 'resolved':
        return (
          <span style={{ background: '#DCFCE7', color: '#15803D', fontWeight: 700, fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: 12, textTransform: 'uppercase' }}>
            Answered
          </span>
        );
      default:
        return (
          <span style={{ background: '#F3F4F6', color: '#4B5563', fontWeight: 700, fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: 12, textTransform: 'uppercase' }}>
            {status}
          </span>
        );
    }
  };

  return (
    <div className="customer-questions-page">
      <div className="customer-questions-header">
        <div>
          <Link
            to="/customer/dashboard"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', color: 'var(--primary-blue)', fontSize: '0.85rem', fontWeight: 600, textDecoration: 'none', marginBottom: '0.5rem' }}
          >
            <ChevronLeft size={16} /> Back to Customer Dashboard
          </Link>
          <h1 className="customer-questions-title">My Support Inquiries</h1>
          <p className="customer-questions-subtitle">
            View your questions submitted to Univ Quick Print administration and official responses.
          </p>
        </div>

        <Link to="/?askQuestion=true" className="home-btn-primary">
          <PlusCircle size={16} /> Ask a Question
        </Link>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-secondary)' }}>
          Loading your questions...
        </div>
      ) : questions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem 1.5rem', background: '#fff', borderRadius: 12, border: '1px solid var(--border-color)' }}>
          <HelpCircle size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem' }} />
          <h3 style={{ color: 'var(--dark-blue)', marginBottom: '0.5rem' }}>No Questions Yet</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
            Have a question about document uploads, pricing, or sandbox payments? Our team is here to help.
          </p>
          <Link to="/?askQuestion=true" className="home-btn-primary" style={{ display: 'inline-flex' }}>
            Submit Your First Question
          </Link>
        </div>
      ) : (
        <div className="questions-grid">
          {questions.map((q) => (
            <div key={q.id} className="question-card">
              <div className="question-card-top">
                <div>
                  <h3 className="question-card-subject">{q.subject}</h3>
                  <div className="question-card-meta">
                    Category: <strong style={{ textTransform: 'capitalize' }}>{q.category}</strong> • Submitted {new Date(q.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div>{getStatusBadge(q.status)}</div>
              </div>

              <p className="question-card-message">{q.message}</p>

              {q.admin_response ? (
                <div className="question-admin-response-box">
                  <div className="response-box-header">
                    <div className="response-badge-title">
                      <CheckCircle2 size={16} /> Official Response from UQP Support
                    </div>
                    {q.answered_at && (
                      <span style={{ fontSize: '0.78rem', color: '#166534' }}>
                        {new Date(q.answered_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <p className="response-box-text">{q.admin_response}</p>
                </div>
              ) : (
                <div className="question-pending-box">
                  <Clock size={16} />
                  <span>Our support team is reviewing your inquiry. You'll receive a response here shortly.</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomerSupportQuestions;
