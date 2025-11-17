import express from "express";
import { addToList, getListEntry, listUserActivities } from "../controllers/list.controller.js";
import auth from "../middlewares/auth.js";

const router = express.Router();

router.get("/", auth, listUserActivities);
router.get("/:id", auth, getListEntry);
router.post("/", auth, addToList);

export default router;
