import type { Router } from "mediasoup/node/lib/RouterTypes.js";
import type { RouterAppData } from "../types/media-types.ts";
import type {
  DtlsParameters,
  WebRtcTransport,
} from "mediasoup/node/lib/WebRtcTransportTypes.js";
import type {
  Consumer,
  ConsumerOptions,
  Producer,
  RtpCapabilities,
  RtpParameters,
} from "mediasoup/node/lib/types.js";
import { webRtcTransportConfig } from "../config/mediasoup.ts";
import type { TransportOptions } from "mediasoup-client/lib/types.js";
import type { Socket } from "socket.io";

class Client {
  public userId: string;
  public producers: Producer[];
  public consumers: Consumer[];
  private deviceRtpCaps: RtpCapabilities;
  public socket: Socket;
  private router: Router<RouterAppData>;
  private sendTrans: WebRtcTransport | undefined;
  private recvTrans: WebRtcTransport | undefined;

  constructor(
    userId: string,
    deviceRtpCaps: RtpCapabilities,
    socket: Socket,
    router: Router<RouterAppData>
  ) {
    this.userId = userId;
    this.deviceRtpCaps = deviceRtpCaps;
    this.router = router;
    this.socket = socket;
    this.producers = [];
    this.consumers = [];
  }

  /**
   * Creates a new transport based on it's type.
   */
  async createTrans(type: "send" | "receive") {
    let transport;

    if (type === "send") {
      this.sendTrans = await this.router.createWebRtcTransport(
        webRtcTransportConfig
      );
      transport = this.sendTrans;
    }

    if (type === "receive") {
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

  /**
   * Connects a transport to it's relevant client side transport (Send/Receive).
   */
  async connectTrans(dtlsParameters: DtlsParameters, type: "send" | "receive") {
    let transport = type === "send" ? this.sendTrans : this.recvTrans;

    if (!transport) {
      throw new Error(`${type} transport not created`);
    }

    if (transport.closed) {
      throw new Error(`${type} transport is closed`);
    }

    if (transport.dtlsParameters) {
      console.warn(`${type} transport is already connected`);
      return true; // Already connected
    }

    await transport.connect({ dtlsParameters });
    return true;
  }

  /**
   * Returns the id of the producer if the produce method succeded.
   */
  async createProducer(producerOptions: {
    rtpParameters: RtpParameters;
    kind: "audio" | "video";
  }) {
    try {
      if (!this.sendTrans) {
        throw new Error("Send transport not created");
      }

      const producer = await this.sendTrans.produce(producerOptions);

      if (!producer) {
        throw new Error("Producer couldn't be created");
      }

      this.producers.push(producer);

      return producer;
    } catch (e) {
      console.error(e);
    }
  }

  /**
   * Initialize a consumer for each client that's connected to this meeting
   */
  async initializeConsumers(clients: Client[]) {
    // Add the user id to the consumer's app data? I need it to identify users in the client side
    for (const client of clients) {
      // It's Usually 1-3 Producers per client so it's ok to nest a loop here
      for (const producer of client.producers) {
        await this.addConsumer(producer);
      }
    }
  }

  /**
   * Add a new consumer.
   * Usage: when a new client connects to the meeting
   */
  async addConsumer(producer: Producer) {
    try {
      if (!this.recvTrans) {
        throw new Error("Receive transport not created");
      }

      const initialconsumerOptions: ConsumerOptions = {
        producerId: producer.id,
        rtpCapabilities: this.deviceRtpCaps,
        paused: true,
      };

      if (this.router.canConsume(initialconsumerOptions)) {
        const consumer = await this.recvTrans.consume(initialconsumerOptions);

        if (!consumer) {
          throw new Error(
            "Couldn't create a consumer for producer" + producer.id
          );
        }

        const consumerOptions = {
          id: consumer?.id,
          producerId: consumer.producerId,
          kind: consumer.kind,
          rtpParameters: consumer.rtpParameters,
        };

        this.socket.emit("meeting:new-consumer", consumerOptions);

        this.consumers.push(consumer);
        return consumer;
      }
    } catch (error) {
      console.error("Error creating consumer:", error);
    }
  }

  async closeTransports() {
    try {
      if (this.sendTrans && !this.sendTrans.closed) {
        this.sendTrans.close();
      }
      if (this.recvTrans && !this.recvTrans.closed) {
        this.recvTrans.close();
      }
    } catch (error) {
      console.error("Error closing transports:", error);
    }
  }
}

export default Client;
