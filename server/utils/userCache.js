/**
 * Lightweight in-memory user cache with TTL.
 * Avoids hitting MongoDB on every authenticated request.
 *
 * - Set/get cached user objects by ID
 * - Auto-expires entries after TTL (default 60s)
 * - Invalidate on user update via invalidate(userId)
 * - No external dependencies (no Redis needed)
 *
 * For multi-instance deployments, replace with Redis-backed cache.
 */

const DEFAULT_TTL_MS = 60 * 1000; // 60 seconds
const MAX_CACHE_SIZE = 10_000; // prevent unbounded memory growth

const cache = new Map();

/**
 * Get a cached user by ID.
 * @param {string} userId
 * @returns {object|null} Cached user document or null if expired/missing
 */
export function get(userId) {
  const key = String(userId);
  const entry = cache.get(key);
  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.user;
}

/**
 * Cache a user document.
 * @param {string} userId
 * @param {object} user - Mongoose user document (will be stored as plain object)
 * @param {number} ttlMs - Time-to-live in milliseconds
 */
export function set(userId, user, ttlMs = DEFAULT_TTL_MS) {
  const key = String(userId);

  // Evict oldest entries if cache is full
  if (cache.size >= MAX_CACHE_SIZE && !cache.has(key)) {
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }

  cache.set(key, {
    user,
    expiresAt: Date.now() + ttlMs,
  });
}

/**
 * Invalidate a cached user (call after user update/save).
 * @param {string} userId
 */
export function invalidate(userId) {
  cache.delete(String(userId));
}

/**
 * Clear the entire cache.
 */
export function clear() {
  cache.clear();
}

/**
 * Get cache stats for debugging.
 */
export function stats() {
  return { size: cache.size, maxSize: MAX_CACHE_SIZE };
}
