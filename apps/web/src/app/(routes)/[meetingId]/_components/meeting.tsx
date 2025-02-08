"use client";

import { useParams, useRouter } from "next/navigation";
import Chat from "./chat";
import Controlls from "./controls";
import ParticipantsGrid from "./participants-grid";
import useMeeting from "@/hooks/use-meeting";
import { useSession } from "next-auth/react";

const Meeting = () => {
  const { meetingId } = useParams();
  const router = useRouter();
  const session = useSession();

  if (!session) {
    router.replace("/");
  }

  useMeeting(session.data?.user?.id as string, meetingId as string);

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-8 grid-cols-4">
        <ParticipantsGrid className="col-span-3" />
        <Chat className="col-span-1" />
      </div>
      <Controlls />
    </div>
  );
};

export default Meeting;
