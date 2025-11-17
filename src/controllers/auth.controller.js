import User from "../models/User.js";
import { buildAuthToken } from "../utils/jwt.js";
import { badRequest, created, ok, unauthorized, notFound } from "../utils/responses.js";

export async function register(req, res, next) {
  try {
    const { username, email, password, gender, avatar } = req.body;
    if (!username || !email || !password) {
      return badRequest(res, "username, email and password are required");
    }

    const existing = await User.exists({ email });
    if (existing) {
      return badRequest(res, "Email already in use");
    }

    const user = new User({ username, email, password, gender, avatar });
    await user.save();

    const token = await buildAuthToken(user);
    return created(res, { user: user.toJSON(), token });
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return badRequest(res, "email and password are required");

    const user = await User.findOne({ email });
    if (!user) return unauthorized(res);

    const valid = await user.comparePassword(password);
    if (!valid) return unauthorized(res);

    const token = await buildAuthToken(user);
    return ok(res, { user: user.toJSON(), token });
  } catch (error) {
    next(error);
  }
}

export async function me(req, res, next) {
  try {
    const user = await User.findById(req.currentUserId);
    if (!user) return notFound(res);
    return ok(res, user.toJSON());
  } catch (error) {
    next(error);
  }
}
