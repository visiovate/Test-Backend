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
  console.log('=== Registration Process Started ===');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  
  try {
    const { email, password, firstName, lastName, phone, address } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !lastName || !phone) {
      console.log('Missing required fields:', { email: !!email, password: !!password, firstName: !!firstName, lastName: !!lastName, phone: !!phone });
      throw new AppError(400, 'Missing required fields');
    }

    // Check if user exists
    console.log('Checking for existing user with email:', email);
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log('User already exists with email:', email);
      throw new AppError(409, 'Email already registered');
    }

    // Hash password
    console.log('Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 12);
    console.log('Password hashed successfully');

    // Create user
    console.log('Creating new user...');
    const userData = {
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
    };
    console.log('User data prepared:', { ...userData, password: '[REDACTED]' });

    const user = await prisma.user.create({
      data: userData,
    });

    console.log('User created successfully:', { userId: user.id });

    // Generate tokens
    console.log('Generating tokens...');
    const token = generateToken({ id: user.id, type: 'user' });
    const refreshToken = generateRefreshToken({ id: user.id, type: 'user' });
    console.log('Tokens generated successfully');

    console.log('=== Registration Process Completed Successfully ===');
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
    console.error('=== Registration Process Failed ===');
    console.error('Error details:', error);
    
    if (error instanceof AppError) {
      console.error('AppError:', {
        statusCode: error.statusCode,
        message: error.message,
        errors: error.errors
      });
      next(error);
    } else {
      console.error('Unknown error:', error);
      next(new AppError(500, 'Registration failed', false, error));
    }
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
    console.log('Getting profile for user:', req.user);
    
    if (!req.user) {
      throw new AppError(401, 'Authentication required');
    }

    const userId = req.user.id;
    const userType = req.user.type;

    let profile;
    if (userType === 'user') {
      profile = await prisma.user.findUnique({
        where: { id: userId },
      });
    } else if (userType === 'maid') {
      profile = await prisma.maid.findUnique({
        where: { id: userId },
      });
    }

    if (!profile) {
      throw new AppError(404, 'Profile not found');
    }

    // Remove sensitive information
    const { password, ...profileWithoutPassword } = profile;

    res.json({
      success: true,
      data: {
        profile: profileWithoutPassword,
        type: userType
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
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