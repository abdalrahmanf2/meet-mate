import type { Router, Worker } from "mediasoup/node/lib/types.js";
import type { RouterAppData, WorkerAppData } from "../types/media-types.ts";
import { getRouter } from "../services/media-server.ts";
import type { Server, Socket } from "socket.io";
import { webRtcTransportConfig } from "../config/mediasoup.ts";
import type { TransportOptions } from "mediasoup-client/lib/types.js";
import Meeting from "../models/Meeting.ts";

export const meetings = new Map<
  string,
  { worker: Worker<WorkerAppData>; router: Router<RouterAppData> }
>();

export const meetingHandler = async (io: Server, socket: Socket) => {
  const meetingId = socket.handshake.query.meetingId as string;
  const router = (await getRouter(meetingId)).router;
  const meeting = new Meeting(router);

  const onJoinMeeting = async (meetingId: string) => {
    socket.emit("meeting:rtp-capabilities", router.rtpCapabilities);

    // Add the new client that just has joined
    meeting.addClient(socket);
  };

  const onDeviceReady = async () => {
    socket.emit("meeting:establish-conn");
  };

  const onConnectWebRTCTrans = async (ack: (e: string) => void) => {};

  socket.on("meeting:join", onJoinMeeting);
  socket.on("meeting:device-ready", onDeviceReady);
};
