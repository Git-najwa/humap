import User from "../models/User.js";
import { notFound, ok } from "../utils/responses.js";

export async function getUser(req, res, next) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return notFound(res);
    return ok(res, user.toJSON());
  } catch (error) {
    next(error);
  }
}
