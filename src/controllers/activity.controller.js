import Activity from "../models/Activity.js";
import UserActivityList from "../models/UserActivityList.js";
import { created, notFound, ok } from "../utils/responses.js";

export async function listActivities(req, res, next) {
  try {
    const activities = await Activity.find();
    return ok(res, activities);
  } catch (error) {
    next(error);
  }
}

export async function createActivity(req, res, next) {
  try {
    const activity = await Activity.create({ ...req.body, user_id: req.currentUserId });
    return created(res, activity);
  } catch (error) {
    next(error);
  }
}

export async function getActivity(req, res, next) {
  try {
    const activity = await Activity.findById(req.params.id);
    if (!activity) return notFound(res);
    return ok(res, activity);
  } catch (error) {
    next(error);
  }
}

export async function updateActivity(req, res, next) {
  try {
    const activity = await Activity.findById(req.params.id);
    if (!activity) return notFound(res);
    
    // Vérifier que l'utilisateur est propriétaire ou admin
    if (activity.user_id.toString() !== req.currentUserId && req.user?.role !== "admin") {
      return res.status(403).json({ message: "Forbidden", status: 403 });
    }

    const updatedActivity = await Activity.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    return ok(res, updatedActivity);
  } catch (error) {
    next(error);
  }
}

export async function deleteActivity(req, res, next) {
  try {
    const activity = await Activity.findById(req.params.id);
    if (!activity) return notFound(res);
    
    // Vérifier que l'utilisateur est propriétaire ou admin
    if (activity.user_id.toString() !== req.currentUserId && req.user?.role !== "admin") {
      return res.status(403).json({ message: "Forbidden", status: 403 });
    }

    await Activity.findByIdAndDelete(req.params.id);
    return res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function toggleLike(req, res, next) {
  try {
    const { id } = req.params;
    const activity = await Activity.findById(id);
    if (!activity) return notFound(res);

    // Chercher si l'activité est déjà dans les likes de l'utilisateur
    const existingLike = await UserActivityList.findOne({
      user_id: req.currentUserId,
      activity_id: id,
      list_type: "liked",
    });

    let liked = false;

    if (existingLike) {
      // Supprimer le like
      await UserActivityList.findByIdAndDelete(existingLike._id);
    } else {
      // Ajouter le like
      await UserActivityList.create({
        user_id: req.currentUserId,
        activity_id: id,
        list_type: "liked",
      });
      liked = true;
    }

    return ok(res, { liked });
  } catch (error) {
    next(error);
  }
}
