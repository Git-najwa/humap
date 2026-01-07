import mongoose from "mongoose";
import Activity from "../models/Activity.js";
import User from "../models/User.js";
import UserActivityList from "../models/UserActivityList.js";
import { created, ok } from "../utils/responses.js";
import { NotFoundError, ForbiddenError } from "../utils/errors.js";
import { getIO } from "../utils/socket.js";
import { halResource, halCollection, buildQueryString } from "../utils/hal.js";

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
    const totalPages = Math.ceil(total / limit);

    // 📊 Retourner avec métadonnées HAL+JSON (hypermedia)
    const queryString = buildQueryString(req.query);
    return ok(res, {
      ...halCollection(activities, 'activities', { page, limit, total, totalPages }, queryString),
      // Backward compatibility
      items: activities,
      pagination: { page, limit, total, totalPages },
    });
  } catch (error) {
    next(error);
  }
}

export async function createActivity(req, res, next) {
  try {
    const activity = await Activity.create({ ...req.body, user_id: req.currentUserId });
    
    // Émettre l'événement temps réel à tous les clients
    const io = getIO();
    if (io) {
      io.emit("activity:created", activity);
    }
    
    return created(res, halResource(activity, 'activities'));
  } catch (error) {
    // Return a 400 with validation details for Mongoose validation errors
    if (error && error.name === "ValidationError") {
      return res.status(400).json({
        message: "Validation error",
        errors: Object.values(error.errors || {}).map((e) => e.message),
      });
    }

    next(error);
  }
}

export async function getActivity(req, res, next) {
  try {
    const activity = await Activity.findById(req.params.id);
    if (!activity) {
      throw new NotFoundError("Activity");
    }
    return ok(res, halResource(activity, 'activities'));
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
    if (!activity.user_id) {
      throw new ForbiddenError("You can only update your own activities");
    }
    if (activity.user_id.toString() !== req.currentUserId && req.user?.role !== "admin") {
      throw new ForbiddenError("You can only update your own activities");
    }

    const updatedActivity = await Activity.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    // Émettre l'événement temps réel
    const io = getIO();
    if (io) {
      io.emit("activity:updated", updatedActivity);
    }
    
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
    if (!activity.user_id) {
      throw new ForbiddenError("You can only delete your own activities");
    }
    if (activity.user_id.toString() !== req.currentUserId && req.user?.role !== "admin") {
      throw new ForbiddenError("You can only delete your own activities");
    }

    await Activity.findByIdAndDelete(req.params.id);
    
    // Émettre l'événement temps réel
    const io = getIO();
    if (io) {
      io.emit("activity:deleted", { _id: req.params.id });
    }
    
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

      // Notifier le créateur de l'activité (si ce n'est pas lui-même qui like)
      const activityOwnerId = activity.user_id?.toString();
      if (activityOwnerId && activityOwnerId !== req.currentUserId) {
        const liker = await User.findById(req.currentUserId);
        const io = getIO();
        io.to(`user:${activityOwnerId}`).emit("notification:like", {
          activityId: activity._id,
          activityTitle: activity.title,
          likerUsername: liker?.username || "Quelqu'un",
        });
      }
    }

    return ok(res, { liked });
  } catch (error) {
    next(error);
  }
}

// ==================== AGRÉGATIONS ====================

// 1️⃣ STATS PAR MOOD
export async function statsByMood(req, res, next) {
  try {
    const source = req.query.source || "all";
    
    const matchStage = source === "all" ? {} : { source };

    const stats = await Activity.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: "reviews",
          localField: "_id",
          foreignField: "activity_id",
          as: "reviews",
        },
      },
      {
        $group: {
          _id: "$mood",
          nbActivities: { $sum: 1 },
          avgPrice: { $avg: "$price_range" },
          avgRating: {
            $avg: {
              $cond: [
                { $gt: [{ $size: "$reviews" }, 0] },
                { $avg: "$reviews.ranking" },
                null,
              ],
            },
          },
          nbReviews: { $sum: { $size: "$reviews" } },
        },
      },
      { $sort: { nbActivities: -1 } },
    ]);

    return ok(res, { data: stats });
  } catch (error) {
    next(error);
  }
}

// 2️⃣ TOP RATED ACTIVITIES
export async function topRatedActivities(req, res, next) {
  try {
    const source = req.query.source || "all";
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);

    const matchStage = source === "all" ? {} : { source };

    const topRated = await Activity.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: "reviews",
          localField: "_id",
          foreignField: "activity_id",
          as: "reviews",
        },
      },
      {
        $addFields: {
          nbReviews: { $size: "$reviews" },
          avgRating: {
            $cond: [
              { $gt: [{ $size: "$reviews" }, 0] },
              { $avg: "$reviews.ranking" },
              0,
            ],
          },
        },
      },
      { $match: { nbReviews: { $gt: 0 } } },
      { $sort: { avgRating: -1, nbReviews: -1 } },
      { $limit: limit },
      {
        $project: {
          _id: 1,
          title: 1,
          location: 1,
          mood: 1,
          price_range: 1,
          avgRating: 1,
          nbReviews: 1,
          source: 1,
        },
      },
    ]);

    return ok(res, { data: topRated });
  } catch (error) {
    next(error);
  }
}

// 3️⃣ MOST LIKED ACTIVITIES
export async function mostLikedActivities(req, res, next) {
  try {
    const source = req.query.source || "all";
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);

    const matchStage = source === "all" ? {} : { source };

    const mostLiked = await Activity.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: "useractivitylists",
          let: { activityId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$activity_id", "$$activityId"] },
                    { $eq: ["$list_type", "liked"] },
                  ],
                },
              },
            },
          ],
          as: "likes",
        },
      },
      {
        $addFields: {
          nbLikes: { $size: "$likes" },
        },
      },
      { $match: { nbLikes: { $gt: 0 } } },
      { $sort: { nbLikes: -1 } },
      { $limit: limit },
      {
        $project: {
          _id: 1,
          title: 1,
          location: 1,
          mood: 1,
          price_range: 1,
          nbLikes: 1,
          source: 1,
        },
      },
    ]);

    return ok(res, { data: mostLiked });
  } catch (error) {
    next(error);
  }
}

// 4️⃣ USER STATS
export async function getUserStats(req, res, next) {
  try {
    const { userId } = req.params;

    const stats = await Activity.aggregate([
      {
        $facet: {
          createdActivities: [
            { $match: { user_id: new mongoose.Types.ObjectId(userId) } },
            { $count: "total" },
          ],
          postedReviews: [
            {
              $lookup: {
                from: "reviews",
                localField: "_id",
                foreignField: "activity_id",
                as: "reviews",
              },
            },
            {
              $addFields: {
                userReviews: {
                  $filter: {
                    input: "$reviews",
                    as: "review",
                    cond: {
                      $eq: [
                        "$$review.user_id",
                        new mongoose.Types.ObjectId(userId),
                      ],
                    },
                  },
                },
              },
            },
            {
              $group: {
                _id: null,
                total: { $sum: { $size: "$userReviews" } },
              },
            },
          ],
          favorites: [
            {
              $lookup: {
                from: "useractivitylists",
                let: { activityId: "$_id" },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ["$activity_id", "$$activityId"] },
                          { $eq: ["$user_id", new mongoose.Types.ObjectId(userId)] },
                          { $eq: ["$list_type", "liked"] },
                        ],
                      },
                    },
                  },
                ],
                as: "userLikes",
              },
            },
            { $match: { userLikes: { $ne: [] } } },
            { $count: "total" },
          ],
          history: [
            {
              $lookup: {
                from: "useractivitylists",
                let: { activityId: "$_id" },
                pipeline: [
                  {
                    $match: {
                      $expr: {
                        $and: [
                          { $eq: ["$activity_id", "$$activityId"] },
                          { $eq: ["$user_id", new mongoose.Types.ObjectId(userId)] },
                          { $eq: ["$list_type", "history"] },
                        ],
                      },
                    },
                  },
                ],
                as: "userHistory",
              },
            },
            { $match: { userHistory: { $ne: [] } } },
            { $count: "total" },
          ],
          avgRatingGiven: [
            {
              $lookup: {
                from: "reviews",
                localField: "_id",
                foreignField: "activity_id",
                as: "reviews",
              },
            },
            {
              $addFields: {
                userReviews: {
                  $filter: {
                    input: "$reviews",
                    as: "review",
                    cond: {
                      $eq: [
                        "$$review.user_id",
                        new mongoose.Types.ObjectId(userId),
                      ],
                    },
                  },
                },
              },
            },
            {
              $group: {
                _id: null,
                avg: {
                  $avg: {
                    $cond: [
                      { $gt: [{ $size: "$userReviews" }, 0] },
                      { $avg: "$userReviews.ranking" },
                      null,
                    ],
                  },
                },
              },
            },
          ],
          avgRatingReceived: [
            { $match: { user_id: new mongoose.Types.ObjectId(userId) } },
            {
              $lookup: {
                from: "reviews",
                localField: "_id",
                foreignField: "activity_id",
                as: "reviews",
              },
            },
            {
              $group: {
                _id: null,
                avg: {
                  $avg: {
                    $cond: [
                      { $gt: [{ $size: "$reviews" }, 0] },
                      { $avg: "$reviews.ranking" },
                      null,
                    ],
                  },
                },
              },
            },
          ],
        },
      },
    ]);

    const result = {
      createdActivities: stats[0].createdActivities[0]?.total || 0,
      postedReviews: stats[0].postedReviews[0]?.total || 0,
      favorites: stats[0].favorites[0]?.total || 0,
      history: stats[0].history[0]?.total || 0,
      avgRatingGiven: stats[0].avgRatingGiven[0]?.avg || 0,
      avgRatingReceived: stats[0].avgRatingReceived[0]?.avg || 0,
    };

    return ok(res, result);
  } catch (error) {
    next(error);
  }
}

// 5️⃣ NEARBY ACTIVITIES (GEOSPATIAL)
export async function nearbyActivities(req, res, next) {
  try {
    const { lat, lng, distance } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ error: "lat and lng are required" });
    }

    const maxDistance = parseInt(distance) || 5;
    const longitude = parseFloat(lng);
    const latitude = parseFloat(lat);

    const nearby = await Activity.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [longitude, latitude],
          },
          distanceField: "distance",
          maxDistance: maxDistance * 1000, // Convert km to meters
          spherical: true,
        },
      },
      {
        $lookup: {
          from: "reviews",
          localField: "_id",
          foreignField: "activity_id",
          as: "reviews",
        },
      },
      {
        $addFields: {
          avgRating: {
            $cond: [
              { $gt: [{ $size: "$reviews" }, 0] },
              { $avg: "$reviews.ranking" },
              0,
            ],
          },
          nbReviews: { $size: "$reviews" },
          distanceKm: { $divide: ["$distance", 1000] },
        },
      },
      {
        $project: {
          _id: 1,
          title: 1,
          description: 1,
          location: 1,
          mood: 1,
          price_range: 1,
          distanceKm: { $round: ["$distanceKm", 2] },
          avgRating: { $round: ["$avgRating", 1] },
          nbReviews: 1,
          source: 1,
        },
      },
      { $limit: 20 },
    ]);

    return ok(res, { items: nearby });
  } catch (error) {
    next(error);
  }
}
