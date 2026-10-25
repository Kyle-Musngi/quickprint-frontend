import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Printer,
  Search,
  Upload,
  CreditCard,
  Clock,
  CheckCircle2,
  MapPin,
  FileText,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  HelpCircle,
  MessageSquare,
  X,
  Send,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { shopService, supportService, orderService } from '../../services/api';
import ShopStatusBadge from '../../components/ShopStatusBadge/ShopStatusBadge';
import './Home.css';

const FAQ_ITEMS = [
  {
    id: 'faq-payment',
    question: 'How does payment work?',
    answer: 'Univ Quick Print currently operates in a simulated Sandbox Payment Mode using virtual GCash, Maya, and GoTyme sandbox transactions. You can test successful, pending, or failed payments without spending real money. Real money transactions are not processed in sandbox mode.'
  },
  {
    id: 'faq-find-shop',
    question: 'How do I find a printing shop?',
    answer: 'Explore our Find Printing Shops directory to view partner shops in Cebu City. You can search by name or campus district, sort by lowest price per page or proximity, and view verified pricing and live operating schedules before submitting your print job.'
  },
  {
    id: 'faq-track-order',
    question: 'How can I track my order?',
    answer: 'You receive in-app real-time status updates as your order moves from Order Submitted → Accepted → Printing in Progress → Ready for Pickup. When your order is marked ready, bring your standardized UQP pickup code (e.g. UQP01) to the shop counter for immediate collection.'
  },
  {
    id: 'faq-cancel-order',
    question: 'Can I cancel an order?',
    answer: 'Orders can be cancelled from your Customer Dashboard while they remain in "Submitted" status. Once the printing shop accepts the order and starts paper production, cancellations are disabled to prevent paper and ink waste.'
  },
  {
    id: 'faq-register-shop',
    question: 'How do I register my printing shop?',
    answer: 'Printing shop owners can click "Shop Registration" in the navigation bar to submit business details, pricing matrix, and weekly operating hours. Our platform administration reviews each application before approving it for student discovery.'
  },
  {
    id: 'faq-formats-paper',
    question: 'What file formats and paper sizes are supported?',
    answer: 'PDFs are natively supported with automated page detection. Partner shops support standard Philippine academic sizes including A4, Letter (Short), and Legal (Long) in both black-and-white and full-color print modes.'
  }
];

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [featuredShops, setFeaturedShops] = useState([]);
  const [loadingShops, setLoadingShops] = useState(true);

  // Accordion state (single active item)
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  // Got a Question Modal state
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [questionSubject, setQuestionSubject] = useState('');
  const [questionCategory, setQuestionCategory] = useState('general');
  const [questionMessage, setQuestionMessage] = useState('');
  const [submittingQuestion, setSubmittingQuestion] = useState(false);
  const [questionSuccess, setQuestionSuccess] = useState('');
  const [questionError, setQuestionError] = useState('');
  const [readyOrder, setReadyOrder] = useState(null);

  // Retrieve ready-for-pickup orders ONLY for authenticated customers
  useEffect(() => {
    let isMounted = true;
    if (user && user.role === 'customer') {
      orderService.getOrders({ status: 'ready_for_pickup' })
        .then((res) => {
          if (!isMounted) return;
          const list = Array.isArray(res) ? res : (res?.results || []);
          const firstReady = list.find((o) => o.status === 'ready_for_pickup') || null;
          setReadyOrder(firstReady);
        })
        .catch(() => {
          if (isMounted) setReadyOrder(null);
        });
    } else {
      setReadyOrder(null);
    }
    return () => { isMounted = false; };
  }, [user]);

  // Handle hash scrolling for #how-it-works
  useEffect(() => {
    if (window.location.hash === '#how-it-works') {
      const el = document.getElementById('how-it-works');
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, [location.hash]);

  // Check if returning from login with ?askQuestion=true
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('askQuestion') === 'true') {
      if (user) {
        setShowQuestionModal(true);
      }
      navigate('/', { replace: true });
    }
  }, [location.search, user, navigate]);

  const handleOpenQuestionModal = () => {
    if (!user) {
      navigate('/login', {
        state: {
          message: 'Please log in to submit a question to the Univ Quick Print team.',
          askQuestion: true
        }
      });
      return;
    }
    setQuestionError('');
    setQuestionSuccess('');
    setShowQuestionModal(true);
  };

  const handleSubmitQuestion = async (e) => {
    e.preventDefault();
    if (!questionSubject.trim() || !questionMessage.trim()) {
      setQuestionError('Please fill out both the subject and question details.');
      return;
    }

    setSubmittingQuestion(true);
    setQuestionError('');

    try {
      await supportService.submitQuestion({
        subject: questionSubject.trim(),
        category: questionCategory,
        message: questionMessage.trim()
      });

      setQuestionSuccess('Your question has been submitted. Our team will review it.');
      setQuestionSubject('');
      setQuestionCategory('general');
      setQuestionMessage('');
      setTimeout(() => {
        setShowQuestionModal(false);
        setQuestionSuccess('');
      }, 2500);
    } catch (err) {
      const detail = err.response?.data?.message || err.response?.data?.detail || 'Failed to submit your question. Please check your connection and try again.';
      setQuestionError(detail);
    } finally {
      setSubmittingQuestion(false);
    }
  };

  useEffect(() => {
    shopService.getShops({ limit: 3 })
      .then((data) => {
        const list = Array.isArray(data) ? data : (data.results || []);
        setFeaturedShops(list.slice(0, 3));
      })
      .catch(() => {})
      .finally(() => setLoadingShops(false));
  }, []);

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="home-hero">
        <div className="home-hero-container">
          <div className="home-hero-content">
            <div className="home-hero-badge">
              <img
                src="/images/uqp-logo.png"
                alt="Univ Quick Print Logo"
                style={{ width: '18px', height: '18px', objectFit: 'contain', borderRadius: '4px' }}
              />
              <span>University Printing Reimagined</span>
            </div>
            <h1 className="home-hero-title">
              Skip the Line, <span>Print on Time.</span>
            </h1>
            <p className="home-hero-subtitle">
              Upload your files, find a nearby printing shop, choose your printing options, and pick up your documents when they’re ready.
            </p>
            <div className="home-hero-ctas">
              <Link to="/shops" className="home-btn-primary">
                Print Now <ArrowRight size={18} />
              </Link>
              <Link to="/shops" className="home-btn-secondary">
                <Search size={18} /> Find a Shop
              </Link>
            </div>
          </div>

          {/* Hero Visual Preview */}
          <div className="home-hero-visual">
            {readyOrder ? (
              <div className="hero-preview-card">
                <div className="preview-card-header">
                  <div>
                    <h3 style={{ margin: 0, color: 'var(--dark-blue)', fontSize: '1.15rem' }}>Ready for Pickup</h3>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Order #{readyOrder.order_number}</span>
                  </div>
                  <span className="live-badge" style={{ backgroundColor: '#DCFCE7', color: '#15803D' }}>
                    Printed & Ready
                  </span>
                </div>

                <div className="preview-item">
                  <div className="preview-item-icon">
                    <FileText size={20} />
                  </div>
                  <div className="preview-item-details">
                    <div className="preview-item-title">
                      {readyOrder.documents?.[0]?.original_filename || 'Printed Academic Document'}
                    </div>
                    <div className="preview-item-sub">
                      {readyOrder.documents?.length || 1} file(s) • Scheduled: {readyOrder.pickup_date || 'Today'} ({readyOrder.pickup_time_slot || 'Standard'})
                    </div>
                  </div>
                </div>

                <div className="preview-item">
                  <div className="preview-item-icon">
                    <MapPin size={20} />
                  </div>
                  <div className="preview-item-details">
                    <div className="preview-item-title">{readyOrder.shop_name}</div>
                    <div className="preview-item-sub">Present your code at the store pickup counter</div>
                  </div>
                </div>

                <div className="preview-pickup-chip">
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: 2, fontWeight: 600 }}>
                    YOUR GLOBAL PICKUP CODE
                  </div>
                  <div className="pickup-chip-code">{readyOrder.pickup_code}</div>
                </div>

                <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                  <Link
                    to={`/tracking/${readyOrder.id}`}
                    className="btn-nav-outline"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', width: '100%', justifyContent: 'center' }}
                  >
                    View Order Tracking & Instructions <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="hero-preview-card hero-feature-pillars">
                <div className="preview-card-header">
                  <div>
                    <h3 style={{ margin: 0, color: 'var(--dark-blue)', fontSize: '1.15rem' }}>Quick Print Workflow</h3>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Cebu Academic Printing Hub</span>
                  </div>
                  <span className="live-badge" style={{ backgroundColor: '#EFF6FF', color: 'var(--primary-blue)' }}>
                    Campus Verified
                  </span>
                </div>

                <div className="preview-item">
                  <div className="preview-item-icon" style={{ backgroundColor: '#EFF6FF', color: 'var(--primary-blue)' }}>
                    <Upload size={20} />
                  </div>
                  <div className="preview-item-details">
                    <div className="preview-item-title">Instant File Upload</div>
                    <div className="preview-item-sub">Automatic page count & accurate cost estimation</div>
                  </div>
                </div>

                <div className="preview-item">
                  <div className="preview-item-icon" style={{ backgroundColor: '#FEF3C7', color: '#B45309' }}>
                    <ShieldCheck size={20} />
                  </div>
                  <div className="preview-item-details">
                    <div className="preview-item-title">Pay Only After Acceptance</div>
                    <div className="preview-item-sub">Shop reviews file before sandbox payment is charged</div>
                  </div>
                </div>

                <div className="preview-item">
                  <div className="preview-item-icon" style={{ backgroundColor: '#DCFCE7', color: '#15803D' }}>
                    <Clock size={20} />
                  </div>
                  <div className="preview-item-details">
                    <div className="preview-item-title">Express Counter Collection</div>
                    <div className="preview-item-sub">Standardized UQP pickup code skips physical queues</div>
                  </div>
                </div>

                <div style={{ marginTop: '0.75rem', padding: '0.75rem', backgroundColor: 'var(--bg-subtle)', borderRadius: 8, fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                  {user ? 'Track all your active orders in your Customer Dashboard.' : 'Sign in or register to track orders and schedule pickups.'}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="home-section">
        <div className="home-section-header">
          <div className="home-section-subtitle">Effortless Workflow</div>
          <h2 className="home-section-title">How Univ Quick Print Works</h2>
          <p className="home-section-desc">
            Four simple steps designed to save you from long copy shop queues before exams and thesis deadlines.
          </p>
        </div>

        <div className="how-steps-grid">
          <div className="how-step-card">
            <div className="how-step-number">01</div>
            <div className="how-step-icon">
              <Search size={26} />
            </div>
            <h3>1. Find a Nearby Shop</h3>
            <p>
              Browse approved printing shops near university campuses in Cebu City. Filter by distance and price.
            </p>
          </div>

          <div className="how-step-card">
            <div className="how-step-number">02</div>
            <div className="how-step-icon">
              <Upload size={26} />
            </div>
            <h3>2. Upload & Configure</h3>
            <p>
              Upload your PDF or documents. Automatic page count detection calculates the exact cost for paper size, color, and double-sided sheets.
            </p>
          </div>

          <div className="how-step-card">
            <div className="how-step-number">03</div>
            <div className="how-step-icon">
              <CreditCard size={26} />
            </div>
            <h3>3. Sandbox Payment</h3>
            <p>
              Simulate payments safely via GCash, Maya, or GoTyme with our sandbox-first architecture. Schedule your pickup time slot.
            </p>
          </div>

          <div className="how-step-card">
            <div className="how-step-number">04</div>
            <div className="how-step-icon">
              <CheckCircle2 size={26} />
            </div>
            <h3>4. Pick Up On Time</h3>
            <p>
              Track live production status. When ready, simply walk up and show your unique global pickup code (e.g., UQP01) at the counter.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Shops Section */}
      <section className="home-section" style={{ paddingTop: 0 }}>
        <div className="home-section-header">
          <div className="home-section-subtitle">Verified Printing Partners</div>
          <h2 className="home-section-title">Popular Campus Printing Shops</h2>
          <p className="home-section-desc">
            Approved partner print shops located near universities in Cebu.
          </p>
        </div>

        {loadingShops ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
            Loading nearby printing shops...
          </div>
        ) : (
          <div className="shops-preview-grid">
            {featuredShops.map((shop) => (
              <div key={shop.id} className="shop-home-card">
                <div className="shop-card-banner">
                  <span className="shop-status-tag">{shop.city}</span>
                  <ShopStatusBadge isOpen={shop.is_open} />
                </div>
                <div className="shop-card-body">
                  <h3 className="shop-card-name">{shop.name}</h3>
                  <p className="shop-card-address">
                    <MapPin size={14} /> {shop.address}
                  </p>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem', flex: 1 }}>
                    {shop.description || 'Fast university printing, thesis binding, and xerox services.'}
                  </p>
                  <div className="shop-card-footer">
                    <div>
                      <div className="shop-price-label">Starting Price</div>
                      <div className="shop-price-value">
                        {shop.starting_price ? `₱${shop.starting_price}/page` : '₱1.50/page'}
                      </div>
                    </div>
                    <Link to={`/shops/${shop.id}`} className="home-btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                      View Shop
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
          <Link to="/shops" className="home-btn-secondary">
            View All Printing Shops <ChevronRight size={18} />
          </Link>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="home-benefits home-section">
        <div className="home-section-header">
          <div className="home-section-subtitle">Built for Students & Shops</div>
          <h2 className="home-section-title">Why Use Univ Quick Print?</h2>
          <p className="home-section-desc">
            We bridge the gap between busy campus students and local printing businesses.
          </p>
        </div>

        <div className="benefits-grid">
          <div className="benefit-card">
            <div className="benefit-icon">
              <Clock size={24} />
            </div>
            <h3>Zero Queue Waiting</h3>
            <p>
              Never stand in line for 30 minutes before your 8:00 AM class. Upload ahead of time and grab your printed package immediately.
            </p>
          </div>

          <div className="benefit-card">
            <div className="benefit-icon">
              <ShieldCheck size={24} />
            </div>
            <h3>Authoritative Pricing</h3>
            <p>
              No surprise fees at the counter. The backend calculates your exact bill down to the centavo according to the shop’s verified rules.
            </p>
          </div>

          <div className="benefit-card">
            <div className="benefit-icon">
              <Printer size={24} />
            </div>
            <h3>Global Sequential Codes</h3>
            <p>
              Every accepted order is given a standardized UQP pickup code (UQP01, UQP02) so shop staff can locate your paper stack instantly.
            </p>
          </div>
        </div>
      </section>

      {/* Shop Partner Banner */}
      <section className="home-section">
        <div className="partner-banner">
          <div className="partner-content">
            <h2>Own a Printing Business Near a Campus?</h2>
            <p>
              Boost your daily print volume, eliminate counter congestion, and receive organized digital print orders with Univ Quick Print.
            </p>
          </div>
          <Link to="/shop-registration" className="partner-btn">
            Register Your Shop
          </Link>
        </div>
      </section>

      {/* Frequently Asked Questions - Animated Accordion */}
      <section className="home-section" id="faqs" style={{ paddingTop: 0 }}>
        <div className="home-section-header">
          <div className="home-section-subtitle">Help & Answers</div>
          <h2 className="home-section-title">Frequently Asked Questions</h2>
          <p className="home-section-desc">
            Find quick answers about document printing, simulated sandbox payments, pickup codes, and shop applications.
          </p>
        </div>

        <div className="faqs-container">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = openFaqIndex === index;
            const buttonId = `faq-btn-${item.id}`;
            const panelId = `faq-panel-${item.id}`;

            return (
              <div key={item.id} className={`faq-item ${isOpen ? 'active' : ''}`}>
                <button
                  type="button"
                  id={buttonId}
                  className="faq-question-btn"
                  onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                >
                  <span>{item.question}</span>
                  <ChevronDown
                    size={20}
                    className={`faq-chevron ${isOpen ? 'expanded' : ''}`}
                    aria-hidden="true"
                  />
                </button>
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  className={`faq-answer-collapse ${isOpen ? 'open' : ''}`}
                >
                  <div className="faq-answer-inner">
                    <p className="faq-answer-content">{item.answer}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Got a Question? Section */}
        <div className="ask-question-section">
          <div className="ask-question-card">
            <div className="ask-question-icon-wrap">
              <HelpCircle size={28} />
            </div>
            <h3>Got a Question?</h3>
            <p>
              Can’t find what you’re looking for in our FAQs? Ask our team directly and we’ll review your inquiry regarding order statuses, shop registration, or payment verification.
            </p>
            <div className="ask-question-actions">
              <button
                type="button"
                className="home-btn-primary"
                onClick={handleOpenQuestionModal}
              >
                <MessageSquare size={18} /> Ask a Question
              </button>
              <a
                href="#faqs"
                className="home-btn-secondary"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('faqs')?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Back to Top of FAQs
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Support Question Modal */}
      {showQuestionModal && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="question-modal-title"
          onClick={() => !submittingQuestion && setShowQuestionModal(false)}
        >
          <div className="question-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-text">
                <h3 id="question-modal-title">Ask a Question</h3>
                <p>Submit your inquiry directly to the Univ Quick Print team.</p>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowQuestionModal(false)}
                disabled={submittingQuestion}
                aria-label="Close question modal"
              >
                <X size={20} />
              </button>
            </div>

            {questionSuccess ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', backgroundColor: '#DEF7EC', color: '#03543F', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                  <CheckCircle2 size={30} />
                </div>
                <h4 style={{ color: 'var(--dark-blue)', marginBottom: '0.5rem', fontSize: '1.2rem' }}>Question Submitted!</h4>
                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.95rem' }}>
                  {questionSuccess}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitQuestion}>
                {questionError && (
                  <div style={{ backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', padding: '0.75rem 1rem', borderRadius: 8, fontSize: '0.88rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <AlertCircle size={16} style={{ flexShrink: 0 }} />
                    <span>{questionError}</span>
                  </div>
                )}

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label" htmlFor="question-subject">Subject</label>
                  <input
                    id="question-subject"
                    type="text"
                    className="form-input"
                    placeholder="e.g. Order pickup clarification or shop pricing"
                    value={questionSubject}
                    onChange={(e) => setQuestionSubject(e.target.value)}
                    maxLength={255}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: '1rem' }}>
                  <label className="form-label" htmlFor="question-category">Category</label>
                  <select
                    id="question-category"
                    className="form-input"
                    value={questionCategory}
                    onChange={(e) => setQuestionCategory(e.target.value)}
                  >
                    <option value="general">General Inquiry</option>
                    <option value="order">Order & Printing</option>
                    <option value="payment">Payments & Sandbox</option>
                    <option value="shop">Shop Registration</option>
                    <option value="technical">Technical Issue</option>
                  </select>
                </div>

                <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                  <label className="form-label" htmlFor="question-message">Question Details</label>
                  <textarea
                    id="question-message"
                    className="form-input"
                    rows="4"
                    placeholder="Describe your inquiry with any relevant details..."
                    value={questionMessage}
                    onChange={(e) => setQuestionMessage(e.target.value)}
                    required
                  />
                </div>

                <div className="question-form-actions">
                  <button
                    type="button"
                    className="btn-nav-outline"
                    onClick={() => setShowQuestionModal(false)}
                    disabled={submittingQuestion}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="home-btn-primary"
                    disabled={submittingQuestion}
                    style={{ padding: '0.65rem 1.5rem', fontSize: '0.95rem' }}
                  >
                    <Send size={15} /> {submittingQuestion ? 'Submitting...' : 'Submit Question'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
