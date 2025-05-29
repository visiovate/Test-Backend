import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { AppError } from './error.middleware';

export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const extractedErrors = errors.array().map(err => ({
      field: err.path,
      message: err.msg,
    }));

    throw new AppError(400, 'Validation failed', false, extractedErrors);
  };
};

// Common validation rules
export const commonValidations = {
  email: {
    isEmail: true,
    normalizeEmail: true,
  },
  password: {
    isLength: {
      options: { min: 8 },
      errorMessage: 'Password must be at least 8 characters long',
    },
    matches: {
      options: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      errorMessage: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    },
  },
  phone: {
    matches: {
      options: /^\+?[1-9]\d{1,14}$/,
      errorMessage: 'Invalid phone number format',
    },
  },
  name: {
    isLength: {
      options: { min: 2, max: 50 },
      errorMessage: 'Name must be between 2 and 50 characters',
    },
    matches: {
      options: /^[a-zA-Z\s-']+$/,
      errorMessage: 'Name can only contain letters, spaces, hyphens, and apostrophes',
    },
  },
  address: {
    street: {
      isLength: {
        options: { min: 5, max: 100 },
        errorMessage: 'Street address must be between 5 and 100 characters',
      },
    },
    city: {
      isLength: {
        options: { min: 2, max: 50 },
        errorMessage: 'City must be between 2 and 50 characters',
      },
    },
    state: {
      isLength: {
        options: { min: 2, max: 2 },
        errorMessage: 'State must be a 2-letter code',
      },
    },
    zipCode: {
      matches: {
        options: /^\d{5}(-\d{4})?$/,
        errorMessage: 'Invalid ZIP code format',
      },
    },
  },
  coordinates: {
    latitude: {
      isFloat: {
        options: { min: -90, max: 90 },
        errorMessage: 'Latitude must be between -90 and 90',
      },
    },
    longitude: {
      isFloat: {
        options: { min: -180, max: 180 },
        errorMessage: 'Longitude must be between -180 and 180',
      },
    },
  },
}; 