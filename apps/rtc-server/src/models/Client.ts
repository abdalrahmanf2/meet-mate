import type { Router } from "mediasoup/node/lib/RouterTypes.js";
import type { RouterAppData } from "../types/media-types.ts";
import type { WebRtcTransport } from "mediasoup/node/lib/WebRtcTransportTypes.js";
import type { Consumer, Producer } from "mediasoup/node/lib/types.js";
import { webRtcTransportConfig } from "../config/mediasoup.ts";
import type {
  DtlsParameters,
  TransportOptions,
} from "mediasoup-client/lib/types.js";

class Client {
  private router: Router<RouterAppData>;
  private sendTrans: WebRtcTransport | undefined;
  private recvTrans: WebRtcTransport | undefined;
  private producers: Producer[];
  private consumers: Consumer[];

  constructor(router: Router<RouterAppData>) {
    this.router = router;
    this.producers = [];
    this.consumers = [];
  }

  async createTrans(type: "send" | "recieve") {
    let transport;

    if (type === "send") {
      this.sendTrans = await this.router.createWebRtcTransport(
        webRtcTransportConfig
      );
      transport = this.sendTrans;
    }

    if (type === "recieve") {
      this.recvTrans = await this.router.createWebRtcTransport(
        webRtcTransportConfig
      );
      transport = this.recvTrans;
    }

    if (transport) {
      const transportOptions: TransportOptions = {
        id: transport.id,
        iceParameters: transport.iceParameters,
        iceCandidates: transport.iceCandidates,
        dtlsParameters: transport.dtlsParameters,
      };

      return transportOptions;
    }

    return;
  }

  async connectTrans(dtlsParameters: DtlsParameters, type: "send" | "recieve") {
    if (type === "send" && this.sendTrans) {
      await this.sendTrans.connect({ dtlsParameters });
      return true;
    }

    if (type === "recieve" && this.recvTrans) {
      await this.recvTrans.connect({ dtlsParameters });
      return true;
    }

    return false;
  }
}

export default Client;
