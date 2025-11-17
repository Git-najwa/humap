import Activity from "../models/Activity.js";
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
