import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { Server } from "socket.io";
import { PORT } from "./config/index.ts";
import { createMediaWorkers } from "./services/media-soup.ts";
import { onConnection } from "./sockets/connection.ts";
import { cors } from "hono/cors";
import "dotenv/config";

// Hono App
const app = new Hono();
app.use(
  "/socket.io/*",
  cors({
    origin: "http://localhost:3000",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Origin", "Content-Type", "Accept", "Authorization"],
    exposeHeaders: ["Content-Length", "X-Kuma-Revision"],
    credentials: true,
  })
);
app.get("/", (c) => {
  return c.text("Welcome to MeetMate WS Server");
});

// Socket.io Integration
const server = serve({
  fetch: app.fetch,
  port: PORT,
});

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

await createMediaWorkers();
io.on("connection", (socket) => onConnection(io, socket));

console.log(`Server is running on http://localhost:${PORT}`);
