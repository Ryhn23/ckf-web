/**
 * Bungkus async handler Express agar error tertangkap errorHandler.
 */
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export default asyncHandler;
