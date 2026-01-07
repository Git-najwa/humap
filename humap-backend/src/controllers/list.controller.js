import UserActivityList from "../models/UserActivityList.js";
import Activity from "../models/Activity.js";
import { created, ok } from "../utils/responses.js";
import { NotFoundError, ForbiddenError, BadRequestError } from "../utils/errors.js";

const normalizePagination = (req) => {
  const page = Math.max(parseInt(req.query.page || "1", 10), 1);
  const limit = Math.min(parseInt(req.query.limit || "10", 10), 100);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

const buildListResponse = async ({ userId, listType, customName }, req) => {
  const { page, limit, skip } = normalizePagination(req);
  const match = { user_id: userId, list_type: listType };
  if (customName) {
    match.custom_name = customName;
  }

  const total = await UserActivityList.countDocuments(match);
  const entries = await UserActivityList.find(match)
    .sort({ created_at: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const activityIds = entries.map((entry) => entry.activity_id).filter(Boolean);
  const activities = await Activity.find({ _id: { $in: activityIds } })
    .select("title")
    .lean();
  const activityMap = new Map(activities.map((activity) => [activity._id.toString(), activity]));

  const items = entries
    .map((entry) => {
      const activity = activityMap.get(entry.activity_id?.toString());
      if (!activity) return null;
      return {
        id: activity._id,
        title: activity.title,
        added_at: entry.created_at,
        liked_at: entry.created_at,
        viewed_at: entry.created_at,
      };
    })
    .filter(Boolean);

  return { page, limit, total, items };
};

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
    const { list_type, activity_id, custom_name, activityId } = req.body;
    const resolvedActivityId = activity_id || activityId;

    if (req.params.listId) {
      if (!resolvedActivityId) {
        throw new BadRequestError("activity_id is required");
      }

      const baseEntry = await UserActivityList.findById(req.params.listId);
      if (!baseEntry) {
        throw new NotFoundError("List");
      }
      if (baseEntry.user_id.toString() !== req.currentUserId) {
        throw new ForbiddenError("You can only update your own lists");
      }
      if (baseEntry.list_type !== "custom") {
        throw new BadRequestError("Only custom lists can accept activities");
      }

      const existingEntry = await UserActivityList.findOne({
        user_id: req.currentUserId,
        list_type: "custom",
        custom_name: baseEntry.custom_name,
        activity_id: resolvedActivityId,
      });
      if (existingEntry) {
        return ok(res, existingEntry);
      }

      const entry = await UserActivityList.create({
        user_id: req.currentUserId,
        list_type: "custom",
        custom_name: baseEntry.custom_name,
        activity_id: resolvedActivityId,
      });
      return created(res, entry);
    }

    if (!list_type) {
      throw new BadRequestError("list_type is required");
    }

    if (list_type !== "custom" && !resolvedActivityId) {
      throw new BadRequestError("activity_id is required");
    }

    if (list_type === "custom" && !custom_name) {
      throw new BadRequestError("custom_name is required for custom lists");
    }

    if (list_type === "custom") {
      const existingEntry = await UserActivityList.findOne({
        user_id: req.currentUserId,
        list_type: "custom",
        custom_name,
        activity_id: resolvedActivityId,
      });
      if (existingEntry) {
        return ok(res, existingEntry);
      }
    }

    const entry = await UserActivityList.create({
      ...req.body,
      activity_id: resolvedActivityId,
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

export async function listHistory(req, res, next) {
  try {
    const payload = await buildListResponse(
      { userId: req.currentUserId, listType: "history" },
      req
    );
    return ok(res, payload);
  } catch (error) {
    next(error);
  }
}

export async function listLiked(req, res, next) {
  try {
    const payload = await buildListResponse(
      { userId: req.currentUserId, listType: "liked" },
      req
    );
    return ok(res, payload);
  } catch (error) {
    next(error);
  }
}

export async function listCustom(req, res, next) {
  try {
    const { name } = req.query;
    if (!name) {
      throw new BadRequestError("name is required");
    }
    const payload = await buildListResponse(
      { userId: req.currentUserId, listType: "custom", customName: name },
      req
    );
    return ok(res, { list_name: name, ...payload });
  } catch (error) {
    next(error);
  }
}
