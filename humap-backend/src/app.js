import express from "express";
import createError from "http-errors";
import logger from "morgan";
import cors from "cors";

import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/users.routes.js";
import activityRoutes from "./routes/activities.routes.js";
import reviewRoutes from "./routes/reviews.routes.js";
import reviewByIdRoutes from "./routes/reviewById.routes.js";
import listRoutes from "./routes/lists.routes.js";
import errorHandler from "./middlewares/errorHandler.js";
import { swaggerUi, swaggerSpec } from "./utils/swagger.js";

const app = express();

if (process.env.NODE_ENV !== "test") {
  app.use(logger("dev"));
}

// CORS Configuration
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', process.env.FRONTEND_URL],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/", (req, res) => res.send("Salut les bgs"));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/activities", activityRoutes);
app.use("/activities/:activityId/reviews", reviewRoutes);
app.use("/reviews", reviewByIdRoutes);
app.use("/lists", listRoutes);

app.use((req, res, next) => {
  next(createError(404, "Not Found"));
});

app.use(errorHandler);

export default app;
