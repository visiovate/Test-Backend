import express from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { ServiceController } from '../controllers/service.controller';
import {
  createServiceSchema,
  updateServiceSchema,
  getServiceSchema,
  listServicesSchema,
  validateService,
  validateServicePrice
} from '../validations/service.validation';

const router = express.Router();
const serviceController = new ServiceController();

// Apply authentication middleware to all routes
router.use(authenticate);

// Create service (admin only)
router.post(
  '/',
  // validate(createServiceSchema),
  serviceController.createService
);

// Update service (admin only)
router.put(
  '/:id',
  validate(updateServiceSchema),
  serviceController.updateService
);

// Get service details
router.get(
  '/:id',
  validate(getServiceSchema),
  serviceController.getServiceById
);

// List all services
router.get(
  '/',
  validate(listServicesSchema),
  serviceController.getAllServices
);

// Service price routes
router.post('/:id/prices', validateServicePrice, serviceController.addServicePrice);
router.get('/:id/prices', serviceController.getServicePrices);
router.put('/:id/prices/:priceId', validateServicePrice, serviceController.updateServicePrice);
router.delete('/:id/prices/:priceId', serviceController.deleteServicePrice);

export default router; 