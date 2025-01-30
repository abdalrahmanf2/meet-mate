import type { Router, Worker } from "mediasoup/node/lib/types.js";
import type { RouterAppData, WorkerAppData } from "../types/media-types.ts";
import { getRouter } from "../services/media-server.ts";
import type { Server, Socket } from "socket.io";
import { webRtcTransportConfig } from "../config/mediasoup.ts";

export const meetings = new Map<
  string,
  { worker: Worker<WorkerAppData>; router: Router<RouterAppData> }
>();

export const meetingHandler = async (io: Server, socket: Socket) => {
  const meetingId = socket.handshake.query.meetingId as string;
  const router = (await getRouter(meetingId)).router;

  const onJoinMeeting = async (meetingId: string) => {
    io.emit("meeting:rtp-capabilities", router.rtpCapabilities);
  };

  const onCreateSendTransport = async () => {
    const sendTransport = await router.createWebRtcTransport(
      webRtcTransportConfig
    );
  };

  socket.on("meeting:join", onJoinMeeting);
  socket.on("meeting:create-send-transport", onCreateSendTransport);
};
