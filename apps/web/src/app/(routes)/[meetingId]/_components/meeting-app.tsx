"use client";

import { useMeetingStore } from "@/providers/meeting-store-provider";
import MeetingRoom from "./meeting-room";
import MeetingSetup from "./meeting-setup";

const MeetingApp = () => {
  const isReady = useMeetingStore((state) => state.isReady);

  return isReady ? <MeetingRoom /> : <MeetingSetup />;
};

export default MeetingApp;
