/**
 * Validate required field
 */
export const required = (value: any): string | undefined => {
  if (value === null || value === undefined || value === '') {
    return 'This field is required';
  }
  return undefined;
};

/**
 * Validate email format
 */
export const email = (value: string): string | undefined => {
  if (!value) return undefined;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) {
    return 'Please enter a valid email address';
  }
  return undefined;
};

/**
 * Validate minimum length
 */
export const minLength = (min: number) => (value: string): string | undefined => {
  if (!value) return undefined;
  
  if (value.length < min) {
    return `Must be at least ${min} characters long`;
  }
  return undefined;
};

/**
 * Validate maximum length
 */
export const maxLength = (max: number) => (value: string): string | undefined => {
  if (!value) return undefined;
  
  if (value.length > max) {
    return `Must be no more than ${max} characters long`;
  }
  return undefined;
};

/**
 * Validate minimum value for numbers
 */
export const minValue = (min: number) => (value: number): string | undefined => {
  if (value === null || value === undefined) return undefined;
  
  if (value < min) {
    return `Must be at least ${min}`;
  }
  return undefined;
};

/**
 * Validate maximum value for numbers
 */
export const maxValue = (max: number) => (value: number): string | undefined => {
  if (value === null || value === undefined) return undefined;
  
  if (value > max) {
    return `Must be no more than ${max}`;
  }
  return undefined;
};

/**
 * Validate pattern (regex)
 */
export const pattern = (regex: RegExp, message: string) => (value: string): string | undefined => {
  if (!value) return undefined;
  
  if (!regex.test(value)) {
    return message;
  }
  return undefined;
};

/**
 * Validate URL format
 */
export const url = (value: string): string | undefined => {
  if (!value) return undefined;
  
  try {
    new URL(value);
    return undefined;
  } catch {
    return 'Please enter a valid URL';
  }
};

/**
 * Validate phone number
 */
export const phone = (value: string): string | undefined => {
  if (!value) return undefined;
  
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  if (!phoneRegex.test(value.replace(/[\s\-\(\)]/g, ''))) {
    return 'Please enter a valid phone number';
  }
  return undefined;
};

/**
 * Validate password strength
 */
export const password = (value: string): string | undefined => {
  if (!value) return undefined;
  
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(value);
  const hasLowerCase = /[a-z]/.test(value);
  const hasNumbers = /\d/.test(value);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);
  
  if (value.length < minLength) {
    return `Password must be at least ${minLength} characters long`;
  }
  
  if (!hasUpperCase) {
    return 'Password must contain at least one uppercase letter';
  }
  
  if (!hasLowerCase) {
    return 'Password must contain at least one lowercase letter';
  }
  
  if (!hasNumbers) {
    return 'Password must contain at least one number';
  }
  
  if (!hasSpecialChar) {
    return 'Password must contain at least one special character';
  }
  
  return undefined;
};

/**
 * Validate password confirmation
 */
export const confirmPassword = (originalPassword: string) => (value: string): string | undefined => {
  if (!value) return undefined;
  
  if (value !== originalPassword) {
    return 'Passwords do not match';
  }
  return undefined;
};

/**
 * Validate numeric input
 */
export const numeric = (value: string): string | undefined => {
  if (!value) return undefined;
  
  const numericRegex = /^[0-9]+(\.[0-9]+)?$/;
  if (!numericRegex.test(value)) {
    return 'Must be a valid number';
  }
  return undefined;
};

/**
 * Validate integer input
 */
export const integer = (value: string): string | undefined => {
  if (!value) return undefined;
  
  const integerRegex = /^[0-9]+$/;
  if (!integerRegex.test(value)) {
    return 'Must be a valid integer';
  }
  return undefined;
};

/**
 * Validate alpha characters only
 */
export const alpha = (value: string): string | undefined => {
  if (!value) return undefined;
  
  const alphaRegex = /^[a-zA-Z]+$/;
  if (!alphaRegex.test(value)) {
    return 'Must contain only letters';
  }
  return undefined;
};

/**
 * Validate alphanumeric characters only
 */
export const alphanumeric = (value: string): string | undefined => {
  if (!value) return undefined;
  
  const alphanumericRegex = /^[a-zA-Z0-9]+$/;
  if (!alphanumericRegex.test(value)) {
    return 'Must contain only letters and numbers';
  }
  return undefined;
};

/**
 * Validate date format
 */
export const date = (value: string): string | undefined => {
  if (!value) return undefined;
  
  const parsedDate = new Date(value);
  if (isNaN(parsedDate.getTime())) {
    return 'Please enter a valid date';
  }
  return undefined;
};

/**
 * Validate future date
 */
export const futureDate = (value: string): string | undefined => {
  if (!value) return undefined;
  
  const inputDate = new Date(value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (inputDate <= today) {
    return 'Date must be in the future';
  }
  return undefined;
};

/**
 * Validate past date
 */
export const pastDate = (value: string): string | undefined => {
  if (!value) return undefined;
  
  const inputDate = new Date(value);
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  
  if (inputDate >= today) {
    return 'Date must be in the past';
  }
  return undefined;
};

/**
 * Validate file size
 */
export const fileSize = (maxSizeInMB: number) => (file: File): string | undefined => {
  if (!file) return undefined;
  
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  if (file.size > maxSizeInBytes) {
    return `File size must be less than ${maxSizeInMB}MB`;
  }
  return undefined;
};

/**
 * Validate file type
 */
export const fileType = (allowedTypes: string[]) => (file: File): string | undefined => {
  if (!file) return undefined;
  
  if (!allowedTypes.includes(file.type)) {
    return `File type must be one of: ${allowedTypes.join(', ')}`;
  }
  return undefined;
};

/**
 * Compose multiple validators
 */
export const compose = (...validators: Array<(value: any) => string | undefined>) => {
  return (value: any): string | undefined => {
    for (const validator of validators) {
      const error = validator(value);
      if (error) return error;
    }
    return undefined;
  };
};

/**
 * Validate form with multiple fields
 */
export const validateForm = <T extends Record<string, any>>(
  values: T,
  validators: Partial<Record<keyof T, (value: any) => string | undefined>>
): Record<keyof T, string | undefined> => {
  const errors = {} as Record<keyof T, string | undefined>;
  
  Object.keys(validators).forEach((key) => {
    const validator = validators[key as keyof T];
    if (validator) {
      errors[key as keyof T] = validator(values[key as keyof T]);
    }
  });
  
  return errors;
};

/**
 * Check if form has any errors
 */
export const hasErrors = (errors: Record<string, string | undefined>): boolean => {
  return Object.values(errors).some(error => error !== undefined);
};
