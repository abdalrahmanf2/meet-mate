import type { Router } from "mediasoup/node/lib/RouterTypes.js";
import Client from "./Client.ts";
import type { RouterAppData, WorkerAppData } from "../types/media-types.ts";
import type { Server, Socket } from "socket.io";
import type { TransportOptions } from "mediasoup-client/lib/types.js";
import type {
  RtpCapabilities,
  RtpParameters,
} from "mediasoup/node/lib/rtpParametersTypes.js";
import type { DtlsParameters } from "mediasoup/node/lib/WebRtcTransportTypes.js";
import type { Worker } from "mediasoup/node/lib/types.js";
import { meetings } from "../sockets/meeting.ts";

class Meeting {
  public id: string;
  public router: Router<RouterAppData>;
  public worker: Worker<WorkerAppData>;
  private clients: Map<string, Client>;

  constructor(
    id: string,
    worker: Worker<WorkerAppData>,
    router: Router<RouterAppData>
  ) {
    this.id = id;
    this.worker = worker;
    this.router = router;
    this.clients = new Map();
  }

  addClient(
    userId: string,
    meetingId: string,
    deviceRtpCaps: RtpCapabilities,
    socket: Socket,
    io: Server
  ) {
    const client = new Client(
      userId,
      meetingId,
      deviceRtpCaps,
      socket,
      io,
      this.router
    );

    // add the new client to the clients map.
    this.clients.set(userId, client);

    // Setup the transports
    socket.on(
      "meeting:create-transport",
      async ({ type }, ack: (payload?: TransportOptions) => void) => {
        try {
          const transportOptions = await client.createTrans(type);
          ack(transportOptions || undefined);
        } catch (error) {
          console.error("Error creating transport:", error);
          ack(undefined);
        }
      }
    );

    socket.on(
      "meeting:connect-trans",
      async (
        {
          dtlsParameters,
          type,
        }: { dtlsParameters: DtlsParameters; type: "send" | "receive" },
        ack: (success: boolean) => void
      ) => {
        try {
          const success = await client.connectTrans(dtlsParameters, type);
          ack(success);
        } catch (error) {
          console.error("Error connecting transport:", error);
          ack(false);
        }
      }
    );

    socket.on(
      "meeting:create-producer",
      async (
        producerOptions: {
          rtpParameters: RtpParameters;
          kind: "video" | "audio";
        },
        ack: (producerId?: string) => void
      ) => {
        try {
          const producer = await client.createProducer(producerOptions);

          if (!producer) {
            return;
          }

          producer.on("transportclose", () => {
            socket.emit("meeting:producer-closed", producer.id);
          });

          // after creating an producer consume it in all clients
          for (const client of this.clients.values()) {
            if (client.userId !== userId) {
              // Don't consume in the same client
              await client.addConsumer(userId, producer);
            }
          }

          ack(producer.id);
        } catch (error) {
          console.error("Error creating producer:", error);
          ack(undefined);
        }
      }
    );

    socket.on("meeting:initialize-consumers", async () => {
      try {
        await client.initializeConsumers([...this.clients.values()]);

        console.log(`Clients count: ${this.clients.size}`);
      } catch (error) {
        console.error("Error initializing consumers:", error);
      }
    });

    socket.on(
      "meeting:unpause-consumer",
      async (consumerId: string, ack: (successs: boolean) => void) => {
        const consumer = client.consumers.find(
          (consumer) => consumer.id === consumerId
        );

        if (!consumer) {
          ack(false);
        }

        await consumer?.resume();
        console.log("CONSUMER PAUSED", consumer?.id, consumer?.paused);
        ack(true);
      }
    );
  }

  async cleanup(userId: string) {
    const client = this.getClient(userId);
    if (!client) return;
    console.log("CLIENT", client?.userId);

    try {
      // Close Transports
      try {
        await client.closeTransports();
      } catch (error) {
        console.error(`Error closing transports:`, error);
      }

      // Remove client
      this.removeClient(userId);

      // Clean up meeting if no clients left
      if (this.clientsCount === 0) {
        this.cleanupMeeting();
      }
    } catch (error) {
      console.error(`Error in cleanup for user ${userId}:`, error);
    }
  }

  private cleanupMeeting() {
    console.log("MEETING IS EMPTY, CLEANING UP");

    try {
      this.router.close();
      this.worker.appData.load--;
      meetings.delete(this.id);
    } catch (error) {
      console.error("Error cleaning up meeting:", error);
    }
  }

  getClient(userId: string): Client | undefined {
    return this.clients.get(userId);
  }

  removeClient(userId: string) {
    this.clients.delete(userId);
  }

  get clientsCount(): number {
    return this.clients.size;
  }
}

export default Meeting;
