export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  /** Optional machine-readable code for API clients (e.g. SPOTIFY_NOT_CONFIGURED). */
  code?: string;

  constructor(message: string, statusCode: number = 500, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
