import mongoose from "mongoose";
import User from "../src/models/User.js";
import Activity from "../src/models/Activity.js";
import Review from "../src/models/Review.js";
import UserActivityList from "../src/models/UserActivityList.js";
import { buildAuthToken } from "../src/utils/jwt.js";

export async function cleanUpDatabase() {
  await Promise.all([
    User.deleteMany(),
    Activity.deleteMany(),
    Review.deleteMany(),
    UserActivityList.deleteMany(),
  ]);
}

export async function disconnectDb() {
  await mongoose.disconnect();
}

export async function generateTokenFor(user) {
  return buildAuthToken(user);
}
