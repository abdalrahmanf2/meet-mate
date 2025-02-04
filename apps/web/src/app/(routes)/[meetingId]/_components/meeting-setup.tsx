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
  CameraIcon,
  CameraOff,
  Mic,
  MicOff,
  MicVocal,
  Video,
  VideoOff,
} from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";

const MeetingSetup = () => {
  const previewRef = useRef<HTMLVideoElement>(null);
  const [isPending, startTransition] = useTransition();
  const [isError, setIsError] = useState(false);

  const [mediaStream, setMediaStream] = useState<MediaStream>();
  const [audioInputs, setAudioInputs] = useState<MediaDeviceInfo[]>();
  const [videoInputs, setVideoInputs] = useState<MediaDeviceInfo[]>();

  const [audioInputId, setAudioInputId] = useState("");
  const [videoInputId, setVideoInputId] = useState("");

  // Mic
  const isMuted = useMeetingStore((state) => state.isMuted);
  const toggleMute = useMeetingStore((state) => state.toggleMute);

  // Cam
  const isCamEnable = useMeetingStore((state) => state.isCamEnabled);
  const toggleCam = useMeetingStore((state) => state.toggleCam);

  useEffect(() => {
    startTransition(async () => {
      try {
        const userStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true,
        });
        setMediaStream(userStream);

        const devices = await navigator.mediaDevices.enumerateDevices();
        setAudioInputs(
          devices.filter((device) => device.kind === "audioinput")
        );
        setVideoInputs(
          devices.filter((device) => device.kind === "videoinput")
        );

        if (previewRef.current) {
          previewRef.current.srcObject = userStream;
        }
      } catch {
        setIsError(true);
      }
    });
  }, []);

  useEffect(() => {
    if (previewRef.current) {
      previewRef.current.srcObject = mediaStream!;
    }
  }, [mediaStream]);

  useEffect(() => {
    (async () => {
      try {
        const userStream = await navigator.mediaDevices.getUserMedia({
          audio: { deviceId: audioInputId },
          video: { deviceId: videoInputId },
        });

        setMediaStream(userStream);
      } catch {
        setIsError(true);
      }
    })();
  }, [audioInputId, videoInputId]);

  if (isPending || isError) {
    return (
      <div className="min-h-[75vh] flex items-center justify-center">
        <h1 className="text-muted-foreground text-2xl font-semibold">
          <Video className="m-auto size-20" />
          Please allow access to your media devices!
        </h1>
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
                !isCamEnable && "hidden"
              )}
              ref={previewRef}
            />

            {!isCamEnable && (
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
                    !isCamEnable && "opacity-50"
                  )}
                >
                  {isCamEnable ? (
                    <Video className="size-5" />
                  ) : (
                    <VideoOff className="size-5" />
                  )}
                  Facecam
                </div>
                <Switch
                  className="opacity-100"
                  checked={isCamEnable}
                  onCheckedChange={toggleCam}
                />
              </div>
              <Select value={videoInputId} onValueChange={setVideoInputId}>
                <SelectTrigger>
                  <div className="text-isMuted-foreground flex items-center gap-2">
                    <CameraIcon className="size-4" />
                    <SelectValue placeholder={"Choose a device"}></SelectValue>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {videoInputs?.map((input) => (
                    <SelectItem key={input.deviceId} value={input.deviceId}>
                      {input.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
              <Select value={audioInputId} onValueChange={setAudioInputId}>
                <SelectTrigger>
                  <div className="text-isMuted-foreground flex items-center gap-2">
                    <MicVocal className="size-4" />
                    <SelectValue placeholder={"Choose a device"}></SelectValue>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {audioInputs?.map((input) => (
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
          <Button>Join Meeting</Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default MeetingSetup;
