/**
 * Univ Quick Print (UQP) - Order Status Formatting Utility
 * Maps internal database status values to clear, human-readable display labels and badge styles.
 */

export const ORDER_STATUS_MAP = {
  pending_acceptance: { label: 'Pending Acceptance', color: '#B45309', bg: '#FEF3C7' },
  submitted: { label: 'Pending Acceptance', color: '#B45309', bg: '#FEF3C7' },
  received: { label: 'Received', color: '#B45309', bg: '#FEF3C7' },
  awaiting_payment: { label: 'Awaiting Payment', color: '#C2410C', bg: '#FFF7ED' },
  accepted: { label: 'Awaiting Payment', color: '#C2410C', bg: '#FFF7ED' },
  payment_failed: { label: 'Payment Failed', color: '#DC2626', bg: '#FEF2F2' },
  in_production: { label: 'In Production', color: '#2563EB', bg: '#EFF6FF' },
  printing: { label: 'In Production', color: '#2563EB', bg: '#EFF6FF' },
  ready_for_pickup: { label: 'Ready for Pickup', color: '#7E22CE', bg: '#FAF5FF' },
  completed: { label: 'Completed', color: '#15803D', bg: '#DCFCE7' },
  rejected: { label: 'Rejected', color: '#DC2626', bg: '#FEF2F2' },
  cancelled: { label: 'Cancelled', color: '#4B5563', bg: '#F3F4F6' },
  expired: { label: 'Expired', color: '#6B7280', bg: '#F3F4F6' },
};

/**
 * Returns a human-readable string label for any internal order status.
 * e.g. "ready_for_pickup" -> "Ready for Pickup"
 */
export function formatOrderStatus(status) {
  if (!status) return 'Unknown Status';
  const clean = String(status).toLowerCase().trim();
  if (ORDER_STATUS_MAP[clean]) {
    return ORDER_STATUS_MAP[clean].label;
  }
  // Fallback: replace all underscores and title-case words
  return clean
    .split('_')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Returns badge styling metadata (label, text color, background color).
 */
export function getOrderStatusBadge(status) {
  if (!status) {
    return { label: 'Unknown', color: '#6B7280', bg: '#F3F4F6' };
  }
  const clean = String(status).toLowerCase().trim();
  if (ORDER_STATUS_MAP[clean]) {
    return ORDER_STATUS_MAP[clean];
  }
  return {
    label: formatOrderStatus(status),
    color: '#334155',
    bg: '#F1F5F9',
  };
}

/**
 * Formats payment status cleanly.
 */
export function formatPaymentStatus(status) {
  if (!status) return 'Unpaid';
  const clean = String(status).toLowerCase().trim();
  if (clean === 'paid') return 'Paid';
  if (clean === 'unpaid') return 'Unpaid';
  if (clean === 'pending') return 'Pending Payment';
  if (clean === 'failed') return 'Payment Failed';
  if (clean === 'refunded') return 'Refunded';
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

export function getPaymentStatusBadge(status) {
  const clean = String(status || 'unpaid').toLowerCase().trim();
  if (clean === 'paid') return { label: 'Paid', color: '#15803D', bg: '#DCFCE7' };
  if (clean === 'refunded') return { label: 'Refunded', color: '#7E22CE', bg: '#FAF5FF' };
  if (clean === 'failed') return { label: 'Payment Failed', color: '#DC2626', bg: '#FEF2F2' };
  if (clean === 'pending') return { label: 'Pending Payment', color: '#C2410C', bg: '#FFF7ED' };
  return { label: 'Unpaid', color: '#C2410C', bg: '#FFF7ED' };
}

/**
 * Refund Status Mapping & Formatting
 */
export const REFUND_STATUS_MAP = {
  pending: { label: 'Pending Review', color: '#B45309', bg: '#FEF3C7' },
  under_review: { label: 'Under Review', color: '#B45309', bg: '#FEF3C7' },
  approved: { label: 'Approved', color: '#15803D', bg: '#DCFCE7' },
  processing: { label: 'Processing', color: '#2563EB', bg: '#EFF6FF' },
  completed: { label: 'Refunded', color: '#047857', bg: '#D1FAE5' },
  refunded: { label: 'Refunded', color: '#047857', bg: '#D1FAE5' },
  rejected: { label: 'Rejected', color: '#DC2626', bg: '#FEF2F2' },
  failed: { label: 'Failed', color: '#DC2626', bg: '#FEF2F2' },
  cancelled: { label: 'Cancelled', color: '#4B5563', bg: '#F3F4F6' },
};

export function formatRefundStatus(status) {
  if (!status) return 'Pending Review';
  const clean = String(status).toLowerCase().trim();
  if (REFUND_STATUS_MAP[clean]) {
    return REFUND_STATUS_MAP[clean].label;
  }
  return clean
    .split('_')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function getRefundStatusBadge(status) {
  if (!status) {
    return { label: 'Pending Review', color: '#B45309', bg: '#FEF3C7' };
  }
  const clean = String(status).toLowerCase().trim();
  if (REFUND_STATUS_MAP[clean]) {
    return REFUND_STATUS_MAP[clean];
  }
  return {
    label: formatRefundStatus(status),
    color: '#334155',
    bg: '#F1F5F9',
  };
}

/**
 * Returns distinct badge styling for orders that have a refund request.
 * Displays "Requesting Refund" for pending or under_review, and the specific
 * existing refund status for approved, rejected, processing, completed, etc.
 */
export function getOrderRefundBadge(status) {
  if (!status) return null;
  const clean = String(status).toLowerCase().trim();
  if (['pending', 'under_review'].includes(clean)) {
    return {
      label: 'Requesting Refund',
      color: '#B45309',
      bg: '#FEF3C7',
      border: '1px solid #FCD34D'
    };
  }
  if (clean === 'approved') {
    return {
      label: 'Approved',
      color: '#15803D',
      bg: '#DCFCE7',
      border: '1px solid #86EFAC'
    };
  }
  if (clean === 'processing') {
    return {
      label: 'Processing',
      color: '#2563EB',
      bg: '#EFF6FF',
      border: '1px solid #93C5FD'
    };
  }
  if (['completed', 'refunded'].includes(clean)) {
    return {
      label: 'Completed',
      color: '#047857',
      bg: '#D1FAE5',
      border: '1px solid #6EE7B7'
    };
  }
  if (clean === 'rejected') {
    return {
      label: 'Rejected',
      color: '#DC2626',
      bg: '#FEF2F2',
      border: '1px solid #FCA5A5'
    };
  }
  if (clean === 'cancelled') {
    return {
      label: 'Cancelled',
      color: '#4B5563',
      bg: '#F3F4F6',
      border: '1px solid #D1D5DB'
    };
  }
  if (clean === 'failed') {
    return {
      label: 'Failed',
      color: '#DC2626',
      bg: '#FEF2F2',
      border: '1px solid #FCA5A5'
    };
  }
  return {
    label: formatRefundStatus(clean),
    color: '#334155',
    bg: '#F1F5F9',
    border: '1px solid #E2E8F0'
  };
}


