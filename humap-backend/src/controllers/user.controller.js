import User from "../models/User.js";
import { notFound, ok } from "../utils/responses.js";
import { NotFoundError, ForbiddenError, BadRequestError } from "../utils/errors.js";

export async function getUser(req, res, next) {
  try {
    const user = await User.findById(req.params.id);
    if (!user) throw new NotFoundError("User");
    return ok(res, user.toJSON());
  } catch (error) {
    next(error);
  }
}

export async function updateUser(req, res, next) {
  try {
    // Vérifier que l'utilisateur modifie son propre profil
    if (req.params.id !== req.currentUserId) {
      throw new ForbiddenError("You can only update your own profile");
    }

    const user = await User.findById(req.params.id);
    if (!user) throw new NotFoundError("User");

    // Champs autorisés à modifier
    const allowedFields = ["username", "gender", "avatar"];
    const updates = {};

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // Vérifier que password n'est pas modifié via cet endpoint
    if (req.body.password) {
      throw new BadRequestError("Use a dedicated endpoint to change password");
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    );

    return ok(res, updatedUser.toJSON());
  } catch (error) {
    next(error);
  }
}

export async function deleteUser(req, res, next) {
  try {
    // Vérifier que l'utilisateur supprime son propre compte
    if (req.params.id !== req.currentUserId) {
      throw new ForbiddenError("You can only delete your own account");
    }

    const user = await User.findById(req.params.id);
    if (!user) throw new NotFoundError("User");

    await User.findByIdAndDelete(req.params.id);
    return res.status(204).send();
  } catch (error) {
    next(error);
  }
}
