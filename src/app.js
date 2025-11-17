import express from "express";
import createError from "http-errors";
import logger from "morgan";

import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/users.routes.js";
import activityRoutes from "./routes/activities.routes.js";
import reviewRoutes from "./routes/reviews.routes.js";
import listRoutes from "./routes/lists.routes.js";
import errorHandler from "./middlewares/errorHandler.js";

const app = express();

if (process.env.NODE_ENV !== "test") {
  app.use(logger("dev"));
}
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/", (req, res) => res.send("Salut les bgs"));
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/activities", activityRoutes);
app.use("/activities/:activityId/reviews", reviewRoutes);
app.use("/lists", listRoutes);

app.use((req, res, next) => {
  next(createError(404, "Not Found"));
});

app.use(errorHandler);

export default app;
