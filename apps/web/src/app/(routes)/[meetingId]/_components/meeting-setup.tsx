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
import useDeviceManager from "@/hooks/use-device-manager";
import { cn } from "@/lib/utils";
import { useMeetingStore } from "@/providers/meeting-store-provider";
import {
  CameraIcon,
  CameraOff,
  Mic,
  MicOff,
  MicVocal,
  Video,
  VideoOff,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";

const MeetingSetup = () => {
  const { audioDevices, videoDevices, initializeDevices, changeDevice, error } =
    useDeviceManager();

  const previewRef = useRef<HTMLVideoElement>(null);
  const [isPending, startTransition] = useTransition();

  const [audioInputId, setAudioInputId] = useState<string>();
  const [videoInputId, setVideoInputId] = useState<string>();

  const isThereAudioDevices = useMemo(
    () => audioDevices.length > 0,
    [audioDevices]
  );
  const isThereVideoDevices = useMemo(
    () => videoDevices.length > 0,
    [videoDevices]
  );

  const { mediaStream, ready, isMuted, toggleMute, isCamEnabled, toggleCam } =
    useMeetingStore((state) => state);

  useEffect(() => {
    startTransition(async () => {
      await initializeDevices();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    mediaStream?.getTracks().map((track) => {
      if (track.kind === "audio") {
        setAudioInputId(track.getSettings().deviceId);
      }

      if (track.kind === "video") {
        setVideoInputId(track.getSettings().deviceId);
        if (previewRef.current) {
          previewRef.current.srcObject = mediaStream!;
        }
      }
    });
  }, [mediaStream]);

  useEffect(() => {
    (async () => {
      await changeDevice(audioInputId, videoInputId);
    })();
  }, [audioInputId, videoInputId, changeDevice]);

  if (isPending || error) {
    return (
      <div className="min-h-[75vh] text-center flex items-center justify-center">
        <h1 className="text-muted-foreground text-2xl font-semibold">
          <Video className="m-auto size-20" />
          Please allow access to your media devices!
        </h1>
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(75vh)] flex flex-col items-center justify-center">
      <Card className="sm:min-w-[768px]">
        <CardHeader>
          <CardTitle className="text-xl">Meeting Setup</CardTitle>
        </CardHeader>
        <CardContent className="grid items-center gap-8 md:grid-cols-2">
          {/* Camera Settings */}
          <AspectRatio
            ratio={16 / 9}
            className="relative bg-muted rounded-lg overflow-hidden"
          >
            <video
              autoPlay
              muted
              playsInline
              className={cn(
                "absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2",
                !isCamEnabled && "hidden"
              )}
              ref={previewRef}
            />

            {!isCamEnabled && (
              <div className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2">
                <div className="size-full text-muted-foreground flex flex-col items-center gap-2">
                  <CameraOff />
                  <p>No Preview Available</p>
                </div>
              </div>
            )}
          </AspectRatio>
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div
                  className={cn(
                    "flex items-center gap-2",
                    !isCamEnabled && "opacity-50"
                  )}
                >
                  {isCamEnabled ? (
                    <Video className="size-5" />
                  ) : (
                    <VideoOff className="size-5" />
                  )}
                  Facecam
                </div>
                <Switch
                  className="opacity-100"
                  checked={isCamEnabled}
                  onCheckedChange={toggleCam}
                />
              </div>
              <Select
                disabled={!isThereVideoDevices}
                value={videoInputId}
                onValueChange={setVideoInputId}
              >
                <SelectTrigger>
                  <div className="text-isMuted-foreground flex items-center gap-2">
                    <CameraIcon className="size-4" />
                    <SelectValue placeholder={"Choose a device"}></SelectValue>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {videoDevices?.map((input) => (
                    <SelectItem key={input.deviceId} value={input.deviceId}>
                      {input.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Microphone Settings */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <div
                  className={cn(
                    "flex items-center gap-2",
                    isMuted && "opacity-50"
                  )}
                >
                  {isMuted ? (
                    <MicOff className="size-5" />
                  ) : (
                    <Mic className="size-5" />
                  )}
                  Microphone
                </div>
                <Switch
                  className="opacity-100"
                  checked={!isMuted}
                  onCheckedChange={toggleMute}
                />
              </div>
              <Select
                disabled={!isThereAudioDevices}
                value={audioInputId}
                onValueChange={setAudioInputId}
              >
                <SelectTrigger>
                  <div className="text-isMuted-foreground flex items-center gap-2">
                    <MicVocal className="size-4" />
                    <SelectValue placeholder={"Choose a device"}></SelectValue>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {audioDevices?.map((input) => (
                    <SelectItem key={input.deviceId} value={input.deviceId}>
                      {input.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
        <CardFooter className="justify-end">
          <Button onClick={ready}>Join Meeting</Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default MeetingSetup;
