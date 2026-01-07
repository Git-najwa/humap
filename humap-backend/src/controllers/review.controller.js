import Review from "../models/Review.js";
import User from "../models/User.js";
import Activity from "../models/Activity.js";
import { created, ok } from "../utils/responses.js";
import { NotFoundError, ForbiddenError } from "../utils/errors.js";
import { getIO } from "../server.js";

export async function listReviews(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(parseInt(req.query.limit || "10", 10), 100);
    const skip = (page - 1) * limit;
    const query = { activity_id: req.params.activityId };

    const [items, total] = await Promise.all([
      Review.find(query)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .populate("user_id", "username avatar")
        .lean(),
      Review.countDocuments(query),
    ]);

    const normalized = items.map((review) => ({
      ...review,
      user: review.user_id
        ? {
          id: review.user_id._id,
          username: review.user_id.username,
          avatar: review.user_id.avatar,
        }
        : null,
      user_id: review.user_id?._id || review.user_id,
    }));

    return ok(res, { page, limit, total, items: normalized });
  } catch (error) {
    next(error);
  }
}

export async function createReview(req, res, next) {
  try {
    const review = await Review.create({
      ...req.body,
      activity_id: req.params.activityId,
      user_id: req.currentUserId,
    });
    await User.findByIdAndUpdate(req.currentUserId, { $inc: { nb_reviews: 1 } });
    const populated = await Review.findById(review._id).populate("user_id", "username avatar");
    const payload = populated
      ? {
        ...populated.toObject(),
        user: populated.user_id
          ? {
            id: populated.user_id._id,
            username: populated.user_id.username,
            avatar: populated.user_id.avatar,
          }
          : null,
        user_id: populated.user_id?._id || populated.user_id,
      }
      : review;
    
    // Notifier le créateur de l'activité (si ce n'est pas lui-même qui commente)
    const io = getIO();
    if (io) {
      const activity = await Activity.findById(req.params.activityId);
      const activityOwnerId = activity?.user_id?.toString();
      
      if (activityOwnerId && activityOwnerId !== req.currentUserId) {
        const reviewer = await User.findById(req.currentUserId);
        io.to(`user:${activityOwnerId}`).emit("notification:comment", {
          activityId: activity._id,
          activityTitle: activity.title,
          reviewerUsername: reviewer?.username || "Quelqu'un",
          reviewId: review._id,
        });
      }
    }
    
    return created(res, payload);
  } catch (error) {
    next(error);
  }
}

export async function getReview(req, res, next) {
  try {
    const review = await Review.findById(req.params.id).populate("user_id", "username avatar");
    if (!review) {
      throw new NotFoundError("Review");
    }
    const payload = {
      ...review.toObject(),
      user: review.user_id
        ? {
          id: review.user_id._id,
          username: review.user_id.username,
          avatar: review.user_id.avatar,
        }
        : null,
      user_id: review.user_id?._id || review.user_id,
    };
    return ok(res, payload);
  } catch (error) {
    next(error);
  }
}

export async function deleteReview(req, res, next) {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      throw new NotFoundError("Review");
    }

    // Vérifier que l'utilisateur est propriétaire ou admin
    if (review.user_id.toString() !== req.currentUserId && req.user?.role !== "admin") {
      throw new ForbiddenError("You can only delete your own reviews");
    }

    await Review.findByIdAndDelete(req.params.id);
    await User.findByIdAndUpdate(review.user_id, { $inc: { nb_reviews: -1 } });
    return res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function updateReview(req, res, next) {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      throw new NotFoundError("Review");
    }

    if (review.user_id.toString() !== req.currentUserId && req.user?.role !== "admin") {
      throw new ForbiddenError("You can only update your own reviews");
    }

    const updates = {};
    if (typeof req.body.comment !== "undefined") updates.comment = req.body.comment;
    if (typeof req.body.ranking !== "undefined") updates.ranking = req.body.ranking;
    if (typeof req.body.pictures !== "undefined") updates.pictures = req.body.pictures;

    const updated = await Review.findByIdAndUpdate(review._id, updates, {
      new: true,
      runValidators: true,
    }).populate("user_id", "username avatar");

    const payload = updated
      ? {
        ...updated.toObject(),
        user: updated.user_id
          ? {
            id: updated.user_id._id,
            username: updated.user_id.username,
            avatar: updated.user_id.avatar,
          }
          : null,
        user_id: updated.user_id?._id || updated.user_id,
      }
      : updated;

    return ok(res, payload);
  } catch (error) {
    next(error);
  }
}
