import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  HelpCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Send,
  X,
  RotateCcw,
  User,
  Mail,
  Calendar,
  Tag
} from 'lucide-react';
import { supportService } from '../../services/api';
import './AdminSupportQuestions.css';

const AdminSupportQuestions = () => {
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedQuestion, setSelectedQuestion] = useState(null);

  // Reply form state
  const [replyText, setReplyText] = useState('');
  const [replyStatus, setReplyStatus] = useState('answered');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [replySuccess, setReplySuccess] = useState('');
  const [replyError, setReplyError] = useState('');

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      const data = await supportService.getAdminQuestions(params);
      const list = Array.isArray(data) ? data : (data.results || []);
      setQuestions(list);
    } catch {
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [statusFilter]);

  const handleOpenDetail = (q) => {
    setSelectedQuestion(q);
    setReplyText(q.admin_response || '');
    setReplyStatus(q.status === 'open' ? 'answered' : q.status);
    setReplySuccess('');
    setReplyError('');
  };

  const handleCloseDetail = () => {
    setSelectedQuestion(null);
    setReplyText('');
    setReplySuccess('');
    setReplyError('');
  };

  const handleSubmitAnswer = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) {
      setReplyError('Please provide a response before submitting.');
      return;
    }

    setSubmittingReply(true);
    setReplyError('');
    setReplySuccess('');

    try {
      const updated = await supportService.answerQuestion(selectedQuestion.id, {
        admin_response: replyText.trim(),
        status: replyStatus,
      });

      setReplySuccess('Answer successfully saved and notified to the student.');
      setSelectedQuestion(updated);
      fetchQuestions();
    } catch (err) {
      setReplyError(
        err.response?.data?.error ||
        err.response?.data?.detail ||
        'Failed to save answer. Please retry.'
      );
    } finally {
      setSubmittingReply(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'open':
        return <span className="q-status-badge q-status-open"><Clock size={12} /> Open</span>;
      case 'in_progress':
        return <span className="q-status-badge q-status-in_progress"><Clock size={12} /> In Progress</span>;
      case 'answered':
        return <span className="q-status-badge q-status-answered"><CheckCircle2 size={12} /> Answered</span>;
      case 'resolved':
        return <span className="q-status-badge q-status-resolved"><CheckCircle2 size={12} /> Resolved</span>;
      default:
        return <span className="q-status-badge">{status}</span>;
    }
  };

  const counts = {
    all: questions.length,
    open: questions.filter(q => q.status === 'open').length,
    in_progress: questions.filter(q => q.status === 'in_progress').length,
    answered: questions.filter(q => q.status === 'answered').length,
    resolved: questions.filter(q => q.status === 'resolved').length,
  };

  return (
    <div className="admin-questions-page">
      {/* Header & Back Button */}
      <div className="admin-questions-header">
        <div className="admin-questions-header-left">
          <button
            type="button"
            onClick={() => navigate('/admin/dashboard')}
            className="admin-back-btn"
          >
            <ArrowLeft size={16} /> Back to Admin Dashboard
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
            <img
              src="/images/uqp-logo.png"
              alt="Univ Quick Print Logo"
              style={{ width: '48px', height: '48px', objectFit: 'contain', borderRadius: '8px', flexShrink: 0 }}
            />
            <div>
              <h1 className="admin-questions-title">Customer Support & Questions</h1>
              <p className="admin-questions-subtitle" style={{ margin: 0 }}>
                Review and answer customer inquiries submitted through "Got a Question?". Answers are immediately delivered to student accounts.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchQuestions}
          className="btn-nav-outline"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <RotateCcw size={15} /> Refresh Inbox
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="questions-filter-bar">
        <div className="questions-status-tabs">
          {[
            { id: 'all', label: 'All Questions' },
            { id: 'open', label: 'Open' },
            { id: 'in_progress', label: 'In Progress' },
            { id: 'answered', label: 'Answered' },
            { id: 'resolved', label: 'Resolved' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`question-tab-btn ${statusFilter === tab.id ? 'active' : ''}`}
              onClick={() => setStatusFilter(tab.id)}
            >
              {tab.label}
              {statusFilter === 'all' && (
                <span className="questions-count-badge">
                  {counts[tab.id] || 0}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* List Container */}
      <div className="questions-list-container">
        {loading ? (
          <div style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            Loading customer inquiries...
          </div>
        ) : questions.length === 0 ? (
          <div style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
            <HelpCircle size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 1rem' }} />
            <h3 style={{ color: 'var(--dark-blue)', marginBottom: '0.5rem' }}>No Questions Found</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              No inquiries match this status filter.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="questions-table">
              <thead>
                <tr>
                  <th>Subject & Details</th>
                  <th>Customer</th>
                  <th>Category</th>
                  <th>Submitted</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {questions.map((q) => (
                  <tr key={q.id} onClick={() => handleOpenDetail(q)}>
                    <td style={{ maxWidth: 360 }}>
                      <div className="question-subject-cell">{q.subject}</div>
                      <div className="question-snippet-cell">{q.message}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--dark-blue)' }}>{q.user_name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{q.user_email}</div>
                    </td>
                    <td>
                      <span className="question-category-tag">{q.category}</span>
                    </td>
                    <td style={{ whiteSpace: 'nowrap', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {new Date(q.created_at).toLocaleDateString()}
                    </td>
                    <td>{getStatusBadge(q.status)}</td>
                    <td>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDetail(q);
                        }}
                        className="btn-nav-outline"
                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}
                      >
                        {q.admin_response ? 'View / Update' : 'Answer'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Question Details & Answer Modal */}
      {selectedQuestion && (
        <div className="question-modal-backdrop" onClick={handleCloseDetail}>
          <div className="question-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="question-modal-header">
              <div>
                <span className="question-category-tag" style={{ marginBottom: '0.5rem' }}>
                  {selectedQuestion.category}
                </span>
                <h2 style={{ fontSize: '1.25rem', color: 'var(--dark-blue)', margin: 0, fontWeight: 800 }}>
                  {selectedQuestion.subject}
                </h2>
              </div>
              <button
                type="button"
                onClick={handleCloseDetail}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="question-modal-body">
              {/* Customer Info Grid */}
              <div className="question-info-grid">
                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Customer
                  </div>
                  <div style={{ fontWeight: 600, color: 'var(--dark-blue)', marginTop: '0.2rem' }}>
                    {selectedQuestion.user_name}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    {selectedQuestion.user_email}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Submission Date & Status
                  </div>
                  <div style={{ marginTop: '0.2rem' }}>
                    {new Date(selectedQuestion.created_at).toLocaleString()}
                  </div>
                  <div style={{ marginTop: '0.35rem' }}>
                    {getStatusBadge(selectedQuestion.status)}
                  </div>
                </div>
              </div>

              {/* Original Question Content */}
              <div className="question-original-box">
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  Student Inquiry:
                </div>
                <p style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.6, color: 'var(--text-main)', fontSize: '0.95rem' }}>
                  {selectedQuestion.message}
                </p>
              </div>

              {/* Existing Response History if Available */}
              {selectedQuestion.admin_response && (
                <div className="question-answer-history-box">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                    <div style={{ fontWeight: 700, color: '#166534', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <CheckCircle2 size={16} /> Official Platform Answer
                    </div>
                    {selectedQuestion.answered_at && (
                      <div style={{ fontSize: '0.75rem', color: '#166534' }}>
                        Answered {new Date(selectedQuestion.answered_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                  <p style={{ margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.5, color: '#14532D', fontSize: '0.92rem' }}>
                    {selectedQuestion.admin_response}
                  </p>
                </div>
              )}

              {/* Answer Form */}
              <form onSubmit={handleSubmitAnswer} className="question-reply-form">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label htmlFor="admin-reply-textarea" style={{ fontWeight: 700, color: 'var(--dark-blue)', fontSize: '0.95rem' }}>
                    {selectedQuestion.admin_response ? 'Update Answer' : 'Submit Official Response'}
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <label htmlFor="reply-status-select" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      Set Status:
                    </label>
                    <select
                      id="reply-status-select"
                      value={replyStatus}
                      onChange={(e) => setReplyStatus(e.target.value)}
                      style={{ padding: '0.3rem 0.6rem', borderRadius: 6, border: '1px solid var(--border-color)', fontSize: '0.85rem' }}
                    >
                      <option value="answered">Answered</option>
                      <option value="resolved">Resolved</option>
                      <option value="in_progress">In Progress</option>
                    </select>
                  </div>
                </div>

                <textarea
                  id="admin-reply-textarea"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type an official answer to help the student..."
                  className="question-reply-textarea"
                  rows={4}
                />

                {replyError && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-error)', fontSize: '0.85rem' }}>
                    <AlertCircle size={15} /> {replyError}
                  </div>
                )}

                {replySuccess && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--color-success)', fontSize: '0.85rem' }}>
                    <CheckCircle2 size={15} /> {replySuccess}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={handleCloseDetail}
                    className="btn-nav-outline"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={submittingReply || !replyText.trim()}
                    className="home-btn-primary"
                    style={{ padding: '0.6rem 1.25rem', fontSize: '0.9rem' }}
                  >
                    {submittingReply ? (
                      'Saving...'
                    ) : (
                      <>
                        <Send size={15} /> {selectedQuestion.admin_response ? 'Update Answer' : 'Send Answer'}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSupportQuestions;
