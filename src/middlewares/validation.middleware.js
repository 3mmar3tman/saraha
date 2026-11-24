const validate = (schema) => {
  return (req, res, next) => {
    console.log("Validation Middleware is running!");

    const result = schema.safeParse(req.body);

    console.log("Validation result:", result.success);

    if (!result.success) {
      return res.status(400).json({
        message: "Validation failed",
        errors: result.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    req.body = result.data;
    next();
  };
};

module.exports = validate;