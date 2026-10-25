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
  if (clean === 'failed') return 'Failed';
  if (clean === 'refunded') return 'Refunded';
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}
