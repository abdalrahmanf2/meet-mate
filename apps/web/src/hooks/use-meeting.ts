/* eslint-disable react-hooks/exhaustive-deps */
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

interface MeetingState {
  device: Device | null;
  producers: Producer[];
  consumers: Map<string, Client>;
  sendTransport: Transport | null;
  receiveTransport: Transport | null;
  isConnected: boolean;
  isReconnecting: boolean;
}

const SOCKET_SERVER_URL =
  process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || "http://localhost:3001";

const useMeeting = (userId: string, meetingId: string) => {
  const userMedia = useMeetingStore((state) => state.mediaStream);
  const [socket, setSocket] = useState<Socket>();
  const [error, setError] = useState<Error>();
  const [state, setState] = useState<MeetingState>({
    device: null,
    producers: [],
    consumers: new Map<string, Client>(),
    sendTransport: null,
    receiveTransport: null,
    isConnected: false,
    isReconnecting: false,
  });
  const { toast } = useToast();

  // Use a ref to hold the consumers map
  const consumersRef = useRef<Map<string, Consumer>>(new Map());

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

      socket.on("meeting:new-client-joined", () => {
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
    (socket: Socket, device: Device, userMedia: MediaStream | undefined) => {
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

          sendTransport.on("connect", (...params) =>
            onConnectTransport("send", ...params)
          );
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

          // Initialize producers
          const producers: Producer[] = [];
          const tracks = userMedia?.getTracks() || [];
          for (const track of tracks) {
            const producer = await sendTransport.produce({ track });
            producers.push(producer);
          }

          setState((prev) => ({ ...prev, sendTransport, producers }));
        } catch (e) {
          if (e instanceof Error) {
            handleError(e, e.message);
          } else {
            handleError(new Error(String(e)), "setupSendTransport failed");
          }
        }
      };

      const setupRecvTransport = async () => {
        try {
          const receiveTransportOptions = await socket.emitWithAck(
            "meeting:create-transport",
            { type: "receive" }
          );
          if (!receiveTransportOptions) {
            throw new Error("Couldn't get receive transport options");
          }
          const recvTransport = device.createRecvTransport(
            receiveTransportOptions
          );

          recvTransport.on("connect", (...params) =>
            onConnectTransport("receive", ...params)
          );

          setState((prev) => ({ ...prev, receiveTransport: recvTransport }));
          return recvTransport; // Return the recvTransport
        } catch (e) {
          if (e instanceof Error) {
            handleError(e, e.message);
          } else {
            handleError(new Error(String(e)), "setupRecvTransport failed");
          }
          return null; // Return null in case of error
        }
      };

      return { setupSendTransport, setupRecvTransport };
    },
    [handleError]
  );

  const setupConsumers = useCallback(
    (socket: Socket, recvTransport: Transport) => {
      const handleNewConsumer = async (
        consumerOptions: ConsumerOptions<ConsumerAppData>
      ) => {
        try {
          if (!recvTransport) {
            console.warn(
              "Receive transport is not initialized yet.  Deferring consumer creation."
            );
            setTimeout(() => handleNewConsumer(consumerOptions), 500);
            return;
          }

          const consumer: Consumer<ConsumerAppData> =
            await recvTransport.consume(consumerOptions);

          // consumer.resume();
          // socket.emit("meeting:resume-consumer");

          consumersRef.current.set(consumer.id, consumer); // Store the consumer in the ref

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

      const handleProducerClosed = ({ producerId }: { producerId: string }) => {
        console.log(`Producer ${producerId} closed by server`);
        // Iterate through the consumers map and close the relevant consumer
        consumersRef.current.forEach((consumer, consumerId) => {
          if (consumer.producerId === producerId) {
            console.log(`Closing consumer ${consumerId}`);
            consumer.close();
            consumersRef.current.delete(consumerId);
          }
        });
      };

      socket.on("meeting:new-consumer", handleNewConsumer);
      socket.on("meeting:producer-closed", handleProducerClosed);

      socket.emit("meeting:initialize-consumers");
    },
    [handleError]
  );

  // on joining the meeting
  useEffect(() => {
    const newSocket = setupSocket(userId, meetingId);
    setSocket(newSocket);

    const device = new Device();
    setState((prev) => ({ ...prev, device }));

    loadDevice(newSocket, device);

    const { setupSendTransport, setupRecvTransport } = setupTransports(
      newSocket,
      device,
      userMedia
    );

    const initializeConsumers = async () => {
      const recvTransport = await setupRecvTransport();
      if (recvTransport) {
        setupConsumers(newSocket, recvTransport);
      }
    };

    newSocket.on("meeting:establish-conn", async () => {
      try {
        await setupSendTransport();
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

    newSocket.on("meeting:client-disconnected", (userId: string) => {
      const updatedConsumers = new Map(state.consumers);
      updatedConsumers.delete(userId);

      setState((prev) => ({ ...prev, consumers: updatedConsumers }));
      toast({ title: "Someone has left" });
    });

    return () => {
      newSocket.off("meeting:establish-conn");
      newSocket.off("meeting:rtp-capabilities");
      newSocket.off("meeting:new-consumer");
      newSocket.off("meeting:producer-closed");
      newSocket.off("meeting:client-disconnected");
      newSocket.off("connect");
      newSocket.off("disconnect");
      newSocket.off("reconnect");
      newSocket.off("reconnecting");
      newSocket.off("error");

      newSocket.disconnect();

      for (const producer of state.producers) {
        producer.close();
      }

      state.sendTransport?.close();
      state.receiveTransport?.close();

      // Close all consumers
      consumersRef.current.forEach((consumer) => {
        consumer.close();
      });
      consumersRef.current.clear();

      setState({
        device: null,
        producers: [],
        consumers: new Map<string, Client>(),
        sendTransport: null,
        receiveTransport: null,
        isConnected: false,
        isReconnecting: false,
      });
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
