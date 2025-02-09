import type { Server, Socket } from "socket.io";
import { meetingHandler } from "./meeting.ts";

export const onConnection = (io: Server, socket: Socket) => {
  console.log("a user connected:", socket.id);

  const meetingId = socket.handshake.query.meetingId as string;
  const userId = socket.handshake.query.userId as string;
  if (!meetingId || !userId) {
    console.error("No Meeting Id or User Id was provided");
    socket.disconnect(true);
    return;
  }

  meetingHandler(io, socket);
};
