/**
 * Error API dengan status code.
 */
export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }

  static badRequest(msg = 'Permintaan tidak valid') {
    return new ApiError(400, msg);
  }
  static unauthorized(msg = 'Tidak terautentikasi') {
    return new ApiError(401, msg);
  }
  static forbidden(msg = 'Akses ditolak') {
    return new ApiError(403, msg);
  }
  static notFound(msg = 'Tidak ditemukan') {
    return new ApiError(404, msg);
  }
  static conflict(msg = 'Konflik data') {
    return new ApiError(409, msg);
  }
}

export default ApiError;
