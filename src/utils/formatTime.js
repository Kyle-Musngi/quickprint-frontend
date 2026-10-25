/**
 * Reusable time formatting utilities for Univ Quick Print
 */

export function formatTime12Hour(time) {
  if (!time) return '';

  // If time already contains AM or PM, return as is
  if (typeof time === 'string' && (time.includes('AM') || time.includes('PM'))) {
    return time.trim();
  }

  const parts = String(time).split(':');
  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);

  if (
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return String(time);
  }

  const period = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;

  return `${hour12}:${String(minutes).padStart(2, '0')} ${period}`;
}

export function formatTimeRange(openingTime, closingTime, operatingDays = '') {
  if (!openingTime && !closingTime) return operatingDays || '';
  const openFormatted = formatTime12Hour(openingTime);
  const closeFormatted = formatTime12Hour(closingTime);
  const range = `${openFormatted} - ${closeFormatted}`;
  return operatingDays ? `${range} (${operatingDays})` : range;
}

/**
 * Converts 12-hour string (e.g., "7:30 AM" or "12:00 PM") to 24-hour HH:MM format
 */
export function formatTimeTo24Hour(time12) {
  if (!time12) return '08:00';
  const trimmed = String(time12).trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return time12;

  let hours = parseInt(match[1], 10);
  const minutes = match[2];
  const period = match[3] ? match[3].toUpperCase() : null;

  if (period === 'PM' && hours < 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;

  return `${String(hours).padStart(2, '0')}:${minutes}`;
}
