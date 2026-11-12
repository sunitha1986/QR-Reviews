/**
 * Centralized Error Handling Middlewares
 */

/**
 * 404 Route Not Found Handler
 */
function notFoundHandler(req, res, next) {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.originalUrl,
    method: req.method
  });
}

/**
 * Global Error Handler (500)
 */
function errorHandler(err, req, res, next) {
  console.error('[Server Error]', err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {})
  });
}

export {
  notFoundHandler,
  errorHandler
};

export default {
  notFoundHandler,
  errorHandler
};
