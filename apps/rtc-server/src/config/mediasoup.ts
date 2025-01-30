import type { RouterOptions } from "mediasoup/node/lib/RouterTypes.js";
import type {
  WebRtcTransportOptions,
  WorkerSettings,
} from "mediasoup/node/lib/types.js";
import type { RouterAppData, WorkerAppData } from "../types/media-types.ts";

export const workerConfig: WorkerSettings<WorkerAppData> = {
  rtcMinPort: 10000,
  rtcMaxPort: 10100,
  logLevel: "warn",
  logTags: ["info", "ice", "dtls", "rtp", "srtp", "rtcp"],
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
  enableUdp: true,
  enableTcp: true,
  preferUdp: true,
  listenInfos: [
    {
      ip: "127.0.0.1",
      protocol: "udp",
    },
    {
      ip: "127.0.0.1",
      protocol: "tcp",
    },
  ],
};
