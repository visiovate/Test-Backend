import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { AppError } from '../middleware/error.middleware';
import { uploadToS3 } from '../middleware/upload.middleware';

const prisma = new PrismaClient();

// Generate JWT token
const generateToken = (payload: any) => {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
};

// Generate refresh token
const generateRefreshToken = (payload: any) => {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  });
};

// Register user
export const registerUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, firstName, lastName, phone, address } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new AppError(409, 'Email already registered');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        ...(address && {
          street: address.street,
          city: address.city,
          state: address.state,
          zipCode: address.zipCode,
          latitude: address.latitude,
          longitude: address.longitude,
        }),
      },
    });

    // Generate tokens
    const token = generateToken({ id: user.id, type: 'user' });
    const refreshToken = generateRefreshToken({ id: user.id, type: 'user' });

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
        },
        token,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Register maid
export const registerMaid = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      hourlyRate,
      services,
      serviceAreas,
      availability,
    } = req.body;

    // Check if maid exists
    const existingMaid = await prisma.maid.findUnique({
      where: { email },
    });

    if (existingMaid) {
      throw new AppError(409, 'Email already registered');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create maid
    const maid = await prisma.maid.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone,
        hourlyRate,
        services,
        serviceAreas,
        availability,
      },
    });

    // Generate tokens
    const token = generateToken({ id: maid.id, type: 'maid' });
    const refreshToken = generateRefreshToken({ id: maid.id, type: 'maid' });

    res.status(201).json({
      success: true,
      data: {
        maid: {
          id: maid.id,
          email: maid.email,
          firstName: maid.firstName,
          lastName: maid.lastName,
          phone: maid.phone,
          hourlyRate: maid.hourlyRate,
          services: maid.services,
          serviceAreas: maid.serviceAreas,
        },
        token,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Login
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, userType } = req.body;

    let user;
    if (userType === 'user') {
      user = await prisma.user.findUnique({
        where: { email },
      });
    } else {
      user = await prisma.maid.findUnique({
        where: { email },
      });
    }

    if (!user) {
      throw new AppError(401, 'Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new AppError(401, 'Invalid credentials');
    }

    // Generate tokens
    const token = generateToken({ id: user.id, type: userType });
    const refreshToken = generateRefreshToken({ id: user.id, type: userType });

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
        },
        token,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Refresh token
export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError(401, 'Refresh token is required');
    }

    const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as {
      id: string;
      type: string;
    };

    // Generate new tokens
    const token = generateToken({ id: decoded.id, type: decoded.type });
    const newRefreshToken = generateRefreshToken({ id: decoded.id, type: decoded.type });

    res.json({
      success: true,
      data: {
        token,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    next(new AppError(401, 'Invalid refresh token'));
  }
};

// Logout
export const logout = async (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
};

// Get profile
export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const userType = req.user?.type;

    let profile;
    if (userType === 'user') {
      profile = await prisma.user.findUnique({
        where: { id: userId },
      });
    } else {
      profile = await prisma.maid.findUnique({
        where: { id: userId },
      });
    }

    if (!profile) {
      throw new AppError(404, 'Profile not found');
    }

    res.json({
      success: true,
      data: {
        profile,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update profile
export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    const userType = req.user?.type;
    const { firstName, lastName, phone, address } = req.body;

    let profile;
    if (userType === 'user') {
      profile = await prisma.user.update({
        where: { id: userId },
        data: {
          firstName,
          lastName,
          phone,
          ...(address && {
            street: address.street,
            city: address.city,
            state: address.state,
            zipCode: address.zipCode,
            latitude: address.latitude,
            longitude: address.longitude,
          }),
        },
      });
    } else {
      profile = await prisma.maid.update({
        where: { id: userId },
        data: {
          firstName,
          lastName,
          phone,
        },
      });
    }

    res.json({
      success: true,
      data: {
        profile,
      },
    });
  } catch (error) {
    next(error);
  }
}; 