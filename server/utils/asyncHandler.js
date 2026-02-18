/**
 * asyncHandler — eliminates try/catch boilerplate in Express route handlers.
 *
 * Wraps an async function so any rejected promise is automatically forwarded
 * to Express's `next(error)` path, reaching the global error handler.
 *
 * Usage:
 *   export const getUser = asyncHandler(async (req, res) => {
 *     const user = await User.findById(req.params.id);
 *     res.json({ status: "success", data: { user } });
 *   });
 */
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export default asyncHandler;
