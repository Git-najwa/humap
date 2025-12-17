import express from "express";
import { getUser, updateUser, deleteUser } from "../controllers/user.controller.js";
import { getUserStats } from "../controllers/activity.controller.js";
import auth from "../middlewares/auth.js";

const router = express.Router();

router.get("/:id", getUser);
router.get("/:userId/stats", getUserStats);
router.patch("/:id", auth, updateUser);
router.delete("/:id", auth, deleteUser);

export default router;