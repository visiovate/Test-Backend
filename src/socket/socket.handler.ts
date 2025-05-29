import { Server } from 'socket.io';
import { createClient } from 'redis';
import { createAdapter } from '@socket.io/redis-adapter';
import { logger } from '../utils/logger';

let io: Server;

export const initializeSocket = (server: any) => {
  io = new Server(server, {
    cors: {
      origin: process.env.SOCKET_CORS_ORIGIN || '*',
      methods: ['GET', 'POST'],
    },
  });

  // Redis adapter for scaling
  const pubClient = createClient({ url: process.env.REDIS_URL });
  const subClient = pubClient.duplicate();

  Promise.all([pubClient.connect(), subClient.connect()])
    .then(() => {
      io.adapter(createAdapter(pubClient, subClient));
      logger.info('Socket.IO Redis adapter initialized');
    })
    .catch((err) => {
      logger.error('Failed to initialize Socket.IO Redis adapter:', err);
    });

  io.on('connection', (socket) => {
    logger.info(`Client connected: ${socket.id}`);

    // Join user's room
    socket.on('join', (userId: string, userType: string) => {
      const room = `${userType.toLowerCase()}:${userId}`;
      socket.join(room);
      logger.info(`Client ${socket.id} joined room: ${room}`);
    });

    socket.on('disconnect', () => {
      logger.info(`Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export { io }; 