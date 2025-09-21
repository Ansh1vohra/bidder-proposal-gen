import { format, formatDistanceToNow, parseISO, isValid } from 'date-fns';

/**
 * Format date to readable string
 */
export const formatDate = (date: string | Date, formatString: string = 'MMM dd, yyyy'): string => {
  try {
    const parsedDate = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(parsedDate)) {
      return 'Invalid date';
    }
    return format(parsedDate, formatString);
  } catch (error) {
    return 'Invalid date';
  }
};

/**
 * Format date and time to readable string
 */
export const formatDateTime = (date: string | Date): string => {
  return formatDate(date, 'MMM dd, yyyy HH:mm');
};

/**
 * Format date to relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (date: string | Date): string => {
  try {
    const parsedDate = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(parsedDate)) {
      return 'Invalid date';
    }
    return formatDistanceToNow(parsedDate, { addSuffix: true });
  } catch (error) {
    return 'Invalid date';
  }
};

/**
 * Check if a date is in the past
 */
export const isPastDate = (date: string | Date): boolean => {
  try {
    const parsedDate = typeof date === 'string' ? parseISO(date) : date;
    return isValid(parsedDate) && parsedDate < new Date();
  } catch (error) {
    return false;
  }
};

/**
 * Check if a date is in the future
 */
export const isFutureDate = (date: string | Date): boolean => {
  try {
    const parsedDate = typeof date === 'string' ? parseISO(date) : date;
    return isValid(parsedDate) && parsedDate > new Date();
  } catch (error) {
    return false;
  }
};

/**
 * Get days remaining until a date
 */
export const getDaysRemaining = (date: string | Date): number => {
  try {
    const parsedDate = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(parsedDate)) {
      return 0;
    }
    const now = new Date();
    const diffTime = parsedDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  } catch (error) {
    return 0;
  }
};

/**
 * Format deadline status with color coding
 */
export const getDeadlineStatus = (deadline: string | Date): {
  status: 'expired' | 'urgent' | 'soon' | 'normal';
  text: string;
  color: 'error' | 'warning' | 'info' | 'success';
} => {
  const daysRemaining = getDaysRemaining(deadline);
  
  if (daysRemaining === 0) {
    return {
      status: 'expired',
      text: 'Expired',
      color: 'error',
    };
  } else if (daysRemaining <= 1) {
    return {
      status: 'urgent',
      text: `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} left`,
      color: 'error',
    };
  } else if (daysRemaining <= 7) {
    return {
      status: 'soon',
      text: `${daysRemaining} days left`,
      color: 'warning',
    };
  } else {
    return {
      status: 'normal',
      text: `${daysRemaining} days left`,
      color: 'info',
    };
  }
};
