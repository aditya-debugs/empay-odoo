// Tiny Zod validation middleware.
// Pass a schema and which part of the request to validate (default: body).
function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const errors = result.error.issues.map((i) => ({
        path: i.path.join('.'),
        message: i.message,
      }));
      return res.status(400).json({ message: 'Validation failed', errors });
    }
    req[source] = result.data;
    next();
  };
}

module.exports = { validate };
