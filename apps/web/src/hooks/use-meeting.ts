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

interface MeetingState {
  device: Device | null;
  producers: Producer[];
  consumers: Consumer[];
  sendTransport: Transport | null;
  receiveTransport: Transport | null;
  isConnected: boolean;
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
    consumers: [],
    sendTransport: null,
    receiveTransport: null,
    isConnected: false,
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

      return socket;
    },
    [toast]
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
        } catch (e) {
          if (e instanceof Error) {
            handleError(e, e.message);
          }
        }
      };

      return { setupSendTransport, setupRecvTransport };
    },
    [handleError]
  );

  const setupConsumers = useCallback(
    (socket: Socket) => {
      const handleNewConsumer = async (consumerOptions: ConsumerOptions) => {
        try {
          const recvTransport = state.receiveTransport;
          if (!recvTransport) {
            throw new Error("Receive transport is not initialized");
          }
          const consumer = await recvTransport.consume(consumerOptions);
          consumersRef.current.set(consumer.id, consumer); // Store the consumer in the ref
          setState((prev) => ({
            ...prev,
            consumers: [...prev.consumers, consumer],
          }));
        } catch (e) {
          if (e instanceof Error) {
            handleError(e, e.message);
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
            setState((prev) => ({
              ...prev,
              consumers: prev.consumers.filter((c) => c.id !== consumerId),
            }));
            // Optionally, update your UI to remove the video/audio track
          }
        });
      };

      socket.on("meeting:new-consumer", handleNewConsumer);
      socket.on("meeting:producer-closed", handleProducerClosed);

      socket.emit("meeting:initialize-consumers");
    },
    [handleError, state.receiveTransport]
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

    setupConsumers(newSocket);

    newSocket.on("meeting:establish-conn", async () => {
      try {
        await setupSendTransport();
        await setupRecvTransport();
      } catch (e) {
        if (e instanceof Error) {
          handleError(e, "Error establishing a connection");
        }
      }
    });

    return () => {
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
        consumers: [],
        sendTransport: null,
        receiveTransport: null,
        isConnected: false,
      });
    };
  }, []);

  console.log("PRODUCERS:", state.producers);
  console.log("CONSUMERS:", state.consumers);

  return { ...state };
};

export default useMeeting;
