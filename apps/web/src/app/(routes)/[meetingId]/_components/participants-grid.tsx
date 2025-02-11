"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { getUserById } from "@/data/users";
import { cn } from "@/lib/utils";
import { Client } from "@/types/media-soup";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useState } from "react";
import Stream from "./stream";
import { useMeetingStore } from "@/providers/meeting-store-provider";

interface ParticipantsGridProps {
  clients: Map<string, Client>;
  className?: string;
}

const ParticipantsGrid = ({ clients, className }: ParticipantsGridProps) => {
  const { data: session } = useSession();
  console.log("CLIENTS", clients);

  return (
    <div
      className={cn(
        "max-h-[calc(95vh-69px)] grid gap-4 md:grid-rows-2 md:grid-cols-2 lg:grid-cols-3",
        className
      )}
    >
      <ParticipantCard userId={session?.user?.id as string} />

      {Array.from(clients.entries()).map(([userId, client]) => {
        return <ParticipantCard key={userId} userId={userId} client={client} />;
      })}
    </div>
  );
};

type ParticipantCardProps = {
  userId: string;
  client?: Client;
};

const ParticipantCard = ({ userId, client }: ParticipantCardProps) => {
  const userMedia = useMeetingStore((state) => state.mediaStream);
  const [isTalking, setIsTalking] = useState(false);

  const { data: user, isLoading } = useQuery({
    queryKey: [userId],
    queryFn: () => getUserById(userId),
  });

  return (
    <div
      className={cn(
        "min-h-[calc(30vh-69px)] p-4 bg-background border border-zinc-800 bg-zinc-950 size-full rounded-lg flex flex-col items-center justify-center gap-2",
        isTalking && "border-blue-700"
      )}
    >
      <Avatar className="size-32">
        <AvatarImage src={user?.image || ""} />
        <AvatarFallback>
          <Skeleton />
        </AvatarFallback>
      </Avatar>
      {isLoading ? (
        <Skeleton className="w-[50px] h-4" />
      ) : (
        <p className="text-muted-foreground text-sm text-center">
          {user?.name}
        </p>
      )}

      <div className="">
        {client?.video && <Stream track={client?.video?.track} kind="video" />}
        {client?.audio && <Stream track={client?.audio?.track} kind="audio" />}
      </div>
    </div>
  );
};

export default ParticipantsGrid;
