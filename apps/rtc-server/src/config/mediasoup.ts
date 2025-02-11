import type { RouterOptions } from "mediasoup/node/lib/RouterTypes.js";
import type {
  WebRtcTransportOptions,
  WorkerSettings,
} from "mediasoup/node/lib/types.js";
import type { RouterAppData, WorkerAppData } from "../types/media-types.ts";

export const workerConfig: WorkerSettings<WorkerAppData> = {
  logLevel: "debug",
  logTags: [
    "info",
    "ice",
    "dtls",
    "rtp",
    "srtp",
    "rtcp",
    "rtx",
    "bwe",
    "score",
    "simulcast",
    "svc",
    "sctp",
  ],
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
    {
      kind: "video",
      mimeType: "video/VP9",
      clockRate: 90000,
      parameters: {
        "profile-id": 2,
        "x-google-start-bitrate": 1000,
      },
    },
    {
      kind: "video",
      mimeType: "video/h264",
      clockRate: 90000,
      parameters: {
        "packetization-mode": 1,
        "profile-level-id": "4d0032",
        "level-asymmetry-allowed": 1,
        "x-google-start-bitrate": 1000,
      },
    },
    {
      kind: "video",
      mimeType: "video/h264",
      clockRate: 90000,
      parameters: {
        "packetization-mode": 1,
        "profile-level-id": "42e01f",
        "level-asymmetry-allowed": 1,
        "x-google-start-bitrate": 1000,
      },
    },
  ],
};

export const webRtcTransportConfig: WebRtcTransportOptions = {
  listenInfos: [
    {
      protocol: "udp",
      ip: process.env.MEDIASOUP_LISTEN_IP || "192.168.1.103",
      // announcedAddress: process.env.MEDIASOUP_ANNOUNCED_IP,
      portRange: {
        min: Number(process.env.MEDIASOUP_MIN_PORT) || 40000,
        max: Number(process.env.MEDIASOUP_MAX_PORT) || 49999,
      },
    },
    {
      protocol: "tcp",
      ip: process.env.MEDIASOUP_LISTEN_IP || "192.168.1.103",
      // announcedAddress: process.env.MEDIASOUP_ANNOUNCED_IP,
      portRange: {
        min: Number(process.env.MEDIASOUP_MIN_PORT) || 40000,
        max: Number(process.env.MEDIASOUP_MAX_PORT) || 49999,
      },
    },
  ],

  enableUdp: true, // Enable UDP (required)
  enableTcp: true, // Enable TCP (optional, but recommended)
  preferUdp: true, // Prefer UDP over TCP
};
