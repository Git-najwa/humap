import express from "express";
import auth from "../middlewares/auth.js";
import { listHistory, listLiked, listCustom } from "../controllers/list.controller.js";

const router = express.Router();

router.get("/activities/history", auth, listHistory);
router.get("/activities/liked", auth, listLiked);
router.get("/activities/custom", auth, listCustom);

export default router;
