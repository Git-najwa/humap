import express from "express";
import createError from "http-errors";
import logger from "morgan";
import mongoose from 'mongoose';

import indexRouter from "./routes/index.js";
import usersRouter from "./routes/users.js";

import createDebugger from "debug";
import * as config from './config.js';

//--------------------------------------------------
const debug = createDebugger("humap:database");

const app = express();

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/", indexRouter);
app.use("/users", usersRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // Send the error status
  res.status(err.status || 500);
  res.send(err.message);
});


export default app;


  mongoose.connect(config.dbUrl)
  .then(() => debug("✅ MongoDB connecté"))
  .catch(err => debug("❌ Erreur de connexion MongoDB :", err));