import { Request, Response } from 'express';
import { SearchService } from '../services/search.service';

const searchService = new SearchService();

export class SearchController {
  async searchMaids(req: Request, res: Response) {
    try {
      const {
        location,
        services,
        languages,
        minRating,
        maxPrice,
        minPrice,
        availability,
        isVerified,
        page = 1,
        limit = 10,
      } = req.query;

      const filters = {
        location: location ? JSON.parse(location as string) : undefined,
        services: services ? (services as string).split(',') : undefined,
        languages: languages ? (languages as string).split(',') : undefined,
        minRating: minRating ? Number(minRating) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        minPrice: minPrice ? Number(minPrice) : undefined,
        availability: availability ? JSON.parse(availability as string) : undefined,
        isVerified: isVerified ? isVerified === 'true' : undefined,
      };

      const result = await searchService.searchMaids(
        filters,
        Number(page),
        Number(limit)
      );

      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getPopularServices(req: Request, res: Response) {
    try {
      const services = await searchService.getPopularServices();
      res.json(services);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getPopularLocations(req: Request, res: Response) {
    try {
      const locations = await searchService.getPopularLocations();
      res.json(locations);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
} 