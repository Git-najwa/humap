import express from "express";
import { createActivity, getActivity, listActivities, updateActivity, deleteActivity, toggleLike } from "../controllers/activity.controller.js";
import auth from "../middlewares/auth.js";

const router = express.Router();

router.get("/", listActivities);
router.get("/:id", getActivity);
router.post("/", auth, createActivity);
router.patch("/:id", auth, updateActivity);
router.delete("/:id", auth, deleteActivity);
router.post("/:id/like", auth, toggleLike);

export default router;
