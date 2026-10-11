export class AppError extends Error {
  constructor(
    public readonly code: string,
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Bu işlem için yetkiniz yok.") {
    super("FORBIDDEN", 403, message);
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Kayıt bulunamadı.") {
    super("NOT_FOUND", 404, message);
  }
}

export class ValidationAppError extends AppError {
  constructor(
    message: string,
    public readonly fields?: Record<string, string>,
  ) {
    super("VALIDATION_FAILED", 422, message);
  }
}

export class ConflictError extends AppError {
  constructor(message = "Kayıt çakışması oluştu.") {
    super("CONFLICT", 409, message);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Oturum gerekli.") {
    super("AUTH_REQUIRED", 401, message);
  }
}
