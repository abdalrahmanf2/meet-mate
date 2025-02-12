"use client";
import { Button } from "@/components/ui/button";
import { useMeetingStore } from "@/providers/meeting-store-provider";
import { Mic, MicOff } from "lucide-react";

interface ControlsProps {
  toggleAudioProducer: () => void;
}

const Controls = ({ toggleAudioProducer }: ControlsProps) => {
  const isMuted = useMeetingStore((state) => state.isMuted);
  const toggleMute = useMeetingStore((state) => state.toggleMute);

  const handleMute = () => {
    toggleAudioProducer();
    toggleMute();
  };

  return (
    <div className="mb-4 absolute z-50 bottom-0 left-1/2 -translate-x-1/2">
      <div className="bg-card border rounded-2xl">
        <Button
          variant={isMuted ? "destructive" : "ghost"}
          className="rounded-lg"
          onClick={handleMute}
        >
          {isMuted ? (
            <MicOff className="stroke-red-500" />
          ) : (
            <Mic className="stroke-green-500" />
          )}
        </Button>
      </div>
    </div>
  );
};

export default Controls;
