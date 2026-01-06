import User from "../models/User.js";
import { buildAuthToken } from "../utils/jwt.js";
import { ok, created } from "../utils/responses.js";
import {
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
  ConflictError,
} from "../utils/errors.js";

export async function register(req, res, next) {
  try {
    const { username, email, password, gender, avatar } = req.body;

    // Validation
    if (!username || !email || !password) {
      throw new BadRequestError("username, email and password are required");
    }

    // Vérifier si email existe
    const existingEmail = await User.exists({ email });
    if (existingEmail) {
      throw new ConflictError("Email already in use");
    }

    // Vérifier si username existe
    const existingUsername = await User.exists({ username });
    if (existingUsername) {
      throw new ConflictError("Username already taken");
    }

    // Créer l'utilisateur
    const user = new User({ username, email, password, gender, avatar });
    await user.save();

    // Générer token
    const token = await buildAuthToken(user);
    return created(res, { user: user.toJSON(), token });
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      throw new BadRequestError("email and password are required");
    }

    // Chercher utilisateur
    const user = await User.findOne({ email });
    if (!user) {
      throw new UnauthorizedError("Invalid email or password");
    }

    // Vérifier mot de passe
    const valid = await user.comparePassword(password);
    if (!valid) {
      throw new UnauthorizedError("Invalid email or password");
    }

    // Générer token
    const token = await buildAuthToken(user);
    return ok(res, { user: user.toJSON(), token });
  } catch (error) {
    next(error);
  }
}

export async function me(req, res, next) {
  try {
    const user = await User.findById(req.currentUserId);
    if (!user) {
      throw new NotFoundError("User");
    }
    return ok(res, user.toJSON());
  } catch (error) {
    next(error);
  }
}
