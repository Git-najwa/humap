import UserActivityList from "../models/UserActivityList.js";
import { created, notFound, ok } from "../utils/responses.js";

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
    const entry = await UserActivityList.findById(req.params.id);
    if (!entry) return notFound(res);
    // Vérifier que l'utilisateur est propriétaire
    if (entry.user_id.toString() !== req.currentUserId) {
      return res.status(403).json({ message: "Forbidden", status: 403 });
    }
    return ok(res, entry);
  } catch (error) {
    next(error);
  }
}

export async function addToList(req, res, next) {
  try {
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
    if (!entry) return notFound(res);
    
    // Vérifier que l'utilisateur est propriétaire
    if (entry.user_id.toString() !== req.currentUserId) {
      return res.status(403).json({ message: "Forbidden", status: 403 });
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
    if (!entry) return notFound(res);
    
    // Vérifier que l'utilisateur est propriétaire
    if (entry.user_id.toString() !== req.currentUserId) {
      return res.status(403).json({ message: "Forbidden", status: 403 });
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
    
    if (!entry) return notFound(res);

    await UserActivityList.findByIdAndDelete(entry._id);
    return res.status(204).send();
  } catch (error) {
    next(error);
  }
}
