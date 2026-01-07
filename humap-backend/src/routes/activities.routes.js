import express from "express";
import { createActivity, getActivity, listActivities, updateActivity, deleteActivity, toggleLike, removeLike, statsByMood, topRatedActivities, mostLikedActivities, getUserStats, statsByUser, nearbyActivities, recommendations } from "../controllers/activity.controller.js";
import auth from "../middlewares/auth.js";

const router = express.Router();

// AGRÉGATIONS (avant les routes paramétrées)
router.get("/stats/by-mood", statsByMood);
router.get("/stats/by-user", statsByUser);
router.get("/top-rated", topRatedActivities);
router.get("/most-liked", mostLikedActivities);
router.get("/nearby", nearbyActivities);
router.get("/near", nearbyActivities);
router.get("/recommendations", recommendations);

// CRUD
router.get("/", listActivities);
router.get("/:id", getActivity);
router.post("/", auth, createActivity);
router.patch("/:id", auth, updateActivity);
router.delete("/:id", auth, deleteActivity);
router.post("/:id/like", auth, toggleLike);
router.delete("/:id/like", auth, removeLike);

export default router;
