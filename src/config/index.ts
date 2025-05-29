import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config();

// Environment variables schema
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3000'),
  API_PREFIX: z.string().default('/api/v1'),
  
  DATABASE_URL: z.string(),
  
  JWT_SECRET: z.string(),
  JWT_EXPIRES_IN: z.string(),
  JWT_REFRESH_SECRET: z.string(),
  JWT_REFRESH_EXPIRES_IN: z.string(),
  
  REDIS_URL: z.string().default('redis://localhost:6379'),
  
  AWS_ACCESS_KEY_ID: z.string(),
  AWS_SECRET_ACCESS_KEY: z.string(),
  AWS_REGION: z.string(),
  AWS_S3_BUCKET: z.string(),
  
  SMTP_HOST: z.string(),
  SMTP_PORT: z.string().transform(Number),
  SMTP_USER: z.string(),
  SMTP_PASS: z.string(),
  EMAIL_FROM: z.string(),
  
  SOCKET_CORS_ORIGIN: z.string(),
  
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'),
  RATE_LIMIT_MAX: z.string().transform(Number).default('100'),

  STRIPE_SECRET_KEY: z.string(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
});

// Parse and validate environment variables
const env = envSchema.parse(process.env);

// Export configuration
export const config = {
  env: env.NODE_ENV,
  port: env.PORT,
  apiPrefix: env.API_PREFIX,
  
  database: {
    url: env.DATABASE_URL,
  },
  
  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
    refreshSecret: env.JWT_REFRESH_SECRET,
    refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
  },
  
  redis: {
    url: env.REDIS_URL,
  },
  
  aws: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    region: env.AWS_REGION,
    s3Bucket: env.AWS_S3_BUCKET,
  },
  
  email: {
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
    from: env.EMAIL_FROM,
  },
  
  socket: {
    corsOrigin: env.SOCKET_CORS_ORIGIN,
  },
  
  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
  },

  stripe: {
    secretKey: env.STRIPE_SECRET_KEY,
    webhookSecret: env.STRIPE_WEBHOOK_SECRET,
  },
} as const; 