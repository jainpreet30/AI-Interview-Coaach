export function notFoundHandler(req, res) {
  res.status(404).json({ message: 'Resource not found.' });
}

export function errorHandler(err, req, res, next) {
  console.error(err);
  if (res.headersSent) {
    return next(err);
  }

  const status = err.statusCode || 500;
  res.status(status).json({ error: err.message || 'Internal server error.' });
}
