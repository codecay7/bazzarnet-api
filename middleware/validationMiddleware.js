const validate = (schema) => (req, res, next) => {
  // Log the request body before validation to inspect its structure
  console.log('Backend: Request body before validation:', req.body); 
  const { error } = schema.validate(req.body, { abortEarly: false }); // abortEarly: false collects all errors

  if (error) {
    const errors = error.details.map((err) => ({
      field: err.context.key,
      message: err.message,
    }));
    console.error('Backend: Validation failed:', errors); // Log validation errors
    return res.status(400).json({ message: 'Validation failed', errors });
  }
  next();
};

export { validate };