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

    // Attempt to connect to the database
    const conn = await mongoose.connect(dbUri);

    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    logger.error(`Database connection error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
