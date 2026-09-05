import ApiError from '../utils/ApiError.js';

/**
 * Guard role-based: hanya user dengan role ADMIN.
 * Harus dipasang setelah authMiddleware.
 */
export default function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'ADMIN') {
    return next(ApiError.forbidden('Khusus admin'));
  }
  next();
}
