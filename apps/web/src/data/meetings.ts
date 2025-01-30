"use server";

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db/drizzle";
import { eq } from "drizzle-orm";
import { meetings } from "@/db/schema/meetings";
import { TCreateMeetingFormSchema } from "@/app/(routes)/(dashboard)/create-meeting/create-meeting-form";

export const createMeeting = async (values: TCreateMeetingFormSchema) => {
  const session = await auth();

  if (!session) {
    redirect("/auth");
  }

  const meeting = await db
    .insert(meetings)
    .values({
      ...values,
      createdBy: session.user?.id as string,
    })
    .returning({ meetingid: meetings.id });
  const meetingId = meeting[0].meetingid;

  return redirect(`/${meetingId}`);
};

export const meetingExist = async (meetingId: string) => {
  const meeting = (
    await db.select().from(meetings).where(eq(meetings.id, meetingId))
  )[0];

  return !!meeting;
};
