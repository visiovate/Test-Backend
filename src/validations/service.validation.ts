import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

// Price schema for different property sizes
const priceSchema = z.record(z.string(), z.number().positive('Price must be a positive number'));

// Create service schema
export const createServiceSchema = z.object({
  name: z.string().min(1, 'Service name is required'),
  description: z.string().optional(),
  price: priceSchema,
  isActive: z.boolean().optional().default(true),
});

// Update service schema
export const updateServiceSchema = z.object({
  id: z.string().uuid('Invalid service ID'),
  name: z.string().min(1, 'Service name is required').optional(),
  description: z.string().optional(),
  price: priceSchema.optional(),
  isActive: z.boolean().optional(),
});

// Get service schema
export const getServiceSchema = z.object({
  id: z.string().uuid('Invalid service ID'),
});

// List services schema
export const listServicesSchema = z.object({
  isActive: z.boolean().optional(),
  search: z.string().optional(),
  propertySize: z.string().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

// ServicePrice schema
export const servicePriceSchema = z.object({
  propertyType: z.string().min(1, 'Property type is required'),
  price: z.number().positive('Price must be a positive number'),
});

// Type exports
export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
export type GetServiceInput = z.infer<typeof getServiceSchema>;
export type ListServicesInput = z.infer<typeof listServicesSchema>;

// Express middleware for service validation
export const validateService = (req: Request, res: Response, next: NextFunction) => {
  try {
    createServiceSchema.parse(req.body);
    next();
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ error: err.errors });
    }
    return res.status(400).json({ error: 'Invalid request' });
  }
};

// Express middleware for service price validation
export const validateServicePrice = (req: Request, res: Response, next: NextFunction) => {
  try {
    servicePriceSchema.parse(req.body);
    next();
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ error: err.errors });
    }
    return res.status(400).json({ error: 'Invalid request' });
  }
}; 