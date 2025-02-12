"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { getUserById } from "@/data/users";
import { cn } from "@/lib/utils";
import { Client } from "@/types/media-soup";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import Stream from "./stream";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import useTalking from "@/hooks/use-talking";
import { Mic } from "lucide-react";
import { LocalClient } from "@/hooks/use-meeting";

interface ParticipantsGridProps {
  clients: Map<string, Client>;
  producers: LocalClient;
  className?: string;
}

const ParticipantsGrid = ({
  clients,
  producers,
  className,
}: ParticipantsGridProps) => {
  const { data: session } = useSession();

  console.log("CLIENTS", clients);

  return (
    <div
      className={cn(
        "grid gap-4 md:grid-cols-2 lg:grid-cols-3 items-center justify-center",
        Array.from(clients.values()).length === 0 &&
          "grid-cols-1 md:grid-cols-1 lg:grid-cols-1",
        Array.from(clients.values()).length === 1 &&
          "grid-cols-2 md:grid-cols-2 lg:grid-cols-2",
        className
      )}
    >
      <ParticipantCard
        userId={session?.user?.id as string}
        video={producers.video?.track}
        // audio={producers.audio?.track}
      />

      {Array.from(clients.entries()).map(([userId, client]) => {
        return (
          <ParticipantCard
            key={userId}
            userId={userId}
            video={client.video?.track}
            audio={client.audio?.track}
          />
        );
      })}
    </div>
  );
};

type ParticipantCardProps = {
  userId: string;
  video?: MediaStreamTrack | null;
  audio?: MediaStreamTrack | null;
};

const ParticipantCard = ({ userId, video, audio }: ParticipantCardProps) => {
  const { isTalking } = useTalking(audio);

  const { data: user, isLoading } = useQuery({
    queryKey: [userId],
    queryFn: () => getUserById(userId),
  });

  return (
    <AspectRatio
      ratio={16 / 9}
      className={cn(
        "relative overflow-hidden border rounded-lg",
        isTalking && "ring ring-blue-600"
      )}
    >
      {video ? (
        <>
          <Stream track={video} kind="video" />
          <div className="bg-background py-1 pl-1 pr-4 m-2 rounded-full border flex items-center gap-2 absolute left-0 bottom-0">
            <Avatar className="size-6">
              <AvatarImage src={user?.image || ""} alt="user image" />
              <AvatarFallback>
                <Skeleton />
              </AvatarFallback>
            </Avatar>

            {isLoading ? (
              <Skeleton className="w-[50px] h-4" />
            ) : (
              <p className="text-xs text-center">{user?.name}</p>
            )}

            <Mic className="size-4" />
          </div>
        </>
      ) : (
        <div className="bg-card size-full flex flex-col gap-2 items-center justify-center">
          <Avatar className="size-24 md:size-32">
            <AvatarImage src={user?.image || ""} alt="user image" />
            <AvatarFallback>
              <Skeleton />
            </AvatarFallback>
          </Avatar>
          {isLoading ? (
            <Skeleton className="w-[50px] h-4" />
          ) : (
            <p className="text-muted-foreground text-center">{user?.name}</p>
          )}
        </div>
      )}

      {audio && <Stream track={audio} kind="audio" />}
    </AspectRatio>
  );
};

export default ParticipantsGrid;
