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

export async function getListEntry(req, res, next) {
  try {
    const entry = await UserActivityList.findById(req.params.id);
    if (!entry) return notFound(res);
    return ok(res, entry);
  } catch (error) {
    next(error);
  }
}
