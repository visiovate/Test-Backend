import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Seed services
  const services = [
    {
      name: 'Home Deep Cleaning',
      description: 'Comprehensive cleaning of your entire home including all rooms, bathrooms, and kitchen.',
      price: {
        "1BHK": 150.00,
        "2BHK": 250.00,
        "3BHK": 350.00,
        "4BHK": 450.00,
        "Villa": 600.00
      }
    },
    {
      name: 'Kitchen Deep Cleaning',
      description: 'Thorough cleaning of kitchen appliances, cabinets, countertops, and floors.',
      price: {
        "Small": 80.00,
        "Medium": 120.00,
        "Large": 160.00
      }
    },
    {
      name: 'Bathroom Cleaning',
      description: 'Detailed cleaning of bathroom fixtures, tiles, shower, and toilet.',
      price: {
        "1 Bathroom": 60.00,
        "2 Bathrooms": 100.00,
        "3 Bathrooms": 140.00,
        "4+ Bathrooms": 180.00
      }
    },
    {
      name: 'Sofa/Carpet Shampooing',
      description: 'Professional cleaning and shampooing of sofas, carpets, and upholstery.',
      price: {
        "1 Sofa": 100.00,
        "2 Sofas": 180.00,
        "3+ Sofas": 250.00,
        "Carpet (per sq ft)": 2.00
      }
    },
    {
      name: 'Bedroom Cleaning',
      description: 'Complete cleaning of bedrooms including dusting, vacuuming, and organizing.',
      price: {
        "1 Bedroom": 70.00,
        "2 Bedrooms": 120.00,
        "3 Bedrooms": 170.00,
        "4+ Bedrooms": 220.00
      }
    },
    {
      name: 'Move-in/Move-out Cleaning',
      description: 'Comprehensive cleaning service for moving in or out of a property.',
      price: {
        "1BHK": 200.00,
        "2BHK": 350.00,
        "3BHK": 500.00,
        "4BHK": 650.00,
        "Villa": 800.00
      }
    },
    {
      name: 'Office/Shop Cleaning',
      description: 'Professional cleaning services for offices and commercial spaces.',
      price: {
        "Small (< 500 sq ft)": 180.00,
        "Medium (500-1000 sq ft)": 300.00,
        "Large (1000-2000 sq ft)": 500.00,
        "Extra Large (> 2000 sq ft)": 800.00
      }
    },
  ];

  // Create services first
  const createdServices = await Promise.all(
    services.map(service =>
      prisma.service.upsert({
        where: { name: service.name },
        update: {},
        create: service,
      })
    )
  );

  console.log('Services seeded successfully');

  // Create test users
  const userPassword = await bcrypt.hash('password123', 12);
  const user1 = await prisma.user.upsert({
    where: { email: 'user1@example.com' },
    update: {},
    create: {
      email: 'user1@example.com',
      password: userPassword,
      firstName: 'John',
      lastName: 'Doe',
      phone: '+1122334455',
      isVerified: true,
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'user2@example.com' },
    update: {},
    create: {
      email: 'user2@example.com',
      password: userPassword,
      firstName: 'Jane',
      lastName: 'Smith',
      phone: '+1122334456',
      isVerified: true,
    },
  });

  console.log('Test users created successfully');

  // Create test maids
  const maidPassword = await bcrypt.hash('password123', 12);
  const maid1 = await prisma.maid.upsert({
    where: { email: 'maid1@example.com' },
    update: {
      services: {
        set: createdServices.slice(0, 3).map(service => ({ id: service.id }))
      }
    },
    create: {
      email: 'maid1@example.com',
      password: maidPassword,
      firstName: 'Sarah',
      lastName: 'Johnson',
      phone: '+1122334455',
      hourlyRate: 25,
      services: {
        connect: createdServices.slice(0, 3).map(service => ({ id: service.id }))
      },
      languages: ['English', 'Spanish'],
      serviceAreas: ['New York', 'Brooklyn', 'Queens'],
      isVerified: true,
      availability: {
        MONDAY: {
          startTime: '09:00',
          endTime: '17:00'
        },
        TUESDAY: {
          startTime: '09:00',
          endTime: '17:00'
        },
        WEDNESDAY: {
          startTime: '09:00',
          endTime: '17:00'
        },
        THURSDAY: {
          startTime: '09:00',
          endTime: '17:00'
        },
        FRIDAY: {
          startTime: '09:00',
          endTime: '17:00'
        }
      }
    }
  });

  const maid2 = await prisma.maid.upsert({
    where: { email: 'maid2@example.com' },
    update: {
      services: {
        set: createdServices.slice(3, 6).map(service => ({ id: service.id }))
      }
    },
    create: {
      email: 'maid2@example.com',
      password: maidPassword,
      firstName: 'Maria',
      lastName: 'Garcia',
      phone: '+1122334456',
      hourlyRate: 30,
      services: {
        connect: createdServices.slice(3, 6).map(service => ({ id: service.id }))
      },
      languages: ['English', 'Spanish', 'French'],
      serviceAreas: ['Manhattan', 'Bronx'],
      isVerified: true,
      availability: {
        MONDAY: {
          startTime: '10:00',
          endTime: '18:00'
        },
        TUESDAY: {
          startTime: '10:00',
          endTime: '18:00'
        },
        WEDNESDAY: {
          startTime: '10:00',
          endTime: '18:00'
        },
        THURSDAY: {
          startTime: '10:00',
          endTime: '18:00'
        },
        FRIDAY: {
          startTime: '10:00',
          endTime: '18:00'
        }
      }
    }
  });

  console.log('Test maids created successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 