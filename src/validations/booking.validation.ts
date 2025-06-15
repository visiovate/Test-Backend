import { z } from 'zod';

// Common validation schemas
const timeSchema = z.string().regex(
  /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
  'Time must be in HH:MM format (24-hour)'
);

const addressSchema = z.object({
  address: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zipCode: z.string().min(1, 'ZIP code is required'),
});

// Create booking schema
export const createBookingSchema = z.object({
  maidId: z.string().uuid('Invalid maid ID'),
  scheduledDate: z.string().datetime('Invalid date format'),
  scheduledTime: timeSchema,
  duration: z.number().int().min(1, 'Duration must be at least 1 hour'),
  services: z.array(z.string()).min(1, 'At least one service must be selected'),
  ...addressSchema.shape,
  notes: z.string().optional(),
});

// Get booking details schema
export const getBookingDetailsSchema = z.object({
  id: z.string().uuid('Invalid booking ID'),
});

// Cancel booking schema
export const cancelBookingSchema = z.object({
  id: z.string().uuid('Invalid booking ID'),
  reason: z.string().min(1, 'Cancellation reason is required'),
});

// Get chat messages schema
export const getChatMessagesSchema = z.object({
  id: z.string().uuid('Invalid booking ID'),
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

// Send chat message schema
export const sendChatMessageSchema = z.object({
  id: z.string().uuid('Invalid booking ID'),
  message: z.string().min(1, 'Message cannot be empty'),
});

// Get booking history schema
export const getBookingHistorySchema = z.object({
  status: z.enum(['PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED', 'CANCELLED']).optional(),
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

// Type exports
export type CreateBookingInput = z.infer<typeof createBookingSchema>;
export type GetBookingDetailsInput = z.infer<typeof getBookingDetailsSchema>;
export type CancelBookingInput = z.infer<typeof cancelBookingSchema>;
export type GetChatMessagesInput = z.infer<typeof getChatMessagesSchema>;
export type SendChatMessageInput = z.infer<typeof sendChatMessageSchema>;
export type GetBookingHistoryInput = z.infer<typeof getBookingHistorySchema>; 