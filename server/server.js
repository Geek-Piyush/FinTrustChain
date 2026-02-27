import express from "express";
import dotenv from "dotenv";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoute.js";
import userRoutes from "./routes/userRoute.js";
import endorsementRoutes from "./routes/endorsementRoute.js";
import loanBrochureRoutes from "./routes/loanBrochureRoute.js";
import loanRequestRoutes from "./routes/loanRequestRoute.js";
import lenderRoutes from "./routes/lenderRoute.js";
import guarantorRequestRoute from "./routes/guarantorRequestRoute.js";
import contractRequestRoute from "./routes/contractRoute.js";
import paymentRoutes from "./routes/paymentRoute.js";
import notificationRoutes from "./routes/notificationRoute.js";
import dashboard from "./routes/dashboardRoute.js";
import debtRoutes from "./routes/debtRoute.js";
import supportRoutes from "./routes/supportRoute.js";
import adminRoutes from "./routes/adminRoute.js";
import { startScheduler } from "./utils/scheduler.js";
import { apiLimiter } from "./middlewares/rateLimiter.js";
import logger from "./utils/logger.js";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// ── Validate critical env vars on startup ──
const REQUIRED_ENV = ["JWT_SECRET", "JWT_EXPIRES_IN", "MONGO_URI"];
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    throw new Error(`❌ Missing required environment variable: ${key}`);
  }
}

// Create required directories if they don't exist
const requiredDirs = [
  "public/img/users",
  "public/img/esigns",
  "public/img/proofs",
  "public/contracts",
  "logs",
];

requiredDirs.forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    logger.info(`📁 Created directory: ${dir}`);
  }
});

// Connect to Database
connectDB();

const app = express();

// Trust proxy (important for rate limiting behind reverse proxies)
app.set("trust proxy", 1);

// Security Middlewares
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  }),
);

// CORS Configuration
const corsOptions = {
  // origin: process.env.FRONTEND_URL || "http://localhost:5173",
  origin: "*",
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));

// Compression middleware
app.use(compression());

// Body parsing middlewares
app.use(express.json({ limit: "10mb" })); // To parse JSON bodies
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Serve static files — ONLY safe directories (avatars).
// Sensitive dirs (contracts, esigns, proofs) are served through
// authenticated API endpoints, not publicly.
app.use(
  "/public",
  (req, res, next) => {
    const blocked = ["/contracts", "/img/esigns", "/img/proofs"];
    if (blocked.some(dir => req.path.startsWith(dir))) {
      return res.status(403).json({ message: "Access denied." });
    }
    next();
  },
  express.static(path.join(__dirname, "public"), {
    maxAge: "1d",
    setHeaders: res => {
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    },
  }),
);

// Apply rate limiting to all API routes
app.use("/api/", apiLimiter);

// Health check endpoint (for Docker/monitoring)
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
  });
});

app.get("/", (req, res) => {
  res.send("Welcome to FinTrustChain API");
  logger.info("Root endpoint accessed");
});

// API Routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/endorsements", endorsementRoutes);
app.use("/api/v1/brochures", loanBrochureRoutes);
app.use("/api/v1/loan-requests", loanRequestRoutes);
app.use("/api/v1/lender", lenderRoutes);
app.use("/api/v1/guarantor-requests", guarantorRequestRoute);
app.use("/api/v1/contracts", contractRequestRoute);
app.use("/api/v1/payments", paymentRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/dashboard", dashboard);
app.use("/api/v1/debts", debtRoutes);
app.use("/api/v1/support", supportRoutes);
app.use("/api/v1/admin", adminRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  // Handle Mongoose validation errors
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map(e => e.message);
    err.statusCode = 400;
    err.message = messages.join(". ");
    err.isOperational = true;
  }

  // Handle Mongoose duplicate key errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    err.statusCode = 409;
    err.message = `Duplicate value for "${field}". Please use another value.`;
    err.isOperational = true;
  }

  // Handle Mongoose cast errors (invalid ObjectId etc.)
  if (err.name === "CastError") {
    err.statusCode = 400;
    err.message = `Invalid ${err.path}: ${err.value}`;
    err.isOperational = true;
  }

  const statusCode = err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === "production";

  logger.error(`Error: ${err.message}`, {
    stack: err.stack,
    path: req.path,
    method: req.method,
    statusCode,
  });

  res.status(statusCode).json({
    status: "error",
    message:
      statusCode === 500 && isProduction && !err.isOperational
        ? "Something went wrong. Please try again later."
        : err.message || "An error occurred",
    ...(!isProduction && { stack: err.stack }),
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: "Route not found",
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV || "development"}`);

  startScheduler();
});
