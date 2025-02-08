/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { Device } from "mediasoup-client";
import { RtpCapabilities } from "mediasoup-client/lib/RtpParameters";
import { useMeetingStore } from "@/providers/meeting-store-provider";
import {
  Consumer,
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
  error: Error | null;
}

const SOCKET_SERVER_URL =
  process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || "http://localhost:3001";

const useMeeting = (userId: string, meetingId: string) => {
  const userMedia = useMeetingStore((state) => state.mediaStream);
  const [socket, setSocket] = useState<Socket>();
  const [state, setState] = useState<MeetingState>({
    device: null,
    producers: [],
    consumers: [],
    sendTransport: null,
    receiveTransport: null,
    isConnected: false,
    error: null,
  });
  const { toast } = useToast();

  // on joining the meeting
  useEffect(() => {
    const socket = io(SOCKET_SERVER_URL, {
      query: {
        meetingId,
        userId,
      },
    });
    setSocket(socket);

    const device = new Device();
    setState((prev) => ({ ...prev, device }));

    socket.on("connect", () => {
      socket.emit("meeting:join");
    });

    socket.on("meeting:new-client-joined", () => {
      toast({ title: "New client has joined the meeting" });
    });

    socket.on(
      "meeting:rtp-capabilities",
      async (
        rtpCapabilities: RtpCapabilities,
        ack: (deviceRtpCaps: RtpCapabilities) => void
      ) => {
        try {
          // if the device isn't loaded, load it.
          if (!device.loaded) {
            await device.load({ routerRtpCapabilities: rtpCapabilities });
          }
          ack(device.rtpCapabilities);
        } catch (error) {
          console.error("Error loading device:", error);
        }
      }
    );

    socket.on("meeting:establish-conn", async () => {
      try {
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
            errback(e as Error);
          }
        };

        // Send Transport
        if (!state.sendTransport) {
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
              errback(e as Error);
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
        }

        // Receive Transport
        if (!state.receiveTransport) {
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
          socket.on("meeting:new-consumer", async (consumerOptions) => {
            const consumer = await recvTransport.consume(consumerOptions);
            setState((prev) => ({
              ...prev,
              consumers: [...prev.consumers, consumer],
            }));
          });
          socket.emit("meeting:initialize-consumers");

          setState((prev) => ({ ...prev, receiveTransport: recvTransport }));
        }
      } catch (error) {
        console.error("Error establishing a connection:", error);
      }
    });

    return () => {
      socket.disconnect();

      for (const producer of state.producers) {
        producer.close();
      }

      state.sendTransport?.close();
      state.receiveTransport?.close();

      setState({
        device: null,
        producers: [],
        consumers: [],
        sendTransport: null,
        receiveTransport: null,
        isConnected: false,
        error: null,
      });
    };
  }, []);

  console.log("PRODUCERS:", state.producers);
  console.log("CONSUMERS:", state.consumers);

  return { ...state };
};

export default useMeeting;
