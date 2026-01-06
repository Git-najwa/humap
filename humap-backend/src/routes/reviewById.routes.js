import express from "express";
import { getReview, updateReview, deleteReview } from "../controllers/review.controller.js";
import auth from "../middlewares/auth.js";

const router = express.Router();

router.get("/:id", getReview);
router.put("/:id", auth, updateReview);
router.delete("/:id", auth, deleteReview);

export default router;
