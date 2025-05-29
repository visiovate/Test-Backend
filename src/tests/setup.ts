import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create a new Prisma Client instance for testing
const prisma = new PrismaClient();

// Global setup
beforeAll(async () => {
  // Add any global setup here
  // For example, you might want to ensure the database is in a clean state
  await prisma.$connect();
});

// Global teardown
afterAll(async () => {
  // Add any global cleanup here
  await prisma.$disconnect();
});

// Make prisma available globally for tests
(global as any).prisma = prisma; 