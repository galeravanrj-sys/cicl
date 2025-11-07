// Simple helper functions for status handling

/**
 * Check if a status should be considered as "archived"
 * @param {string} status - The case status
 * @returns {boolean} - True if status is archived
 */
export const isArchivedStatus = (status) => {
  const s = String(status || '').toLowerCase();
  return ['archives', 'reintegrate', 'discharge', 'archived', 'after care', 'aftercare'].includes(s);
};

/**
 * Get display text for archived statuses
 * @param {string} status - The case status
 * @returns {string} - Display text
 */
export const getArchivedDisplayText = (status) => {
  const s = String(status || '').toLowerCase();
  if (s === 'after care' || s === 'aftercare') {
    return 'After Care';
  }
  if (['archives', 'reintegrate', 'discharge', 'archived'].includes(s)) {
    return 'Discharged';
  }
  return status;
};

/**
 * Get CSS class for archived statuses
 * @param {string} status - The case status
 * @returns {string} - CSS class name
 */
export const getArchivedStatusClass = (status) => {
  if (isArchivedStatus(status)) {
    return 'archived';
  }
  return status;
};