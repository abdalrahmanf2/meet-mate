"use client";

import { useParams, useRouter } from "next/navigation";
import Chat from "./chat";
import Controls from "./controls";
import ParticipantsGrid from "./participants-grid";
import useMediaSoup from "@/hooks/use-mediasoup";
import { useSession } from "next-auth/react";

const MeetingRoom = () => {
  const { meetingId } = useParams();
  const router = useRouter();
  const session = useSession();

  if (!session) {
    router.replace("/");
  }

  const { clients, producers, toggleAudioProducer } = useMediaSoup(
    session.data?.user?.id as string,
    meetingId as string
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-8 lg:grid-cols-4">
        <ParticipantsGrid
          clients={clients}
          producers={producers}
          className="col-span-3"
        />
        <Chat className="hidden lg:block lg:col-span-1" />
      </div>
      <Controls toggleAudioProducer={toggleAudioProducer} />
    </div>
  );
};

export default MeetingRoom;
