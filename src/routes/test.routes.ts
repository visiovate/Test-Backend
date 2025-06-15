import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Basic test endpoint
router.get('/ping', (req, res) => {
  res.json({
    message: 'pong',
    timestamp: new Date().toISOString(),
    status: 'success'
  });
});

// Detailed database connection test
router.get('/db-test', async (req, res) => {
  try {
    console.log('Testing database connection...');
    console.log('Database URL:', process.env.DATABASE_URL);
    
    // Test database connection
    await prisma.$connect();
    console.log('Database connection successful');
    
    // Try a simple query
    const result = await prisma.$queryRaw`SELECT 1`;
    console.log('Query test result:', result);
    
    res.json({
      message: 'Database connection successful',
      status: 'success',
      details: {
        connection: 'OK',
        query: 'OK',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({
      message: 'Database connection failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      status: 'error',
      details: {
        connection: 'FAILED',
        timestamp: new Date().toISOString()
      }
    });
  } finally {
    await prisma.$disconnect();
  }
});

// Environment variables test
router.get('/env-test', (req, res) => {
  res.json({
    nodeEnv: process.env.NODE_ENV,
    port: process.env.PORT,
    databaseUrl: process.env.DATABASE_URL ? 'Set (hidden for security)' : 'Not set',
    apiPrefix: process.env.API_PREFIX,
    status: 'success'
  });
});

// Request info test
router.get('/request-info', (req, res) => {
  res.json({
    headers: req.headers,
    method: req.method,
    url: req.url,
    query: req.query,
    ip: req.ip,
    status: 'success'
  });
});

// Error handling test
router.get('/error-test', (req, res, next) => {
  try {
    throw new Error('This is a test error');
  } catch (error) {
    next(error);
  }
});

export default router; 