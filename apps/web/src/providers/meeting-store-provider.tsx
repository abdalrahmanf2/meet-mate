"use client";

import { type ReactNode, createContext, useRef, useContext } from "react";
import { useStore } from "zustand";

import { type MeetingStore, createMeetingStore } from "@/stores/meeting-store";

export type MeetingStoreApi = ReturnType<typeof createMeetingStore>;

export const MeetingStoreContext = createContext<MeetingStoreApi | undefined>(
  undefined
);

export interface MeetingStoreProviderProps {
  children: ReactNode;
}

export const MeetingStoreProvider = ({
  children,
}: MeetingStoreProviderProps) => {
  const storeRef = useRef<MeetingStoreApi>(null);
  if (!storeRef.current) {
    storeRef.current = createMeetingStore();
  }

  return (
    <MeetingStoreContext.Provider value={storeRef.current}>
      {children}
    </MeetingStoreContext.Provider>
  );
};

export const useMeetingStore = <T,>(
  selector: (store: MeetingStore) => T
): T => {
  const meetingStoreContext = useContext(MeetingStoreContext);

  if (!meetingStoreContext) {
    throw new Error(`useMeetingStore must be used within MeetingStoreProvider`);
  }

  return useStore(meetingStoreContext, selector);
};
