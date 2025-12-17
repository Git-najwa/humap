import express from "express";
import { createActivity, getActivity, listActivities, updateActivity, deleteActivity, toggleLike, statsByMood, topRatedActivities, mostLikedActivities, getUserStats, nearbyActivities } from "../controllers/activity.controller.js";
import auth from "../middlewares/auth.js";

const router = express.Router();

// AGRÉGATIONS (avant les routes paramétrées)
router.get("/stats/by-mood", statsByMood);
router.get("/top-rated", topRatedActivities);
router.get("/most-liked", mostLikedActivities);
router.get("/nearby", nearbyActivities);

// CRUD
router.get("/", listActivities);
router.get("/:id", getActivity);
router.post("/", auth, createActivity);
router.patch("/:id", auth, updateActivity);
router.delete("/:id", auth, deleteActivity);
router.post("/:id/like", auth, toggleLike);

export default router;
