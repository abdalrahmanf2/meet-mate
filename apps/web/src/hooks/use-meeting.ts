/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect } from "react";
import { io } from "socket.io-client";
import { Device } from "mediasoup-client";
import { RtpCapabilities } from "mediasoup-client/lib/RtpParameters";
import { useMeetingStore } from "@/providers/meeting-store-provider";

const useMeeting = (meetingId: string) => {
  const userMedia = useMeetingStore((state) => state.mediaStream);

  // on joining the meeting
  useEffect(() => {
    const socket = io("http://localhost:3001", {
      query: {
        meetingId,
      },
    });

    const device = new Device();

    socket.on("connect", () => {
      socket.emit("meeting:join");
    });

    socket.on(
      "meeting:rtp-capabilities",
      async (rtpCapabilities: RtpCapabilities) => {
        try {
          // if the device isn't loaded, load it.
          if (!device.loaded) {
            await device.load({ routerRtpCapabilities: rtpCapabilities });
          }

          // Signal to the server that the device is ready and loaded
          socket.emit("meeting:device-ready");
        } catch (error) {
          console.error("Error loading device:", error);
        }
      }
    );

    socket.on("meeting:establish-conn", async () => {
      try {
        // Send Transport
        const sendTransportOptions = await socket.emitWithAck(
          "meeting:create-transport",
          { type: "send" }
        );
        if (!sendTransportOptions) {
          throw new Error("Couldn't get send tranport options");
        }
        const sendTransport = device.createSendTransport(sendTransportOptions);

        // Recieve Transport
        const recieveTransportOptions = await socket.emitWithAck(
          "meeting:create-transport",
          { type: "recieve" }
        );
        if (!recieveTransportOptions) {
          throw new Error("Couldn't get recieve tranport options");
        }
        const recvTransport = device.createRecvTransport(
          recieveTransportOptions
        );

        // Subscribe to connect and produce events
        sendTransport.on("connect", async ({ dtlsParameters }, cb, errback) => {
          try {
            const success = await socket.emitWithAck("meeting:connect-trans", {
              dtlsParameters,
              type: "send",
            });

            if (!success) {
              throw new Error("Couldn't connect to the server");
            }

            cb();
          } catch (e) {
            errback(e as Error);
          }
        });
        sendTransport.on("produce", () => console.log("producing"));

        const producer = sendTransport.produce({
          track: userMedia?.getTracks()[0] as MediaStreamTrack,
        });

        // Subscribe to connect event
        recvTransport.on("connect", ({ dtlsParameters }, cb, errback) => {
          console.log(dtlsParameters);
        });
      } catch (error) {
        console.error("Error establishing a connection:", error);
      }
    });

    return () => {};
  }, []);

  return {};
};

export default useMeeting;
