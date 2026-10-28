/**
 * Safely formats amounts into Philippine Pesos (₱).
 *
 * Rules:
 * - If value is a valid number or numeric string (including 0): outputs "₱X.XX".
 * - Never returns "₱NaN", "₱Infinity", or "-₱Infinity".
 * - If value is null, undefined, empty, or unparseable: returns fallback (default: 'Amount unavailable').
 * - Preserves legitimate 0 as "₱0.00".
 */
export function formatCurrency(amount, fallback = 'Amount unavailable') {
  if (amount === null || amount === undefined || amount === '') {
    return fallback;
  }
  const cleanStr = String(amount).trim();
  if (cleanStr === '') {
    return fallback;
  }
  const num = typeof amount === 'number' ? amount : parseFloat(cleanStr);
  if (isNaN(num) || !isFinite(num)) {
    return fallback;
  }
  return `₱${num.toFixed(2)}`;
}

/**
 * Extracts a valid numeric float from any amount field, or returns null if missing/invalid.
 */
export function parseAmount(amount) {
  if (amount === null || amount === undefined || amount === '') {
    return null;
  }
  const num = typeof amount === 'number' ? amount : parseFloat(String(amount).trim());
  if (isNaN(num) || !isFinite(num)) {
    return null;
  }
  return num;
}
