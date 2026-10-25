/**
 * Generic request validation middleware.
 * Usage: validateBody(schema) where schema is an object with field validators.
 */

export function validateBody(schema) {
  return (req, res, next) => {
    const errors = [];

    for (const [field, rules] of Object.entries(schema)) {
      const value = req.body?.[field];

      if (rules.required && (value === undefined || value === null || value === "")) {
        errors.push({ field, message: `${field} is required.` });
        continue;
      }

      if (value === undefined || value === null) {
        continue;
      }

      if (rules.type && typeof value !== rules.type) {
        errors.push({ field, message: `${field} must be of type ${rules.type}.` });
        continue;
      }

      if (rules.validator && typeof rules.validator === "function") {
        const result = rules.validator(value);
        if (result === false) {
          errors.push({ field, message: rules.message || `${field} is invalid.` });
        } else if (typeof result === "string") {
          errors.push({ field, message: result });
        }
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Request validation failed.",
          details: errors,
        },
      });
    }

    next();
  };
}

export function validateParams(schema) {
  return (req, res, next) => {
    const errors = [];

    for (const [field, rules] of Object.entries(schema)) {
      const value = req.params?.[field];

      if (rules.required && (value === undefined || value === null || value === "")) {
        errors.push({ field, message: `${field} is required in path parameters.` });
        continue;
      }

      if (value === undefined || value === null) {
        continue;
      }

      if (rules.validator && typeof rules.validator === "function") {
        const result = rules.validator(value);
        if (result === false) {
          errors.push({ field, message: rules.message || `${field} is invalid.` });
        } else if (typeof result === "string") {
          errors.push({ field, message: result });
        }
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Path parameter validation failed.",
          details: errors,
        },
      });
    }

    next();
  };
}

export function validateQuery(schema) {
  return (req, res, next) => {
    const errors = [];

    for (const [field, rules] of Object.entries(schema)) {
      const value = req.query?.[field];

      if (rules.required && (value === undefined || value === null || value === "")) {
        errors.push({ field, message: `${field} is required in query parameters.` });
        continue;
      }

      if (value === undefined || value === null) {
        continue;
      }

      if (rules.validator && typeof rules.validator === "function") {
        const result = rules.validator(value);
        if (result === false) {
          errors.push({ field, message: rules.message || `${field} is invalid.` });
        } else if (typeof result === "string") {
          errors.push({ field, message: result });
        }
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Query parameter validation failed.",
          details: errors,
        },
      });
    }

    next();
  };
}