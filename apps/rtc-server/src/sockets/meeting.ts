import { getLeastLoadedWorker } from "../services/media-soup.ts";
import type { Server, Socket } from "socket.io";
import Meeting from "../models/Meeting.ts";
import { routerConfig } from "../config/mediasoup.ts";
import type { Router } from "mediasoup/node/lib/types.js";
import type { RouterAppData } from "../types/media-types.ts";

export const meetings = new Map<string, Meeting>();

export const meetingHandler = async (io: Server, socket: Socket) => {
  const meetingId = socket.handshake.query.meetingId as string;
  await socket.join(meetingId);

  // Current socket user's id.
  const userId = socket.handshake.query.userId as string;

  const meeting = await getMeeting(meetingId);

  const onJoinMeeting = async () => {
    // Joins the room of sockets related to that meeting
    console.log("SM1 JOINED");

    // Notify all clients that a new client has joined
    socket.to(meetingId).emit("meeting:new-client-join");

    const deviceRtpCaps = await socket.emitWithAck(
      "meeting:rtp-capabilities",
      meeting.router.rtpCapabilities
    );

    // Add the new client that just has joined
    meeting.addClient(userId, meetingId, deviceRtpCaps, socket, io);

    socket.emit("meeting:establish-conn");
  };

  const leaveMeeting = async () => {
    await meeting.cleanup(userId);
  };

  socket.on("meeting:join", onJoinMeeting);

  // Leave meeting manually or on disconnect
  socket.on("meeting:leave", async (ack: (left: boolean) => void) => {
    try {
      console.log("SOMEONE IS LEAVING");
      await leaveMeeting();
      ack(true);
    } catch {
      ack(false);
    }
  });

  socket.on("disconnect", async () => {
    console.log(userId, "Disconnect");
    await leaveMeeting();

    // Notify other clients about the disconnection
    socket.to(meetingId).emit("meeting:client-disconnect", userId);
  });
};

/**
 * Gets the meeting from the map otherwise it creates a new meeting instance.
 */
const getMeeting = async (meetingId: string) => {
  if (meetings.has(meetingId)) {
    console.log("MEETING EXIST");
    return meetings.get(meetingId) as Meeting;
  }

  const worker = getLeastLoadedWorker();
  const router = (await worker.createRouter(
    routerConfig
  )) as Router<RouterAppData>;

  worker.appData.load++;

  const meeting = new Meeting(meetingId, worker, router);
  meetings.set(meetingId, meeting);

  return meeting;
};
