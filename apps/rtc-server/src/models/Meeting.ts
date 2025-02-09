import type { Router } from "mediasoup/node/lib/RouterTypes.js";
import Client from "./Client.ts";
import type { RouterAppData, WorkerAppData } from "../types/media-types.ts";
import type { Socket } from "socket.io";
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

  addClient(userId: string, deviceRtpCaps: RtpCapabilities, socket: Socket) {
    const client = new Client(userId, deviceRtpCaps, socket, this.router);

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

          // after creating an producer consume it in all clients
          for (const client of this.clients.values()) {
            if (client.userId !== userId) {
              // Don't consume in the same client
              await client.addConsumer(producer);
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

        // add the new client to the clients map.
        console.log("CLIENT:", userId);
        this.clients.set(userId, client);

        console.log(`Clients count: ${this.clients.size}`);
      } catch (error) {
        console.error("Error initializing consumers:", error);
      }
    });
  }

  async cleanup(userId: string) {
    const client = this.getClient(userId);
    if (!client) return;

    try {
      // Close all producers and notify other clients
      for (const producer of client.producers) {
        try {
          producer.close();
          // Notify other clients that this producer has been closed
          this.notifyProducerClosed(userId, producer.id);
        } catch (error) {
          console.error(`Error closing producer:`, error);
        }
      }

      // Close all consumers
      for (const consumer of client.consumers) {
        try {
          consumer.close();
        } catch (error) {
          console.error(`Error closing consumer:`, error);
        }
      }

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

  private notifyProducerClosed(closedUserId: string, producerId: string) {
    // Iterate through all other clients and notify them if they
    // were consuming from the closed client's producer.
    for (const [clientId, client] of this.clients) {
      if (clientId === closedUserId) continue;

      for (const consumer of client.consumers) {
        if (consumer.producerId === producerId) {
          // Send a message to this client to close the consumer
          client.socket.emit("meeting:producer-closed", {
            producerId: producerId,
          });

          try {
            consumer.close();
          } catch (error) {
            console.error(
              `Error closing consumer ${consumer.id} for client ${clientId}:`,
              error
            );
          }
        }
      }
      // Remove the consumer from the client's list of consumers
      client.consumers = client.consumers.filter(
        (consumer) => consumer.producerId !== producerId
      );
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
