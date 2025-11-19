import Review from "../models/Review.js";
import { created, ok } from "../utils/responses.js";
import { NotFoundError, ForbiddenError } from "../utils/errors.js";

export async function listReviews(req, res, next) {
  try {
    const reviews = await Review.find({ activity_id: req.params.activityId });
    return ok(res, reviews);
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
    return created(res, review);
  } catch (error) {
    next(error);
  }
}

export async function getReview(req, res, next) {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      throw new NotFoundError("Review");
    }
    return ok(res, review);
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
    return res.status(204).send();
  } catch (error) {
    next(error);
  }
}
