import { useMeetingStore } from "@/providers/meeting-store-provider";
import { useCallback, useState } from "react";

const useDeviceManager = () => {
  const [error, setError] = useState("");
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);

  const [audioInputId, setAudioInputId] = useState("");
  const [videoInputId, setVideoInputId] = useState("");

  const setMediaStream = useMeetingStore((state) => state.setMediaStream);

  const initializeDevices = useCallback(async () => {
    try {
      const userStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true,
      });
      setMediaStream(userStream);

      const devices = await navigator.mediaDevices.enumerateDevices();
      setAudioDevices(devices.filter((device) => device.kind === "audioinput"));
      setVideoDevices(devices.filter((device) => device.kind === "videoinput"));
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to access devices"
      );
    }
  }, [setMediaStream]);

  const changeDevice = useCallback(
    async (audioInputId?: string, videoInputId?: string) => {
      try {
        const userStream = await navigator.mediaDevices.getUserMedia({
          audio: { deviceId: audioInputId },
          video: { deviceId: videoInputId },
        });

        setMediaStream(userStream);
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Failed to access devices"
        );
      }
    },
    [setMediaStream]
  );

  return { audioDevices, videoDevices, initializeDevices, changeDevice, error };
};

export default useDeviceManager;
