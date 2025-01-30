"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { useState } from "react";

interface ParticipantsGridProps {
  className?: string;
}

const ParticipantsGrid = ({ className }: ParticipantsGridProps) => {
  const { data: session } = useSession();

  return (
    <div
      className={cn(
        "max-h-[calc(95vh-69px)] grid gap-4 md:grid-rows-3 md:grid-cols-3",
        className
      )}
    >
      <ParticipantCard
        key={session?.user?.id}
        name={session?.user?.name}
        img={session?.user?.image}
      />
    </div>
  );
};

interface ParticipantCardProps {
  name?: string | null;
  img?: string | null;
}

const ParticipantCard = ({ name, img }: ParticipantCardProps) => {
  const [isTalking, setIsTalking] = useState(false);

  return (
    <div
      className={cn(
        "min-h-[calc(30vh-69px)] p-4 border border-zinc-800 bg-zinc-950 size-full rounded-lg flex flex-col items-center justify-center gap-2",
        isTalking && "border-blue-700"
      )}
    >
      <Avatar className="size-32">
        <AvatarImage src={img as string} />
        <AvatarFallback>MM</AvatarFallback>
      </Avatar>
      <p className="text-muted-foreground text-sm text-center">{name}</p>
    </div>
  );
};

export default ParticipantsGrid;
