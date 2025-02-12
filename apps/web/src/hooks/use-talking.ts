import { useEffect, useState } from "react";
import hark from "hark";

const useTalking = (audio: MediaStreamTrack | undefined) => {
  const [isTalking, setIsTalking] = useState(false);

  useEffect(() => {
    if (!audio) return;

    const mediaStream = new MediaStream([audio]);

    const speechEvents = hark(mediaStream);
    speechEvents.on("speaking", () => {
      setIsTalking(true);
    });

    speechEvents.on("stopped_speaking", () => {
      setIsTalking(false);
    });
  }, [audio]);

  return { isTalking };
};

export default useTalking;
