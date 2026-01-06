import express from "express";
import { createReview, getReview, listReviews, deleteReview, updateReview } from "../controllers/review.controller.js";
import auth from "../middlewares/auth.js";

const router = express.Router({ mergeParams: true });

router.get("/", listReviews);
router.get("/:id", getReview);
router.post("/", auth, createReview);
router.put("/:id", auth, updateReview);
router.delete("/:id", auth, deleteReview);

export default router;
