import Review from "../models/Review.js";
import { created, notFound, ok } from "../utils/responses.js";

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
    if (!review) return notFound(res);
    return ok(res, review);
  } catch (error) {
    next(error);
  }
}
