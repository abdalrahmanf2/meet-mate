"use client";

import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { Device } from "mediasoup-client";
import { RtpCapabilities } from "mediasoup-client/lib/RtpParameters";

const useMeeting = (meetingId: string) => {
  const [videoTrack, setVideoTrack] = useState<MediaStream | null>(null);

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
      (rtpCapabilities: RtpCapabilities) => {
        // if the device isn't loaded, load it.
        if (!device.loaded) {
          device.load({ routerRtpCapabilities: rtpCapabilities });
        }

        // Signal to the server for creating a send media transport.
        socket.emit("meetings:create-send-transport");
      }
    );

    return () => {};
  }, [meetingId]);

  return { videoTrack };
};

export default useMeeting;
