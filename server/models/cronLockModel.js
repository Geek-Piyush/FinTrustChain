import mongoose from "mongoose";

/**
 * Distributed cron lock using MongoDB atomic operations.
 * Prevents duplicate job execution across multiple server instances.
 *
 * Usage:
 *   const acquired = await CronLock.acquire("checkOverdueEMIs", 5 * 60 * 1000);
 *   if (!acquired) return; // another instance is running this job
 *   try { ... } finally { await CronLock.release("checkOverdueEMIs"); }
 */
const cronLockSchema = new mongoose.Schema({
  _id: { type: String }, // job name as the document ID
  lockedAt: { type: Date, required: true },
  expiresAt: { type: Date, required: true },
  lockedBy: { type: String }, // instance identifier (hostname/pid)
});

cronLockSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

/**
 * Attempt to acquire a lock for a job name.
 * Uses findOneAndUpdate with upsert for atomicity.
 * @param {string} jobName - Unique job identifier
 * @param {number} ttlMs - Lock duration in milliseconds (default: 5 minutes)
 * @returns {boolean} true if lock was acquired
 */
cronLockSchema.statics.acquire = async function (jobName, ttlMs = 5 * 60 * 1000) {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlMs);
  const lockedBy = `${process.env.HOSTNAME || "node"}-${process.pid}`;

  try {
    const result = await this.findOneAndUpdate(
      {
        _id: jobName,
        // Only acquire if: lock doesn't exist OR has expired
        $or: [{ expiresAt: { $lte: now } }],
      },
      {
        $set: { lockedAt: now, expiresAt, lockedBy },
      },
      { upsert: true, new: true }
    );
    // We got the lock if the lockedBy matches our instance
    return result.lockedBy === lockedBy;
  } catch (err) {
    // E11000 duplicate key = another instance beat us to it
    if (err.code === 11000) return false;
    console.error(`CronLock.acquire(${jobName}) error:`, err);
    return false;
  }
};

/**
 * Release a lock after job completion.
 * @param {string} jobName - Unique job identifier
 */
cronLockSchema.statics.release = async function (jobName) {
  try {
    await this.deleteOne({ _id: jobName });
  } catch (err) {
    console.error(`CronLock.release(${jobName}) error:`, err);
  }
};

const CronLock = mongoose.model("CronLock", cronLockSchema);
export default CronLock;
