export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  field?: string;
}

/**
 * Handle API errors and extract meaningful error messages
 */
export const handleApiError = (error: any): ApiError => {
  // Network error
  if (!error.response) {
    return {
      message: 'Network error. Please check your connection and try again.',
      status: 0,
      code: 'NETWORK_ERROR'
    };
  }

  const { status, data } = error.response;

  // Server error
  if (status >= 500) {
    return {
      message: 'Server error. Please try again later.',
      status,
      code: 'SERVER_ERROR'
    };
  }

  // Client error
  if (status >= 400) {
    let message = 'An error occurred. Please try again.';
    let field: string | undefined;

    if (data?.message) {
      message = data.message;
    } else if (data?.error) {
      message = data.error;
    } else if (data?.errors) {
      // Handle validation errors
      if (Array.isArray(data.errors)) {
        message = data.errors[0]?.message || data.errors[0] || message;
        field = data.errors[0]?.field;
      } else if (typeof data.errors === 'object') {
        const firstError = Object.values(data.errors)[0];
        message = Array.isArray(firstError) ? firstError[0] : String(firstError);
        field = Object.keys(data.errors)[0];
      }
    }

    return {
      message,
      status,
      code: data?.code || 'CLIENT_ERROR',
      field
    };
  }

  return {
    message: 'An unexpected error occurred.',
    status,
    code: 'UNKNOWN_ERROR'
  };
};

/**
 * Get user-friendly error message for specific error codes
 */
export const getErrorMessage = (error: ApiError): string => {
  const { code, message } = error;

  switch (code) {
    case 'NETWORK_ERROR':
      return 'Unable to connect to the server. Please check your internet connection.';
    
    case 'SERVER_ERROR':
      return 'Something went wrong on our end. Please try again later.';
    
    case 'UNAUTHORIZED':
      return 'You are not authorized to perform this action. Please log in again.';
    
    case 'FORBIDDEN':
      return 'You do not have permission to access this resource.';
    
    case 'NOT_FOUND':
      return 'The requested resource was not found.';
    
    case 'VALIDATION_ERROR':
      return message || 'Please check your input and try again.';
    
    case 'DUPLICATE_EMAIL':
      return 'An account with this email already exists.';
    
    case 'INVALID_CREDENTIALS':
      return 'Invalid email or password. Please try again.';
    
    case 'TOKEN_EXPIRED':
      return 'Your session has expired. Please log in again.';
    
    case 'PAYMENT_FAILED':
      return 'Payment failed. Please check your payment method and try again.';
    
    case 'SUBSCRIPTION_INACTIVE':
      return 'Your subscription is inactive. Please update your payment method.';
    
    case 'RATE_LIMIT_EXCEEDED':
      return 'Too many requests. Please wait a moment and try again.';
    
    default:
      return message || 'An unexpected error occurred. Please try again.';
  }
};

/**
 * Check if error is a network error
 */
export const isNetworkError = (error: ApiError): boolean => {
  return error.code === 'NETWORK_ERROR' || error.status === 0;
};

/**
 * Check if error is an authentication error
 */
export const isAuthError = (error: ApiError): boolean => {
  return ['UNAUTHORIZED', 'TOKEN_EXPIRED', 'INVALID_CREDENTIALS'].includes(error.code || '');
};

/**
 * Check if error is a validation error
 */
export const isValidationError = (error: ApiError): boolean => {
  return error.code === 'VALIDATION_ERROR' || error.status === 400;
};

/**
 * Check if error is a server error
 */
export const isServerError = (error: ApiError): boolean => {
  return error.code === 'SERVER_ERROR' || (error.status || 0) >= 500;
};

/**
 * Retry logic for failed API calls
 */
export const withRetry = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const apiError = handleApiError(error);

      // Don't retry for client errors (except network errors)
      if (apiError.status && apiError.status >= 400 && apiError.status < 500 && !isNetworkError(apiError)) {
        throw error;
      }

      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Wait before retrying with exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt - 1)));
    }
  }

  throw lastError;
};

/**
 * Debounce function to limit API calls
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * Throttle function to limit API calls
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Cache API responses
 */
export class ApiCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

  set(key: string, data: any, ttl: number = 300000): void { // 5 minutes default
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }

    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    
    if (isExpired) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }
}

/**
 * Create a global cache instance
 */
export const apiCache = new ApiCache();
