import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useMeetingStore } from "@/providers/meeting-store-provider";
import {
  Camera,
  CameraIcon,
  CameraOff,
  Mic,
  MicOff,
  MicVocal,
  Video,
} from "lucide-react";
import { useRef } from "react";

const MeetingSetup = () => {
  const previewRef = useRef<HTMLVideoElement>(null);

  const mute = useMeetingStore((state) => state.mute);
  const muted = useMeetingStore((state) => state.muted);

  return (
    <div className="min-h-[calc(75vh)] flex flex-col items-center justify-center">
      <Card className="sm:min-w-[768px]">
        <CardHeader>
          <CardTitle className="text-xl">Meeting Setup</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-8 md:grid-cols-2">
          <AspectRatio
            ratio={16 / 9}
            className="flex items-center justify-center bg-muted rounded-lg"
          >
            {previewRef.current?.srcObject ? (
              <video ref={previewRef} />
            ) : (
              <div className="text-muted-foreground flex flex-col items-center gap-2">
                <CameraOff />
                <p>No Preview Available</p>
              </div>
            )}
          </AspectRatio>
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Video className="size-5" />
                  Webcam
                </div>
                <Switch />
              </div>
              <Select>
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      <div className="text-muted-foreground flex items-center gap-2">
                        <CameraIcon className="size-4" />
                        Choose a device
                      </div>
                    }
                  ></SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="device-1">Device 1</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div
                  className={cn(
                    "flex items-center gap-2",
                    muted && "opacity-50"
                  )}
                >
                  {muted ? (
                    <MicOff className="size-5" />
                  ) : (
                    <Mic className="size-5" />
                  )}
                  Microphone
                </div>
                <Switch
                  className="opacity-100"
                  checked={!muted}
                  onCheckedChange={mute}
                />
              </div>
              <Select disabled={muted}>
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      <div className="text-muted-foreground flex items-center gap-2">
                        <MicVocal className="size-4" />
                        Choose a device
                      </div>
                    }
                  ></SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="device-1">Device 1</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
        <CardFooter className="justify-end">
          <Button>Join Meeting</Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default MeetingSetup;
