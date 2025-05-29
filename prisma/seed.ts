import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create test users
  const userPassword = await bcrypt.hash('password123', 12);
  const user1 = await prisma.user.create({
    data: {
      email: 'user1@example.com',
      password: userPassword,
      firstName: 'John',
      lastName: 'Doe',
      phone: '+1234567890',
      isVerified: true,
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'user2@example.com',
      password: userPassword,
      firstName: 'Jane',
      lastName: 'Smith',
      phone: '+1987654321',
      isVerified: true,
      street: '456 Oak Ave',
      city: 'Los Angeles',
      state: 'CA',
      zipCode: '90001',
    },
  });

  // Create test maids
  const maidPassword = await bcrypt.hash('password123', 12);
  const maid1 = await prisma.maid.create({
    data: {
      email: 'maid1@example.com',
      password: maidPassword,
      firstName: 'Sarah',
      lastName: 'Johnson',
      phone: '+1122334455',
      hourlyRate: 25.00,
      services: ['House Cleaning', 'Deep Cleaning', 'Window Cleaning'],
      languages: ['English', 'Spanish'],
      serviceAreas: ['New York', 'Brooklyn', 'Queens'],
      isVerified: true,
      availability: {
        MONDAY: { startTime: '09:00', endTime: '17:00' },
        TUESDAY: { startTime: '09:00', endTime: '17:00' },
        WEDNESDAY: { startTime: '09:00', endTime: '17:00' },
        THURSDAY: { startTime: '09:00', endTime: '17:00' },
        FRIDAY: { startTime: '09:00', endTime: '17:00' },
      },
    },
  });

  const maid2 = await prisma.maid.create({
    data: {
      email: 'maid2@example.com',
      password: maidPassword,
      firstName: 'Maria',
      lastName: 'Garcia',
      phone: '+1555666777',
      hourlyRate: 30.00,
      services: ['House Cleaning', 'Move-in/Move-out Cleaning', 'Post-Construction Cleaning'],
      languages: ['English', 'Spanish', 'Portuguese'],
      serviceAreas: ['Los Angeles', 'Santa Monica', 'Beverly Hills'],
      isVerified: true,
      availability: {
        MONDAY: { startTime: '08:00', endTime: '16:00' },
        TUESDAY: { startTime: '08:00', endTime: '16:00' },
        WEDNESDAY: { startTime: '08:00', endTime: '16:00' },
        THURSDAY: { startTime: '08:00', endTime: '16:00' },
        FRIDAY: { startTime: '08:00', endTime: '16:00' },
      },
    },
  });

  // Create test bookings
  const booking1 = await prisma.booking.create({
    data: {
      userId: user1.id,
      maidId: maid1.id,
      services: ['House Cleaning'],
      duration: 2,
      scheduledDate: new Date('2024-03-20'),
      scheduledTime: '10:00',
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      hourlyRate: maid1.hourlyRate,
      estimatedHours: 2,
      subtotal: maid1.hourlyRate * 2,
      serviceFee: (maid1.hourlyRate * 2) * 0.1,
      total: (maid1.hourlyRate * 2) * 1.1,
      status: 'COMPLETED',
      completedAt: new Date('2024-03-20T12:00:00Z'),
    },
  });

  const booking2 = await prisma.booking.create({
    data: {
      userId: user2.id,
      maidId: maid2.id,
      services: ['Deep Cleaning'],
      duration: 4,
      scheduledDate: new Date('2024-03-21'),
      scheduledTime: '09:00',
      street: '456 Oak Ave',
      city: 'Los Angeles',
      state: 'CA',
      zipCode: '90001',
      hourlyRate: maid2.hourlyRate,
      estimatedHours: 4,
      subtotal: maid2.hourlyRate * 4,
      serviceFee: (maid2.hourlyRate * 4) * 0.1,
      total: (maid2.hourlyRate * 4) * 1.1,
      status: 'PENDING',
    },
  });

  // Create test reviews
  await prisma.review.create({
    data: {
      userId: user1.id,
      maidId: maid1.id,
      bookingId: booking1.id,
      rating: 5,
      comment: 'Excellent service! Very thorough and professional.',
    },
  });

  // Update maid ratings
  const maid1Reviews = await prisma.review.findMany({
    where: { maidId: maid1.id },
  });

  await prisma.maid.update({
    where: { id: maid1.id },
    data: {
      ratingAvg: maid1Reviews.reduce((acc, curr) => acc + curr.rating, 0) / maid1Reviews.length,
      ratingCount: maid1Reviews.length,
    },
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 