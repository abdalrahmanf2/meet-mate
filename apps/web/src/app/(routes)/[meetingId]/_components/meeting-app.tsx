"use client";

import { useMeetingStore } from "@/providers/meeting-store-provider";
import Meeting from "./meeting";
import MeetingSetup from "./meeting-setup";

const MeetingApp = () => {
  const isReady = useMeetingStore((state) => state.isReady);

  return isReady ? <Meeting /> : <MeetingSetup />;
};

export default MeetingApp;
