import { Request, Response, NextFunction } from "express";
import passport from "passport";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import { Strategy as LocalStrategy } from "passport-local";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { config } from "../config";
import { AppError } from "./error.middleware";

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
        console.log("JWT Payload:", payload);

        let user;
        if (payload.type === "user") {
          user = await prisma.user.findUnique({
            where: { id: payload.id },
          });
        } else if (payload.type === "maid") {
          user = await prisma.maid.findUnique({
            where: { id: payload.id },
          });
        }

        if (!user) {
          console.log("User not found for payload:", payload);
          return done(null, false);
        }

        // Add type to user object
        const userWithType = {
          ...user,
          type: payload.type,
        };

        console.log("Authenticated user:", userWithType);
        return done(null, userWithType);
      } catch (error) {
        console.error("JWT Strategy error:", error);
        return done(error, false);
      }
    }
  )
);

// Local Strategy for User
passport.use(
  "user-local",
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    async (email, password, done) => {
      try {
        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          return done(null, false, { message: "Invalid credentials" });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
          return done(null, false, { message: "Invalid credentials" });
        }

        // Add type to user object
        const userWithType = {
          ...user,
          type: "user",
        };

        return done(null, userWithType);
      } catch (error) {
        return done(error);
      }
    }
  )
);

// Local Strategy for Maid
passport.use(
  "maid-local",
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    async (email, password, done) => {
      try {
        const maid = await prisma.maid.findUnique({
          where: { email },
        });

        if (!maid) {
          return done(null, false, { message: "Invalid credentials" });
        }

        const isPasswordValid = await bcrypt.compare(password, maid.password);

        if (!isPasswordValid) {
          return done(null, false, { message: "Invalid credentials" });
        }

        // Add type to maid object
        const maidWithType = {
          ...maid,
          type: "maid",
        };

        return done(null, maidWithType);
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
        console.error("Authentication error:", err);
        return next(err);
      }

      if (!user) {
        console.error("Authentication failed:", info);
        return next(
          new AppError(401, info?.message || "Authentication failed")
        );
      }

      console.log("Setting user in request:", user);
      req.user = user;
      next();
    })(req, res, next);
  };
};

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(401, "Authentication required"));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError(403, "Insufficient permissions"));
    }

    next();
  };
};
