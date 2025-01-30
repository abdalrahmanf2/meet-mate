"use client";

import { useParams } from "next/navigation";
import Chat from "./chat";
import Controlls from "./controls";
import ParticipantsGrid from "./participants-grid";
import useMeeting from "@/hooks/use-meeting";

const MeetingApp = () => {
  const { meetingId } = useParams();
  useMeeting(meetingId as string);

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

export default MeetingApp;
