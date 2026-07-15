const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

const errorHandler = (err, req, res, next) => {
  const derivedStatus = err?.statusCode || err?.status;
  const statusCode = derivedStatus || (res.statusCode === 200 ? 500 : res.statusCode);
  const message = err?.type === 'entity.too.large'
    ? 'Request payload too large'
    : err.message;

  res.status(statusCode).json({
    message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};

module.exports = { notFound, errorHandler };
