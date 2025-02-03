import { auth } from "@/auth";
import MeetingApp from "./_components/meeting-app";
import { redirect } from "next/navigation";
import NotFound from "@/app/not-found";
import { meetingExist } from "@/data/meetings";

interface MeetingProps {
  params: Promise<{ meetingId: string }>;
}

const Meeting = async ({ params }: MeetingProps) => {
  const meetingId = (await params).meetingId;
  const session = await auth();

  if (!session) {
    redirect("/auth");
  }

  const exist = await meetingExist(meetingId);
  if (!exist) {
    return NotFound();
  }

  return <MeetingApp />;
};

export default Meeting;
