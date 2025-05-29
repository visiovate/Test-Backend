import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SearchFilters {
  location?: {
    latitude: number;
    longitude: number;
    radius?: number; // in kilometers
  };
  services?: string[];
  languages?: string[];
  minRating?: number;
  maxPrice?: number;
  minPrice?: number;
  availability?: {
    date: Date;
    time: string;
  };
  isVerified?: boolean;
}

export class SearchService {
  async searchMaids(filters: SearchFilters, page: number = 1, limit: number = 10) {
    try {
      const skip = (page - 1) * limit;

      // Base query
      const where: any = {
        isActive: true,
      };

      // Apply filters
      if (filters.isVerified !== undefined) {
        where.isVerified = filters.isVerified;
      }

      if (filters.minRating) {
        where.ratingAvg = {
          gte: filters.minRating,
        };
      }

      if (filters.minPrice || filters.maxPrice) {
        where.hourlyRate = {};
        if (filters.minPrice) {
          where.hourlyRate.gte = filters.minPrice;
        }
        if (filters.maxPrice) {
          where.hourlyRate.lte = filters.maxPrice;
        }
      }

      if (filters.services && filters.services.length > 0) {
        where.services = {
          hasSome: filters.services,
        };
      }

      if (filters.languages && filters.languages.length > 0) {
        where.languages = {
          hasSome: filters.languages,
        };
      }

      // Get maids with basic filtering
      const maids = await prisma.maid.findMany({
        where,
        skip,
        take: limit,
        include: {
          reviews: {
            select: {
              rating: true,
            },
          },
        },
        orderBy: {
          ratingAvg: 'desc',
        },
      });

      // Apply location-based filtering if provided
      let filteredMaids = maids;
      if (filters.location) {
        filteredMaids = maids.filter(maid => {
          if (!maid.serviceAreas || !filters.location) return false;
          
          // Check if maid serves the requested area
          return maid.serviceAreas.some(area => {
            // Here you would implement proper geolocation checking
            // For MVP, we'll do a simple string match
            return area.toLowerCase().includes(
              `${filters.location.latitude},${filters.location.longitude}`
            );
          });
        });
      }

      // Apply availability filtering if provided
      if (filters.availability) {
        filteredMaids = filteredMaids.filter(maid => {
          if (!maid.availability) return false;

          const availability = maid.availability as any;
          const dayOfWeek = filters.availability.date.getDay();
          const timeSlot = filters.availability.time;

          return availability[dayOfWeek]?.includes(timeSlot);
        });
      }

      // Get total count for pagination
      const total = await prisma.maid.count({ where });

      return {
        maids: filteredMaids,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw new Error(`Search failed: ${error.message}`);
    }
  }

  async getPopularServices() {
    try {
      const maids = await prisma.maid.findMany({
        select: {
          services: true,
        },
      });

      // Count service occurrences
      const serviceCounts = maids.reduce((acc: { [key: string]: number }, maid) => {
        maid.services.forEach(service => {
          acc[service] = (acc[service] || 0) + 1;
        });
        return acc;
      }, {});

      // Sort by popularity
      return Object.entries(serviceCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([service]) => service);
    } catch (error) {
      throw new Error(`Failed to get popular services: ${error.message}`);
    }
  }

  async getPopularLocations() {
    try {
      const maids = await prisma.maid.findMany({
        select: {
          serviceAreas: true,
        },
      });

      // Count location occurrences
      const locationCounts = maids.reduce((acc: { [key: string]: number }, maid) => {
        maid.serviceAreas.forEach(location => {
          acc[location] = (acc[location] || 0) + 1;
        });
        return acc;
      }, {});

      // Sort by popularity
      return Object.entries(locationCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([location]) => location);
    } catch (error) {
      throw new Error(`Failed to get popular locations: ${error.message}`);
    }
  }
} 