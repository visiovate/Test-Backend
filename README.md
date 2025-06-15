# Sweepro Maid Booking Platform Backend

A robust backend system for a maid booking platform built with Node.js, Express.js, TypeScript, and Prisma.

## Features

- User and Maid authentication and authorization
- Booking management system
- Real-time notifications using Socket.IO
- Review and rating system
- File upload to AWS S3
- Email notifications
- Rate limiting and security features
- API documentation

## Tech Stack

- Node.js
- Express.js
- TypeScript
- Prisma (PostgreSQL)
- Redis
- Socket.IO
- AWS S3
- JWT Authentication
- Express Validator
- Winston Logger

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL
- Redis
- AWS Account (for S3)
- SMTP Server (for email notifications)

## Installation

1. Clone the repository:
```bash
https://github.com/visiovate/Test-Backend.git
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example` and fill in your configuration values.

4. Set up the database:
```bash
npm run migrate
```

5. Generate Prisma client:
```bash
npm run generate
```

6. Start the development server:
```bash
npm run dev
```

## API Endpoints

### Authentication
- POST /api/v1/auth/register/user - Register a new user
- POST /api/v1/auth/register/maid - Register a new maid
- POST /api/v1/auth/login - Login
- POST /api/v1/auth/refresh - Refresh token
- POST /api/v1/auth/logout - Logout

### Users
- GET /api/v1/users/saved-maids - Get saved maids
- POST /api/v1/users/saved-maids/:maidId - Save a maid
- DELETE /api/v1/users/saved-maids/:maidId - Remove saved maid
- GET /api/v1/users/bookings - Get user's bookings
- GET /api/v1/users/bookings/:id - Get booking details
- POST /api/v1/users/bookings/:id/cancel - Cancel booking
- GET /api/v1/users/reviews - Get user's reviews
- POST /api/v1/users/bookings/:id/review - Leave a review

### Maids
- GET /api/v1/maids/profile - Get maid profile
- PUT /api/v1/maids/profile - Update maid profile
- POST /api/v1/maids/profile/image - Upload profile image
- GET /api/v1/maids/bookings - Get maid's bookings
- GET /api/v1/maids/bookings/:id - Get booking details
- PATCH /api/v1/maids/bookings/:id/status - Update booking status
- GET /api/v1/maids/reviews - Get maid's reviews
- GET /api/v1/maids/earnings - Get maid's earnings
- PUT /api/v1/maids/availability - Update availability

### Bookings
- POST /api/v1/bookings - Create booking
- GET /api/v1/bookings/:id - Get booking details
- POST /api/v1/bookings/:id/cancel - Cancel booking
- GET /api/v1/bookings/:id/messages - Get chat messages
- POST /api/v1/bookings/:id/messages - Send chat message
- GET /api/v1/bookings/history - Get booking history

### Reviews
- GET /api/v1/reviews/maid/:maidId - Get maid's reviews
- GET /api/v1/reviews/user - Get user's reviews
- POST /api/v1/reviews/booking/:bookingId - Create review
- PUT /api/v1/reviews/:id - Update review
- DELETE /api/v1/reviews/:id - Delete review

### Notifications
- GET /api/v1/notifications - Get notifications
- PATCH /api/v1/notifications/:id/read - Mark notification as read
- PATCH /api/v1/notifications/read-all - Mark all notifications as read
- DELETE /api/v1/notifications/:id - Delete notification
- DELETE /api/v1/notifications - Delete all notifications

## Development

### Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run migrate` - Run database migrations
- `npm run generate` - Generate Prisma client
- `npm run seed` - Seed database with sample data

### Code Style

The project uses ESLint and Prettier for code formatting. Run the following commands:

```bash
npm run lint
npm run format
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Project Status

### Completed Features

#### 1. Authentication & User Management
- ✅ User registration and login
- ✅ JWT-based authentication
- ✅ User profile management
- ✅ Password reset functionality
- ✅ Email verification

#### 2. Maid Management
- ✅ Maid registration and profile
- ✅ Service areas and availability management
- ✅ Service types and pricing
- ✅ Maid verification system
- ✅ Rating and review system

#### 3. Booking System
- ✅ Booking creation
- ✅ Booking status management
- ✅ Booking cancellation
- ✅ Booking history
- ✅ Special instructions handling

#### 4. Payment Integration
- ✅ Stripe payment integration
- ✅ Payment intent creation
- ✅ Payment confirmation
- ✅ Refund processing
- ✅ Webhook handling for payment events

#### 5. Search & Discovery
- ✅ Advanced maid search with filters:
  - Location-based search
  - Service type filtering
  - Price range filtering
  - Rating filtering
  - Availability checking
- ✅ Popular services listing
- ✅ Popular locations listing
- ✅ Pagination support

#### 6. Notification System
- ✅ Real-time notifications
- ✅ Email notifications
- ✅ Booking status updates
- ✅ Payment notifications
- ✅ Review notifications

#### 7. Review System
- ✅ Rating submission
- ✅ Review comments
- ✅ Rating calculation
- ✅ Review listing

### Pending Features for MVP

#### 1. Admin Dashboard API
- ⏳ User management endpoints
- ⏳ Maid verification workflow
- ⏳ Booking management
- ⏳ Payment tracking
- ⏳ Analytics and reporting

#### 2. Enhanced Booking Flow
- ⏳ Real-time availability checking
- ⏳ Service duration calculation
- ⏳ Dynamic price calculation
- ⏳ Booking confirmation flow
- ⏳ Schedule conflict prevention

#### 3. Rating System Improvements
- ⏳ Review moderation system
- ⏳ Review response functionality
- ⏳ Rating analytics
- ⏳ Review reporting system

#### 4. Additional Features
- ⏳ Chat system between users and maids
- ⏳ Emergency cancellation handling
- ⏳ Service customization options
- ⏳ Bulk booking support
- ⏳ Recurring booking support

## API Endpoints

### Authentication
- POST `/api/v1/auth/register` - User registration
- POST `/api/v1/auth/login` - User login
- POST `/api/v1/auth/refresh` - Refresh token
- POST `/api/v1/auth/forgot-password` - Password reset request
- POST `/api/v1/auth/reset-password` - Reset password

### Users
- GET `/api/v1/users/profile` - Get user profile
- PUT `/api/v1/users/profile` - Update user profile
- GET `/api/v1/users/bookings` - Get user bookings

### Maids
- GET `/api/v1/maids` - List maids
- GET `/api/v1/maids/:id` - Get maid details
- PUT `/api/v1/maids/profile` - Update maid profile
- GET `/api/v1/maids/bookings` - Get maid bookings

### Bookings
- POST `/api/v1/bookings` - Create booking
- GET `/api/v1/bookings/:id` - Get booking details
- PUT `/api/v1/bookings/:id` - Update booking
- DELETE `/api/v1/bookings/:id` - Cancel booking

### Payments
- POST `/api/v1/payments/create-intent` - Create payment intent
- GET `/api/v1/payments/confirm/:paymentIntentId` - Confirm payment
- POST `/api/v1/payments/refund/:paymentIntentId` - Process refund

### Search
- GET `/api/v1/search/maids` - Search maids with filters
- GET `/api/v1/search/services/popular` - Get popular services
- GET `/api/v1/search/locations/popular` - Get popular locations

### Reviews
- POST `/api/v1/reviews` - Create review
- GET `/api/v1/reviews/maid/:maidId` - Get maid reviews
- PUT `/api/v1/reviews/:id` - Update review
- DELETE `/api/v1/reviews/:id` - Delete review

### Notifications
- GET `/api/v1/notifications` - Get user notifications
- PUT `/api/v1/notifications/:id/read` - Mark notification as read
- DELETE `/api/v1/notifications/:id` - Delete notification

### Webhooks
- POST `/api/v1/webhooks/stripe` - Stripe webhook handler

## Environment Variables Required
```
# Server Configuration
NODE_ENV=development
PORT=3000
API_PREFIX=/api/v1

# Database
DATABASE_URL=your_database_connection_string

# JWT Authentication
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=1d
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key
JWT_REFRESH_EXPIRES_IN=7d

# Redis
REDIS_URL=redis://localhost:6379

# AWS Configuration
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=your_aws_region
AWS_S3_BUCKET=your_s3_bucket_name

# Email Configuration
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
EMAIL_FROM=your_sender_email

# Socket Configuration
SOCKET_CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100

# Stripe Payment Configuration
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
```

## Next Steps
1. Implement Admin Dashboard API
2. Enhance Booking Flow
3. Improve Rating System
4. Add Chat System
5. Implement Emergency Features

## Getting Started
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Run migrations: `npx prisma migrate dev`
5. Start the server: `npm run dev`

## Tech Stack
- Node.js
- Express.js
- TypeScript
- PostgreSQL
- Prisma ORM
- Redis
- Socket.IO
- Stripe
- AWS S3 