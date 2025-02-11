import { useEffect, useRef } from "react";

interface StreamProps {
  track: MediaStreamTrack;
  kind: "video" | "audio";
}

const Stream = ({ track, kind }: StreamProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    let mediaStream: MediaStream | null = null;
    const video = videoRef.current;
    const audio = audioRef.current;
    console.log("Track Info:", {
      kind: track.kind,
      readyState: track.readyState,
      enabled: track.enabled,
      id: track.id,
      label: track.label,
    });

    try {
      mediaStream = new MediaStream([track]);

      if (kind === "video" && video) {
        console.log("VIDEO OUT");
        video.srcObject = mediaStream;
      } else if (kind === "audio" && audio) {
        audio.srcObject = mediaStream;
      }
    } catch (e) {
      console.error("ERROR:", e);
    }

    return () => {
      if (video && kind === "video") {
        video.srcObject = null;
      }
      if (audio && kind === "audio") {
        audio.srcObject = null;
      }
      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [track, kind]);

  return (
    <>
      {kind === "video" ? (
        <>
          <p>video</p>
          <video ref={videoRef} autoPlay playsInline muted={false} />
        </>
      ) : (
        <audio ref={audioRef} autoPlay playsInline muted={false} />
      )}
    </>
  );
};

export default Stream;
