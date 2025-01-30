import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { Server } from "socket.io";
import { PORT } from "./config/index.ts";
import { createMediaWorkers } from "./services/media-server.ts";
import { onConnection } from "./sockets/connection.ts";

// Hono App
const app = new Hono();
app.get("/", (c) => {
  return c.text("Welcome to MeetMate WS Server");
});

// Socket.io Integration
const server = serve({
  fetch: app.fetch,
  port: PORT,
});
const io = new Server(server);

await createMediaWorkers();
io.on("connection", (socket) => onConnection(io, socket));

console.log(`Server is running on http://localhost:${PORT}`);
