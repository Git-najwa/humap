/**
 * Classe d'erreur personnalisée pour les erreurs HTTP
 * Utilisée partout dans l'API pour retourner des erreurs cohérentes
 */
export class ApiError extends Error {
  constructor(message, status = 500) {
    super(message);
    this.status = status;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 400 - Requête invalide
 */
export class BadRequestError extends ApiError {
  constructor(message = "Bad Request") {
    super(message, 400);
  }
}

/**
 * 401 - Non authentifié
 */
export class UnauthorizedError extends ApiError {
  constructor(message = "Unauthorized") {
    super(message, 401);
  }
}

/**
 * 403 - Non autorisé
 */
export class ForbiddenError extends ApiError {
  constructor(message = "Forbidden") {
    super(message, 403);
  }
}

/**
 * 404 - Ressource non trouvée
 */
export class NotFoundError extends ApiError {
  constructor(resource = "Resource") {
    super(`${resource} not found`, 404);
  }
}

/**
 * 409 - Conflit (ex: email déjà utilisé)
 */
export class ConflictError extends ApiError {
  constructor(message = "Conflict") {
    super(message, 409);
  }
}

/**
 * 422 - Entité non processable (validation error)
 */
export class ValidationError extends ApiError {
  constructor(message = "Validation error", errors = []) {
    super(message, 422);
    this.errors = errors;
  }
}
