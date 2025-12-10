import express from "express";
import {
  addToList,
  getListEntry,
  listUserActivities,
  updateList,
  deleteList,
  removeActivityFromList,
} from "../controllers/list.controller.js";
import auth from "../middlewares/auth.js";

const router = express.Router();

router.get("/", auth, listUserActivities);
router.post("/", auth, addToList);
router.get("/:listId", auth, getListEntry);
router.patch("/:listId", auth, updateList);
router.delete("/:listId", auth, deleteList);
router.post("/:listId/activities", auth, addToList);
router.delete("/:listId/activities/:activityId", auth, removeActivityFromList);

export default router;
