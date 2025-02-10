import type { RouterOptions } from "mediasoup/node/lib/RouterTypes.js";
import type {
  WebRtcTransportOptions,
  WorkerSettings,
} from "mediasoup/node/lib/types.js";
import type { RouterAppData, WorkerAppData } from "../types/media-types.ts";

export const workerConfig: WorkerSettings<WorkerAppData> = {
  logLevel: "debug",
  appData: {
    load: 0,
  },
};

export const routerConfig: RouterOptions<RouterAppData> = {
  mediaCodecs: [
    {
      kind: "audio",
      mimeType: "audio/opus",
      clockRate: 48000,
      channels: 2,
    },
    {
      kind: "video",
      mimeType: "video/VP8",
      clockRate: 90000,
      parameters: {
        "x-google-start-bitrate": 1000,
      },
    },
  ],
  appData: {
    clients: [],
  },
};

export const webRtcTransportConfig: WebRtcTransportOptions = {
  listenInfos: [
    {
      protocol: "udp",
      ip: process.env.MEDIASOUP_LISTEN_IP || "192.168.1.103",
      portRange: {
        min: 40000,
        max: 49999,
      },
    },
    {
      protocol: "tcp",
      ip: process.env.MEDIASOUP_LISTEN_IP || "192.168.1.103",
      portRange: {
        min: 40000,
        max: 49999,
      },
    },
  ],

  enableUdp: true, // Enable UDP (required)
  enableTcp: true, // Enable TCP (optional, but recommended)
  preferUdp: true, // Prefer UDP over TCP
};
