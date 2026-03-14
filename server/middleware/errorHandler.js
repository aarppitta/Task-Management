/**
 * errorHandler.js
 * Global Express error-handling middleware.
 * Must be registered LAST in the middleware chain (after all routes).
 * Catches any error passed via next(err) and returns a structured JSON response.
 */

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  // Log the full error for debugging server-side
  console.error('[Error]', err.stack || err.message);

  const statusCode = err.statusCode || 500;

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
};

export default errorHandler;
