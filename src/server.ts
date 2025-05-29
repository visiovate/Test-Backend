import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';
import { config } from './config';
import { errorHandler } from './middleware/error.middleware';
import { setupRoutes } from './routes';
import { initializeSocket } from './socket/socket.handler';
import { logger } from './utils/logger';

const app = express();
const httpServer = createServer(app);

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use(config.apiPrefix, setupRoutes());

// Error handling
app.use(errorHandler);

// Socket.IO setup
const io = initializeSocket(httpServer);

// Redis adapter for Socket.IO
const pubClient = new Redis(config.redis.url);
const subClient = pubClient.duplicate();

Promise.all([pubClient, subClient]).then(() => {
  io.adapter(createAdapter(pubClient, subClient));
});

// Start server
const PORT = config.port;
httpServer.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
}); 