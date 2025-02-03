import type { Router, Worker } from "mediasoup/node/lib/types.js";
import type { RouterAppData, WorkerAppData } from "../types/media-types.ts";
import { getRouter } from "../services/media-server.ts";
import type { Server, Socket } from "socket.io";
import { webRtcTransportConfig } from "../config/mediasoup.ts";
import type { TransportOptions } from "mediasoup-client/lib/types.js";

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

  const onDeviceReady = async () => {
    io.emit("meeting:establish-conn");
  };

  const onCreateTransport = async (ack: (e: TransportOptions) => void) => {
    const transport = await router.createWebRtcTransport(webRtcTransportConfig);

    const transportOptions: TransportOptions = {
      id: transport.id,
      iceParameters: transport.iceParameters,
      iceCandidates: transport.iceCandidates,
      dtlsParameters: transport.dtlsParameters,
    };

    // Send transport options to the client.
    ack(transportOptions);
  };

  socket.on("meeting:join", onJoinMeeting);
  socket.on("meeting:device-ready", onDeviceReady);
  socket.on("meeting:create-transport", onCreateTransport);
};
