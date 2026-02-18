import mongoose from "mongoose";
import "dotenv/config";
import logger from "../utils/logger.js";

const connectDB = async () => {
  try {
    const dbUri = process.env.MONGO_URI;

    if (!dbUri) {
      logger.error("DB_URI is not defined in your .env file");
      process.exit(1);
    }

    const conn = await mongoose.connect(dbUri, {
      // ── Read-scaling: route reads to secondaries when a replica set is
      //   available; fall back to the primary on a standalone instance.
      //   Switch to "primary" if strong read-after-write consistency is
      //   required for a specific operation (override per-query).
      readPreference: "secondaryPreferred",

      // ── Connection-pool tuning ──
      // Allow up to 20 concurrent sockets per server (default is 5).
      // Raise or lower based on Atlas tier / server RAM.
      maxPoolSize: parseInt(process.env.MONGO_POOL_SIZE || "20", 10),

      // How long (ms) a request waits for an available connection from the
      // pool before erroring. 10 s is a safe upper bound for web requests.
      waitQueueTimeoutMS: 10_000,

      // Drop and replace idle connections after 5 minutes to avoid stale
      // sockets being returned after network interruptions.
      maxIdleTimeMS: 300_000,

      // Heartbeat interval — how often the driver checks server health.
      heartbeatFrequencyMS: 10_000,
    });

    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error(`Database connection error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
