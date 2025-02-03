/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect } from "react";
import { io } from "socket.io-client";
import { Device } from "mediasoup-client";
import { RtpCapabilities } from "mediasoup-client/lib/RtpParameters";

const useMeeting = (meetingId: string) => {
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
          "meeting:create-transport"
        );
        const sendTransport = device.createSendTransport(sendTransportOptions);

        // Subscribe to connect and produce events
        sendTransport.on("connect", ({ dtlsParameters }, cb, errback) => {
          console.log(dtlsParameters);
        });
        sendTransport.on("produce", () => console.log("producing"));

        // const producer = sendTransport.produce();

        // Recieve Transport
        const recieveTransportOptions = await socket.emitWithAck(
          "meeting:create-transport"
        );
        const recvTransport = device.createRecvTransport(
          recieveTransportOptions
        );

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
