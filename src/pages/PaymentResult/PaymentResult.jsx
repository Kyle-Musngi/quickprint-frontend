import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, Clock, XCircle, ArrowRight, RotateCcw, Home } from 'lucide-react';
import './PaymentResult.css';

const PaymentResult = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const status = searchParams.get('status') || 'success';
  const txnRef = searchParams.get('ref') || 'TXN-SANDBOX-DEMO';

  const isSuccess = status === 'success';
  const isPending = status === 'pending';
  const isFailed = status === 'failed';

  return (
    <div className="payment-result-page">
      <div className="result-card">
        {isSuccess && (
          <>
            <div className="result-icon-wrap result-icon-success">
              <CheckCircle2 size={40} />
            </div>
            <h1 className="result-title">Payment Successful!</h1>
            <p className="result-desc">
              Your sandbox payment was processed successfully. The printing shop has been notified and will begin preparing your documents.
            </p>
          </>
        )}

        {isPending && (
          <>
            <div className="result-icon-wrap result-icon-pending">
              <Clock size={40} />
            </div>
            <h1 className="result-title">Payment Pending Verification</h1>
            <p className="result-desc">
              Your sandbox transaction is awaiting callback verification. Please check your order status shortly.
            </p>
          </>
        )}

        {isFailed && (
          <>
            <div className="result-icon-wrap result-icon-failed">
              <XCircle size={40} />
            </div>
            <h1 className="result-title">Payment Simulation Failed</h1>
            <p className="result-desc">
              The test transaction was not completed. You can retry with another sandbox payment method.
            </p>
          </>
        )}

        <div className="result-details-box">
          <div className="result-row">
            <span>Transaction Mode:</span>
            <strong style={{ color: 'var(--color-warning)' }}>Sandbox Simulation</strong>
          </div>
          <div className="result-row">
            <span>Transaction Reference:</span>
            <strong style={{ fontFamily: 'monospace' }}>{txnRef}</strong>
          </div>
          <div className="result-row">
            <span>Status:</span>
            <strong style={{ textTransform: 'uppercase', color: isSuccess ? 'var(--color-success)' : isPending ? 'var(--color-warning)' : 'var(--color-error)' }}>
              {status}
            </strong>
          </div>
        </div>

        <div className="result-actions-wrap">
          {orderId && (
            <Link to={`/tracking/${orderId}`} className="home-btn-primary">
              Track Order Status <ArrowRight size={18} />
            </Link>
          )}

          {isFailed && orderId && (
            <Link to={`/payment/${orderId}`} className="home-btn-secondary">
              <RotateCcw size={16} /> Retry Payment
            </Link>
          )}

          <Link to="/" className="btn-nav-outline">
            <Home size={16} /> Return Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentResult;
