import express from "express";
import { createActivity, getActivity, listActivities } from "../controllers/activity.controller.js";
import auth from "../middlewares/auth.js";

const router = express.Router();

router.get("/", listActivities);
router.get("/:id", getActivity);
router.post("/", auth, createActivity);

export default router;
