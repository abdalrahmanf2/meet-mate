import { createStore } from "zustand/vanilla";

export type MeetingState = {
  isReady: boolean;
  isMuted: boolean;
  isCamEnabled: boolean;
};

export type MeetingActions = {
  toggleMute: () => void;
  toggleCam: () => void;
};

export type MeetingStore = MeetingState & MeetingActions;

export const defaultInitState: MeetingState = {
  isReady: false,
  isMuted: true,
  isCamEnabled: false,
};

export const createMeetingStore = (
  initState: MeetingState = defaultInitState
) => {
  return createStore<MeetingStore>()((set) => ({
    ...initState,
    ready: () => set((state) => ({ ...state, isReady: true })),
    toggleMute: () => set((state) => ({ ...state, isMuted: !state.isMuted })),
    toggleCam: () =>
      set((state) => ({ ...state, isCamEnabled: !state.isCamEnabled })),
  }));
};
