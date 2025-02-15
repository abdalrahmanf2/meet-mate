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
import type { Server, Socket } from "socket.io";
import type { ConsumerAppData } from "types/media-soup.ts";

class Client {
  public userId: string;
  public meetingId: string;
  public producers: Map<string, Producer>;
  public consumers: Consumer<ConsumerAppData>[];
  private deviceRtpCaps: RtpCapabilities;
  public socket: Socket;
  private io: Server;
  private router: Router<RouterAppData>;
  private sendTrans: WebRtcTransport | undefined;
  private recvTrans: WebRtcTransport | undefined;

  constructor(
    userId: string,
    meetingId: string,
    deviceRtpCaps: RtpCapabilities,
    socket: Socket,
    io: Server,
    router: Router<RouterAppData>
  ) {
    this.userId = userId;
    this.meetingId = meetingId;
    this.deviceRtpCaps = deviceRtpCaps;
    this.router = router;
    this.socket = socket;
    this.io = io;
    this.producers = new Map<string, Producer>();
    this.consumers = [];

    this.socket.on("meeting:producer-pause", async (producerId: string) => {
      const producer = this.producers.get(producerId);
      if (!producer) {
        return;
      }

      await producer.pause();
    });

    this.socket.on("meeting:producer-resume", async (producerId: string) => {
      const producer = this.producers.get(producerId);
      if (!producer) {
        return;
      }

      await producer.resume();
    });
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

      producer.on("transportclose", () => {
        this.socket.emit("meeting:producer-transport-close", producer.id);
      });

      if (!producer) {
        throw new Error("Producer couldn't be created");
      }

      this.producers.set(producer.id, producer);

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
      // skip if it's the same user
      if (client.userId === this.userId) continue;

      // It's Usually 1-3 Producers per client so it's ok to nest a loop here
      for (const producer of client.producers.values()) {
        await this.addConsumer(client.userId, producer);
      }
    }
  }

  /**
   * Add a new consumer.
   * Usage: when a new client connects to the meeting
   */
  async addConsumer(userId: string, producer: Producer) {
    try {
      if (!this.recvTrans) {
        throw new Error("Receive transport not created");
      }

      // Check if a consumer for this producer already exists
      if (
        this.consumers.some((consumer) => consumer.producerId === producer.id)
      ) {
        console.log(
          `Consumer for producer ${producer.id} already exists for user ${this.userId}. Skipping.`
        );
        return; // Skip creating a new consumer
      }

      const initialConsumerOptions: ConsumerOptions<ConsumerAppData> = {
        producerId: producer.id,
        rtpCapabilities: this.deviceRtpCaps,
        paused: true,
        appData: { userId },
      };

      if (
        this.router.canConsume({
          producerId: producer.id,
          rtpCapabilities: this.deviceRtpCaps,
        })
      ) {
        const consumer = await this.recvTrans.consume<ConsumerAppData>(
          initialConsumerOptions
        );

        if (!consumer) {
          throw new Error(
            "Couldn't create a consumer for producer" + producer.id
          );
        }

        consumer.on("producerclose", () => {
          this.socket.emit("meeting:producer-close", producer.id);
        });

        consumer.on("transportclose", () => {
          this.socket.emit("meeting:consumer-transport-close", producer.id);
        });

        consumer.on("producerpause", () => {
          console.log("PAUSE PRODUCER");
          this.io
            .to(this.meetingId)
            .emit("meeting:consumer-pause", producer.id);
        });

        consumer.on("producerresume", () => {
          console.log("RESUME PRODUCER");
          this.io
            .to(this.meetingId)
            .emit("meeting:consumer-resume", producer.id);
        });

        const consumerOptions = {
          id: consumer.id,
          producerId: consumer.producerId,
          kind: consumer.kind,
          rtpParameters: consumer.rtpParameters,
          appData: {
            userId,
          },
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
    console.log("CLOSING TRANSPORTS");

    try {
      if (this.sendTrans && !this.sendTrans.closed) {
        console.log("SEND TRANS CLOSING");
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
