import "dotenv/config";
import createDebugger from "debug";
import http from "node:http";

import app from "./app.js";
import { connectDb } from "./config/db.js";

const debug = createDebugger("humap:server");
const port = normalizePort(process.env.PORT || 3000);

async function start() {
  await connectDb();

  const server = http.createServer(app);
  server.listen(port);
  server.on("error", onError);
  server.on("listening", () => {
    const addr = server.address();
    const bind = typeof addr === "string" ? `pipe ${addr}` : `port ${addr.port}`;
    debug(`Listening on ${bind}`);
  });
}

start().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Server failed to start:", err);
  process.exit(1);
});

function normalizePort(val) {
  const portNumber = parseInt(val, 10);
  if (Number.isNaN(portNumber)) return val;
  if (portNumber >= 0) return portNumber;
  return false;
}

function onError(error) {
  if (error.syscall !== "listen") throw error;
  const bind = typeof port === "string" ? `Pipe ${port}` : `Port ${port}`;
  switch (error.code) {
    case "EACCES":
      // eslint-disable-next-line no-console
      console.error(`${bind} requires elevated privileges`);
      process.exit(1);
    case "EADDRINUSE":
      // eslint-disable-next-line no-console
      console.error(`${bind} is already in use`);
      process.exit(1);
    default:
      throw error;
  }
}
