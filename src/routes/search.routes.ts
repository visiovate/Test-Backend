import { Router } from 'express';
import { SearchController } from '../controllers/search.controller';

const router = Router();
const searchController = new SearchController();

// Search maids with filters
router.get('/maids', searchController.searchMaids);

// Get popular services
router.get('/services/popular', searchController.getPopularServices);

// Get popular locations
router.get('/locations/popular', searchController.getPopularLocations);

export default router; 