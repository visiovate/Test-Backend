import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/error.middleware';
import { uploadToS3, deleteFromS3 } from '../middleware/upload.middleware';

const prisma = new PrismaClient();

// Get maid profile
export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const maidId = req.user?.id;

    const maid = await prisma.maid.findUnique({
      where: { id: maidId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        profileImage: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        hourlyRate: true,
        services: true,
        availability: true,
        ratingAvg: true,
        ratingCount: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!maid) {
      throw new AppError(404, 'Maid profile not found');
    }

    res.json({
      success: true,
      data: {
        maid,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update maid profile
export const updateProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const maidId = req.user?.id;
    const updateData = req.body;

    const maid = await prisma.maid.update({
      where: { id: maidId },
      data: updateData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        profileImage: true,
        address: true,
        city: true,
        state: true,
        zipCode: true,
        hourlyRate: true,
        services: true,
        availability: true,
        ratingAvg: true,
        ratingCount: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      data: {
        maid,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Upload profile image
export const uploadProfileImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const maidId = req.user?.id;
    const file = req.file;

    if (!file) {
      throw new AppError(400, 'No image file provided');
    }

    // Get current profile image
    const maid = await prisma.maid.findUnique({
      where: { id: maidId },
      select: { profileImage: true },
    });

    // Delete old image if exists
    if (maid?.profileImage) {
      await deleteFromS3(maid.profileImage);
    }

    // Upload new image
    const imageUrl = await uploadToS3(file.buffer, file.mimetype);

    // Update profile image
    const updatedMaid = await prisma.maid.update({
      where: { id: maidId },
      data: { profileImage: imageUrl },
      select: {
        id: true,
        profileImage: true,
      },
    });

    res.json({
      success: true,
      data: {
        maid: updatedMaid,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get bookings
export const getBookings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const maidId = req.user?.id;
    const { status, page = 1, limit = 10 } = req.query;

    const where = {
      maidId,
      ...(status && { status }),
    };

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImage: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
      }),
      prisma.booking.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        bookings,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get booking details
export const getBookingDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const maidId = req.user?.id;
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
            phone: true,
          },
        },
        review: true,
      },
    });

    if (!booking) {
      throw new AppError(404, 'Booking not found');
    }

    if (booking.maidId !== maidId) {
      throw new AppError(403, 'Not authorized to view this booking');
    }

    res.json({
      success: true,
      data: {
        booking,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update booking status
export const updateBookingStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const maidId = req.user?.id;
    const { id } = req.params;
    const { status, notes } = req.body;

    const booking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      throw new AppError(404, 'Booking not found');
    }

    if (booking.maidId !== maidId) {
      throw new AppError(403, 'Not authorized to update this booking');
    }

    if (booking.status !== 'PENDING' && status === 'ACCEPTED') {
      throw new AppError(400, 'Can only accept pending bookings');
    }

    if (booking.status !== 'ACCEPTED' && status === 'COMPLETED') {
      throw new AppError(400, 'Can only complete accepted bookings');
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: {
        status,
        notes,
        ...(status === 'COMPLETED' && { completedAt: new Date() }),
      },
    });

    res.json({
      success: true,
      data: {
        booking: updatedBooking,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get reviews
export const getReviews = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const maidId = req.user?.id;
    const { page = 1, limit = 10 } = req.query;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { maidId },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profileImage: true,
            },
          },
          booking: {
            select: {
              id: true,
              scheduledDate: true,
              scheduledTime: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
      }),
      prisma.review.count({ where: { maidId } }),
    ]);

    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get earnings
export const getEarnings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const maidId = req.user?.id;
    const { startDate, endDate } = req.query;

    const where = {
      maidId,
      status: 'COMPLETED',
      ...(startDate && { completedAt: { gte: new Date(startDate as string) } }),
      ...(endDate && { completedAt: { lte: new Date(endDate as string) } }),
    };

    const [earnings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        select: {
          id: true,
          scheduledDate: true,
          scheduledTime: true,
          duration: true,
          totalAmount: true,
          completedAt: true,
        },
        orderBy: {
          completedAt: 'desc',
        },
      }),
      prisma.booking.aggregate({
        where,
        _sum: {
          totalAmount: true,
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        earnings,
        total: total._sum.totalAmount || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Update availability
export const updateAvailability = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const maidId = req.user?.id;
    const { availability } = req.body;

    const maid = await prisma.maid.update({
      where: { id: maidId },
      data: { availability },
      select: {
        id: true,
        availability: true,
      },
    });

    res.json({
      success: true,
      data: {
        maid,
      },
    });
  } catch (error) {
    next(error);
  }
}; 