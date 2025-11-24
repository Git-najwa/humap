import mongoose from "mongoose";
import createDebugger from "debug";
import { ValidationError } from "../utils/errors.js";

const debug = createDebugger("humap:error");

export default function errorHandler(err, req, res, next) {
  // Log l'erreur complète en development
  debug(err.stack);

  let status = 500;
  let response = {
    message: "Internal Server Error",
    status: 500,
  };

  // ❌ Erreur de validation Mongoose
  if (err instanceof mongoose.Error.ValidationError) {
    status = 422;
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    response = {
      message: "Validation error",
      status: 422,
      errors,
    };
  }

  // ❌ Erreur de casting Mongoose (ex: ID invalide)
  else if (err instanceof mongoose.Error.CastError) {
    status = 400;
    response = {
      message: `Invalid ${err.kind}: ${err.value}`,
      status: 400,
    };
  }

  // ❌ Erreur de duplication (unique constraint)
  else if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyPattern)[0];
    response = {
      message: `${field} already exists`,
      status: 409,
      field,
    };
  }

  // ❌ Erreur de classe personnalisée ApiError
  else if (err.status) {
    status = err.status;
    response = {
      message: err.message,
      status: err.status,
    };
    // Inclure les erreurs de validation si présentes
    if (err.errors) {
      response.errors = err.errors;
    }
  }

  // ❌ Erreur JSON parse invalide
  else if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    status = 400;
    response = {
      message: "Invalid JSON in request body",
      status: 400,
    };
  }

  // ❌ Erreur générique
  else {
    response = {
      message: err.message || "Internal Server Error",
      status: 500,
    };
  }

  res.status(status).json(response);
}
