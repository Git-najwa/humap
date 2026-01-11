import "dotenv/config";
import createDebugger from "debug";
import http from "node:http";
import { Server } from "socket.io";

const debug = createDebugger("humap:server");
let io;

async function start() {
  const port = normalizePort(process.env.PORT || 3000);
  // Use console log so it's visible even if DEBUG is not enabled.
  // eslint-disable-next-line no-console
  console.log(`Geoapify key loaded: ${process.env.GEOAPIFY_API_KEY ? "yes" : "no"}`);
  const [{ default: app }, { connectDb }, { setIO }] = await Promise.all([
    import("./app.js"),
    import("./config/db.js"),
    import("./utils/socket.js"),
  ]);
  await connectDb();

  const server = http.createServer(app);
  
  // Initialiser Socket.io
  const allowedOrigins = ["http://localhost:5173", "http://localhost:3000"];
  if (process.env.FRONTEND_URL) allowedOrigins.push(process.env.FRONTEND_URL);

  io = new Server(server, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
    },
  });
  
  // Stocker l'instance io dans le module partagé
  setIO(io);

  // Gérer les connexions
  io.on("connection", (socket) => {
    debug(`Client connecté: ${socket.id}`);
    
    // Permettre à un utilisateur de rejoindre sa room personnelle
    socket.on("join:user", (userId) => {
      if (userId) {
        socket.join(`user:${userId}`);
        debug(`Socket ${socket.id} a rejoint la room user:${userId}`);
      }
    });
    
    socket.on("disconnect", () => {
      debug(`Client déconnecté: ${socket.id}`);
    });
  });

  server.listen(port);
  server.on("error", (error) => onError(error, port));
  server.on("listening", () => {
    const addr = server.address();
    const bind = typeof addr === "string" ? `pipe ${addr}` : `port ${addr.port}`;
    debug(`Listening on ${bind}`);
    debug(`WebSocket prêt`);
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

function onError(error, port) {
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
