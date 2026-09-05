import ApiError from '../utils/ApiError.js';

/**
 * Validator zod untuk body / params / query.
 * @param {object} schemas { body?, params?, query? } — masing-masing ZodSchema
 */
export default function validate(schemas) {
  return (req, res, next) => {
    try {
      for (const key of ['params', 'query', 'body']) {
        const schema = schemas[key];
        if (!schema) continue;
        const result = schema.safeParse(req[key]);
        if (!result.success) {
          const message = result.error.issues
            .map((i) => `${i.path.join('.') || key}: ${i.message}`)
            .join('; ');
          throw ApiError.badRequest(message);
        }
        // Ganti dengan hasil parse (transform + strip unknown)
        req[key] = result.data;
      }
      next();
    } catch (err) {
      next(err instanceof ApiError ? err : ApiError.badRequest('Validasi gagal'));
    }
  };
}
