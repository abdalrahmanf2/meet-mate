"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { Device } from "mediasoup-client";
import { RtpCapabilities } from "mediasoup-client/lib/RtpParameters";
import { useMeetingStore } from "@/providers/meeting-store-provider";
import {
  Consumer,
  ConsumerOptions,
  DtlsParameters,
  Producer,
  Transport,
} from "mediasoup-client/lib/types";
import { useToast } from "./use-toast";
import type { ConsumerAppData } from "types/media-soup.ts";
import { Client } from "@/types/media-soup";

interface Connection {
  connected: boolean;
  transport: Transport | null;
}

interface MeetingState {
  device: Device | null;
  producers: Map<string, Producer>;
  consumers: Map<string, Client>;
  send: Connection;
  receive: Connection;
  isConnected: boolean;
  isReconnecting: boolean;
}

const SOCKET_SERVER_URL =
  process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || "http://localhost:3001";

const useMeeting = (userId: string, meetingId: string) => {
  const mediaStream = useMeetingStore((state) => state.mediaStream);

  const [error, setError] = useState<Error>();
  const [state, setState] = useState<MeetingState>({
    device: null,
    producers: new Map<string, Producer>(),
    consumers: new Map<string, Client>(),
    send: {
      connected: false,
      transport: null,
    },
    receive: {
      connected: false,
      transport: null,
    },
    isConnected: false,
    isReconnecting: false,
  });
  const { toast } = useToast();

  // Use a ref to hold the consumers map
  const consumersRef = useRef<Map<string, Consumer<ConsumerAppData>>>(
    new Map()
  );

  const handleError = useCallback(
    (e: Error, message?: string) => {
      console.error(message || "An error occurred:", e);
      setError(e);
      toast({
        title: "Error",
        description: message || e.message,
        variant: "destructive",
      });
    },
    [toast]
  );

  const setupSocket = useCallback(
    (userId: string, meetingId: string) => {
      const socket = io(SOCKET_SERVER_URL, {
        query: {
          meetingId,
          userId,
        },
      });

      socket.on("connect", () => {
        socket.emit("meeting:join");
      });

      socket.on("meeting:new-client-join", () => {
        toast({ title: "New client has joined the meeting" });
      });

      socket.on("disconnect", (reason) => {
        toast({ title: "Disconnected", description: reason });
      });

      socket.on("reconnect", (attemptNumber) => {
        toast({ title: `Reconnected after ${attemptNumber} attemps` });
      });

      socket.on("reconnecting", (attemptNumber) => {
        toast({
          title: "Attempting to reconnect",
          description: `Attempt ${attemptNumber}`,
        });
        setState((prev) => ({ ...prev, isReconnecting: true }));
      });

      socket.on("error", (error) => {
        handleError(error, "Connection error");
      });

      return socket;
    },
    [toast, handleError]
  );

  const loadDevice = useCallback(
    (socket: Socket, device: Device) => {
      const handleRtpCapabilties = async (
        rtpCapabilities: RtpCapabilities,
        ack: (deviceRtpCaps: RtpCapabilities) => void
      ) => {
        try {
          if (!device.loaded) {
            await device.load({ routerRtpCapabilities: rtpCapabilities });
          }

          ack(device.rtpCapabilities);
        } catch (e) {
          handleError(
            e as Error,
            "Something wrong happened loading the device"
          );
        }
      };

      socket.on("meeting:rtp-capabilities", handleRtpCapabilties);
    },
    [handleError]
  );

  const setupTransports = useCallback(
    (socket: Socket, device: Device) => {
      const onConnectTransport = async (
        type: "send" | "receive",
        { dtlsParameters }: { dtlsParameters: DtlsParameters },
        cb: () => void,
        errback: (e: Error) => void
      ) => {
        try {
          const success = await socket.emitWithAck("meeting:connect-trans", {
            dtlsParameters,
            type,
          });

          if (!success) {
            throw new Error("Couldn't connect to the server");
          }

          cb();
        } catch (e) {
          if (e instanceof Error) {
            errback(e);
            handleError(e, e.message);
          } else {
            // Handle non-Error objects (if any)
            handleError(new Error(String(e)), "onConnectTransport failed");
          }
        }
      };

      const setupSendTransport = async () => {
        try {
          const sendTransportOptions = await socket.emitWithAck(
            "meeting:create-transport",
            { type: "send" }
          );
          if (!sendTransportOptions) {
            throw new Error("Couldn't get send transport options");
          }
          const sendTransport =
            device.createSendTransport(sendTransportOptions);

          sendTransport.on("connect", async (...params) => {
            await onConnectTransport("send", ...params);
            setState((prev) => ({
              ...prev,
              send: { connected: true, transport: sendTransport },
            }));
          });

          sendTransport.on("produce", async (parameters, cb, errback) => {
            try {
              const serverProducerId = await socket.emitWithAck(
                "meeting:create-producer",
                {
                  rtpParameters: parameters.rtpParameters,
                  kind: parameters.kind,
                }
              );

              if (!serverProducerId) {
                throw new Error("Couldn't get the server side producer id");
              }

              cb({ id: serverProducerId });
            } catch (e) {
              if (e instanceof Error) {
                errback(e);
                handleError(e, e.message);
              } else {
                handleError(new Error(String(e)), "produce failed");
              }
            }
          });

          return sendTransport;
        } catch (e) {
          if (e instanceof Error) {
            handleError(e, e.message);
          } else {
            handleError(new Error(String(e)), "setupSendTransport failed");
          }

          return null;
        }
      };

      const setupReceiveTransport = async () => {
        try {
          const receiveTransportOptions = await socket.emitWithAck(
            "meeting:create-transport",
            { type: "receive" }
          );
          if (!receiveTransportOptions) {
            throw new Error("Couldn't get receive transport options");
          }
          const receiveTransport = device.createRecvTransport(
            receiveTransportOptions
          );

          receiveTransport.on("connect", async (...params) => {
            await onConnectTransport("receive", ...params);
            setState((prev) => ({
              ...prev,
              receive: { connected: true, transport: receiveTransport },
            }));
          });

          return receiveTransport; // Return the recvTransport
        } catch (e) {
          if (e instanceof Error) {
            handleError(e, e.message);
          } else {
            handleError(new Error(String(e)), "setupRecvTransport failed");
          }
          return null; // Return null in case of error
        }
      };

      return { setupSendTransport, setupReceiveTransport };
    },
    [handleError]
  );

  const setupProducers = useCallback(
    async (
      socket: Socket,
      sendTransport: Transport,
      userMedia: MediaStream
    ) => {
      const producers: Producer[] = [];
      const tracks = userMedia?.getTracks() || [];

      try {
        for (const track of tracks) {
          const producer = await sendTransport.produce({ track });
          producers.push(producer);
        }

        setState((prev) => {
          const updatedProducers = new Map(prev.producers);

          for (const producer of producers) {
            updatedProducers.set(producer.id, producer);
          }

          return { ...prev, producers: updatedProducers };
        });
      } catch (e) {
        if (e instanceof Error) {
          handleError(e, e.message);
        } else {
          handleError(new Error(String(e)), "handleNewConsumer failed");
        }
      }

      socket.on("meeting:producer-transport-close", (producerId: string) => {
        const producer = state.producers.get(producerId);
        if (!producer) {
          return;
        }

        producer.close();
      });
    },
    [handleError, state.producers]
  );

  const setupConsumers = useCallback(
    (socket: Socket, receiveTransport: Transport) => {
      const handleNewConsumer = async (
        consumerOptions: ConsumerOptions<ConsumerAppData>
      ) => {
        try {
          if (!receiveTransport) {
            console.warn(
              "Receive transport is not connected yet. Deferring consumer creation."
            );
            setTimeout(() => handleNewConsumer(consumerOptions), 500);
            return;
          }

          const consumer: Consumer<ConsumerAppData> =
            await receiveTransport.consume(consumerOptions);

          const success = await socket.emitWithAck(
            "meeting:unpause-consumer",
            consumer.id
          );
          if (success) {
            consumer.resume();
          } else {
            throw new Error("Couldn't resume a consumer");
          }

          consumersRef.current.set(consumer.producerId, consumer); // Store the consumer in the ref

          setState((prev) => {
            const updatedConsumers = new Map(prev.consumers);
            const userConsumers =
              updatedConsumers.get(consumer.appData.userId) || {};

            userConsumers[consumer.kind] = consumer;
            updatedConsumers.set(consumer.appData.userId, userConsumers);

            return { ...prev, consumers: updatedConsumers };
          });
        } catch (e) {
          if (e instanceof Error) {
            handleError(e, e.message);
          } else {
            handleError(new Error(String(e)), "handleNewConsumer failed");
          }
        }
      };

      const handleClose = (producerId: string) => {
        const consumer = consumersRef.current.get(producerId);
        if (!consumer) {
          return;
        }

        console.log(`Closing consumer ${consumer.id}`);
        consumer.close();
        consumersRef.current.delete(producerId);

        // Remove the closed consumers
        setState((prev) => {
          const updatedConsumers = new Map(prev.consumers);

          updatedConsumers.forEach((client, key) => {
            let kind: keyof Client;
            const updatedClient = { ...client };

            for (kind in client) {
              if (client[kind]?.producerId !== producerId) {
                continue;
              }

              delete updatedClient[kind];
            }

            // if there's no entries in the client delete it
            if (Object.keys(client).length === 0) {
              updatedConsumers.delete(key);
            } else {
              updatedConsumers.set(key, updatedClient);
            }
          });

          return { ...prev, consumers: updatedConsumers };
        });
      };

      socket.on("meeting:new-consumer", handleNewConsumer);
      socket.on("meeting:producer-close", handleClose);
      socket.on("meeting:consumer-transport-close", handleClose);

      socket.emit("meeting:initialize-consumers");
    },
    [handleError]
  );

  // on joining the meeting
  useEffect(() => {
    const socket = setupSocket(userId, meetingId);

    const device = new Device();
    setState((prev) => ({ ...prev, device }));

    loadDevice(socket, device);

    if (!mediaStream) {
      toast({
        title: "Error",
        description: "Something went wrong with the initial setup",
        variant: "destructive",
      });
      return;
    }

    const userMedia = new MediaStream(mediaStream.getTracks());
    const { setupSendTransport, setupReceiveTransport } = setupTransports(
      socket,
      device
    );

    const initializeConsumers = async () => {
      const receiveTransport = await setupReceiveTransport();
      if (receiveTransport) {
        setupConsumers(socket, receiveTransport);
      }
    };

    const initializeProducers = async () => {
      const sendTransport = await setupSendTransport();

      if (sendTransport) {
        setupProducers(socket, sendTransport, userMedia);
      }
    };

    socket.on("meeting:establish-conn", async () => {
      try {
        await initializeProducers();
        await initializeConsumers();
        setState((prev) => ({ ...prev, isReconnecting: false }));
      } catch (e) {
        if (e instanceof Error) {
          handleError(e, "Error establishing a connection");
        } else {
          handleError(new Error(String(e)), "handleEstablishConn failed");
        }
      }
    });

    socket.on("meeting:client-disconnect", (userId: string) => {
      const updatedConsumers = new Map(state.consumers);
      updatedConsumers.delete(userId);

      setState((prev) => ({ ...prev, consumers: updatedConsumers }));
      // toast({ title: "Someone has left" });
    });

    return () => {
      console.log("Cleaning up useMeeting hook");

      (async () => {
        const left = await socket.emitWithAck("meeting:leave");

        if (left) {
          // Disconnect the socket *before* removing event listeners
          // socket.disconnect();
          //
          // socket.off("meeting:establish-conn");
          // socket.off("meeting:rtp-capabilities");
          // socket.off("meeting:initialize-consumer");
          // socket.off("meeting:new-consumer");
          // socket.off("meeting:producer-close");
          // socket.off("meeting:consumer-transport-close");
          // socket.off("meeting:producer-transport-close");
          // socket.off("meeting:new-client-join");
          // socket.off("meeting:client-disconnect");
          // socket.off("connect");
          // socket.off("disconnect");
          // socket.off("reconnect");
          // socket.off("reconnecting");
          // socket.off("error");
        }
      })();
    };
  }, []);

  console.log("PRODUCERS:", state.producers);

  return {
    clients: state.consumers,
    error,
    isConnected: state.isConnected,
    isReconnecting: state.isReconnecting,
  };
};

export default useMeeting;
