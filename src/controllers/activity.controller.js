import Activity from "../models/Activity.js";
import UserActivityList from "../models/UserActivityList.js";
import { created, ok } from "../utils/responses.js";
import { NotFoundError, ForbiddenError } from "../utils/errors.js";

export async function listActivities(req, res, next) {
  try {
    // 📖 PAGINATION
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    // 🔍 FILTRAGE
    const query = {};

    if (req.query.mood) {
      query.mood = req.query.mood;
    }

    if (req.query.price_range !== undefined) {
      const priceRange = parseInt(req.query.price_range);
      if (!Number.isNaN(priceRange)) {
        query.price_range = { $lte: priceRange };
      }
    }

    if (req.query.nb_people !== undefined) {
      const nbPeople = parseInt(req.query.nb_people);
      if (!Number.isNaN(nbPeople)) {
        query.nb_people = nbPeople;
      }
    }

    if (req.query.day) {
      query.day = req.query.day;
    }

    if (req.query.age_range) {
      query.age_range = req.query.age_range;
    }

    // Search textuel (si q fourni)
    if (req.query.q) {
      query.$text = { $search: req.query.q };
    }

    // ⚡ Exécuter la query
    const activities = await Activity.find(query).skip(skip).limit(limit);
    const total = await Activity.countDocuments(query);

    // 📊 Retourner avec métadonnées
    return ok(res, {
      data: activities,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
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
    if (!activity) {
      throw new NotFoundError("Activity");
    }
    return ok(res, activity);
  } catch (error) {
    next(error);
  }
}

export async function updateActivity(req, res, next) {
  try {
    const activity = await Activity.findById(req.params.id);
    if (!activity) {
      throw new NotFoundError("Activity");
    }

    // Vérifier que l'utilisateur est propriétaire ou admin
    if (activity.user_id.toString() !== req.currentUserId && req.user?.role !== "admin") {
      throw new ForbiddenError("You can only update your own activities");
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
    if (!activity) {
      throw new NotFoundError("Activity");
    }

    // Vérifier que l'utilisateur est propriétaire ou admin
    if (activity.user_id.toString() !== req.currentUserId && req.user?.role !== "admin") {
      throw new ForbiddenError("You can only delete your own activities");
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
    if (!activity) {
      throw new NotFoundError("Activity");
    }

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
