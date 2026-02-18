/**
 * Custom application error class with HTTP status codes.
 * Extends native Error to include statusCode for the global error handler.
 *
 * Operational errors (isOperational = true) are expected errors like
 * "user not found" or "invalid input" — safe to show the message to clients.
 * Programming errors (isOperational = false) are unexpected bugs.
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    // Capture stack trace without this constructor appearing in it
    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;
