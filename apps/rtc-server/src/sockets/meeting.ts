import { getLeastLoadedWorker } from "../services/media-soup.ts";
import type { Server, Socket } from "socket.io";
import Meeting from "../models/Meeting.ts";
import { routerConfig } from "../config/mediasoup.ts";
import type { Router } from "mediasoup/node/lib/types.js";
import type { RouterAppData } from "../types/media-types.ts";

export const meetings = new Map<string, Meeting>();

export const meetingHandler = async (io: Server, socket: Socket) => {
  const meetingId = socket.handshake.query.meetingId as string;
  const userId = socket.handshake.query.userId as string;

  const meeting = await getMeeting(meetingId);

  const onJoinMeeting = async () => {
    // Joins the room of sockets related to that meeting
    socket.join(meetingId);

    // Notify all clients that a new client has joined
    socket.to(meetingId).emit("meeting:new-client-joined", () => {});

    const deviceRtpCaps = await socket.emitWithAck(
      "meeting:rtp-capabilities",
      meeting.router.rtpCapabilities
    );

    // Add the new client that just has joined
    console.log("USER ID", userId);
    meeting.addClient(userId, deviceRtpCaps, socket);

    socket.emit("meeting:establish-conn");
  };

  const leaveMeeting = () => {
    console.log("SOMEONE LEFT");
    meeting.cleanup(userId);

    if (meeting.clientsCount === 0) {
      console.log("MEETING IS EMPTY");

      try {
        meeting.router.close();
        meeting.worker.appData.load--;
        meetings.delete(meetingId);
      } catch (error) {
        console.error("Error cleaning up meeting:", error);
      }
    }

    // Notify other clients about the disconnection
    socket.to(meetingId).emit("meeting:client-disconnected", socket.id);
  };

  socket.on("meeting:join", onJoinMeeting);
  socket.on("disconnect", leaveMeeting);
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
