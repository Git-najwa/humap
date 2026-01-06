import UserActivityList from "../models/UserActivityList.js";
import { created, ok } from "../utils/responses.js";
import { NotFoundError, ForbiddenError, BadRequestError } from "../utils/errors.js";

export async function listUserActivities(req, res, next) {
  try {
    const lists = await UserActivityList.find({ user_id: req.currentUserId });
    return ok(res, lists);
  } catch (error) {
    next(error);
  }
}

export async function getListEntry(req, res, next) {
  try {
    const entry = await UserActivityList.findById(req.params.listId);
    if (!entry) {
      throw new NotFoundError("List");
    }
    // Vérifier que l'utilisateur est propriétaire
    if (entry.user_id.toString() !== req.currentUserId) {
      throw new ForbiddenError("You can only access your own lists");
    }
    return ok(res, entry);
  } catch (error) {
    next(error);
  }
}

export async function addToList(req, res, next) {
  try {
    const { list_type, activity_id, custom_name } = req.body;

    if (!list_type) {
      throw new BadRequestError("list_type is required");
    }

    if (list_type !== "custom" && !activity_id) {
      throw new BadRequestError("activity_id is required");
    }

    if (list_type === "custom" && !custom_name) {
      throw new BadRequestError("custom_name is required for custom lists");
    }

    const entry = await UserActivityList.create({
      ...req.body,
      user_id: req.currentUserId,
    });
    return created(res, entry);
  } catch (error) {
    next(error);
  }
}

export async function updateList(req, res, next) {
  try {
    const entry = await UserActivityList.findById(req.params.listId);
    if (!entry) {
      throw new NotFoundError("List");
    }

    // Vérifier que l'utilisateur est propriétaire
    if (entry.user_id.toString() !== req.currentUserId) {
      throw new ForbiddenError("You can only update your own lists");
    }

    const updatedEntry = await UserActivityList.findByIdAndUpdate(
      req.params.listId,
      { custom_name: req.body.name },
      { new: true, runValidators: true }
    );
    return ok(res, updatedEntry);
  } catch (error) {
    next(error);
  }
}

export async function deleteList(req, res, next) {
  try {
    const entry = await UserActivityList.findById(req.params.listId);
    if (!entry) {
      throw new NotFoundError("List");
    }

    // Vérifier que l'utilisateur est propriétaire
    if (entry.user_id.toString() !== req.currentUserId) {
      throw new ForbiddenError("You can only delete your own lists");
    }

    await UserActivityList.findByIdAndDelete(req.params.listId);
    return res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function removeActivityFromList(req, res, next) {
  try {
    const { listId, activityId } = req.params;
    const entry = await UserActivityList.findOne({
      _id: listId,
      activity_id: activityId,
      user_id: req.currentUserId,
    });

    if (!entry) {
      throw new NotFoundError("List entry");
    }

    await UserActivityList.findByIdAndDelete(entry._id);
    return res.status(204).send();
  } catch (error) {
    next(error);
  }
}
