// src/middleware/validate.js — Zod schema validation wrapper
const { badRequest } = require('../utils/response');

function validate(schema, target = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[target]);
    if (!result.success) {
      const details = result.error.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message
      }));
      return badRequest(res, 'Validation failed', details);
    }
    req[target] = result.data; // Assign parsed + coerced data
    next();
  };
}

module.exports = { validate };
