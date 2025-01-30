import type { Server, Socket } from "socket.io";
import { meetingHandler } from "./meeting.ts";

export const onConnection = (io: Server, socket: Socket) => {
  console.log("a user connected:", socket.id);

  const meetingId = socket.handshake.query.meetingId as string;
  if (!meetingId) {
    console.error("No Meeting Id was provided");
    socket.disconnect(true);
    return;
  }

  meetingHandler(io, socket);
};
