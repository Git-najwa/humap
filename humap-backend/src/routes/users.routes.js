import express from "express";
import { getUser, updateUser, deleteUser } from "../controllers/user.controller.js";
import auth from "../middlewares/auth.js";

const router = express.Router();

router.get("/:id", getUser);
router.patch("/:id", auth, updateUser);
router.delete("/:id", auth, deleteUser);

export default router;