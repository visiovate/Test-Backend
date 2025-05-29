import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { Strategy as LocalStrategy } from 'passport-local';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { config } from '../config';
import { AppError } from './error.middleware';

const prisma = new PrismaClient();

// JWT Strategy
passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.jwt.secret,
    },
    async (payload, done) => {
      try {
        const user = await prisma.user.findUnique({
          where: { id: payload.id },
        });

        if (!user) {
          return done(null, false);
        }

        return done(null, user);
      } catch (error) {
        return done(error, false);
      }
    }
  )
);

// Local Strategy for User
passport.use(
  'user-local',
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
    },
    async (email, password, done) => {
      try {
        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          return done(null, false, { message: 'Invalid credentials' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
          return done(null, false, { message: 'Invalid credentials' });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  )
);

// Local Strategy for Maid
passport.use(
  'maid-local',
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
    },
    async (email, password, done) => {
      try {
        const maid = await prisma.maid.findUnique({
          where: { email },
        });

        if (!maid) {
          return done(null, false, { message: 'Invalid credentials' });
        }

        const isPasswordValid = await bcrypt.compare(password, maid.password);

        if (!isPasswordValid) {
          return done(null, false, { message: 'Invalid credentials' });
        }

        return done(null, maid);
      } catch (error) {
        return done(error);
      }
    }
  )
);

export const authenticate = (strategy: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate(strategy, { session: false }, (err, user, info) => {
      if (err) {
        return next(err);
      }

      if (!user) {
        return next(new AppError(401, info?.message || 'Authentication failed'));
      }

      req.user = user;
      next();
    })(req, res, next);
  };
};

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(401, 'Authentication required'));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError(403, 'Insufficient permissions'));
    }

    next();
  };
}; 