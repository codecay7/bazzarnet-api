const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  // If Mongoose not found error, set to 404
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 404;
    message = 'Resource not found';
  }

  // If Joi validation error, use 400 and extract details
  if (err.errors && Array.isArray(err.errors) && err.errors[0].message) { // Check for Joi validation errors structure
    statusCode = 400;
    message = 'Validation failed';
  }

  res.status(statusCode).json({
    message: message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    errors: err.errors || undefined, // Include validation errors if present
  });
};

export { notFound, errorHandler };