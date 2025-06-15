import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';

const prisma = new PrismaClient();

export class ServiceController {
  async createService(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, description, isActive } = req.body;
      // Check if service already exists
      const existingService = await prisma.service.findUnique({ where: { name } });
      if (existingService) {
        throw new AppError(409, 'Service with this name already exists');
      }
      const service = await prisma.service.create({ data: { name, description, isActive } });
      res.status(201).json({ success: true, data: service });
    } catch (error) {
      next(error);
    }
  }

  async updateService(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { name, description, isActive } = req.body;
      const existingService = await prisma.service.findUnique({ where: { id } });
      if (!existingService) {
        throw new AppError(404, 'Service not found');
      }
      if (name && name !== existingService.name) {
        const nameConflict = await prisma.service.findUnique({ where: { name } });
        if (nameConflict) {
          throw new AppError(409, 'Service with this name already exists');
        }
      }
      const service = await prisma.service.update({ where: { id }, data: { name, description, isActive } });
      res.json({ success: true, data: service });
    } catch (error) {
      next(error);
    }
  }

  async getServiceById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const service = await prisma.service.findUnique({ where: { id }, include: { prices: true } });
      if (!service) {
        throw new AppError(404, 'Service not found');
      }
      res.json({ success: true, data: service });
    } catch (error) {
      next(error);
    }
  }

  async getAllServices(req: Request, res: Response, next: NextFunction) {
    try {
      const services = await prisma.service.findMany();
      res.json({ success: true, data: services });
    } catch (error) {
      next(error);
    }
  }

  async deleteService(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await prisma.service.delete({ where: { id } });
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async addServicePrice(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { propertyType, price } = req.body;
      const servicePrice = await prisma.servicePrice.create({
        data: { serviceId: id, propertyType, price },
      });
      res.status(201).json({ success: true, data: servicePrice });
    } catch (error) {
      next(error);
    }
  }

  async getServicePrices(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const prices = await prisma.servicePrice.findMany({ where: { serviceId: id } });
      res.json({ success: true, data: prices });
    } catch (error) {
      next(error);
    }
  }

  async updateServicePrice(req: Request, res: Response, next: NextFunction) {
    try {
      const { priceId } = req.params;
      const { propertyType, price } = req.body;
      const servicePrice = await prisma.servicePrice.update({
        where: { id: priceId },
        data: { propertyType, price },
      });
      res.json({ success: true, data: servicePrice });
    } catch (error) {
      next(error);
    }
  }

  async deleteServicePrice(req: Request, res: Response, next: NextFunction) {
    try {
      const { priceId } = req.params;
      await prisma.servicePrice.delete({ where: { id: priceId } });
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
} 