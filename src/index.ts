import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import { errorHandler } from "./middleware/error.middleware";
import { rateLimit } from "express-rate-limit";

// Import routes

import { setupRoutes } from "./routes";

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});
app.use(limiter);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV !== "test") {
  app.use(morgan("dev"));
}

// API routes
app.use("/api/v1", setupRoutes());

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
