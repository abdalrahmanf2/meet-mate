import { createStore } from "zustand/vanilla";

export type MeetingState = {
  mediaStream?: MediaStream;
  isReady: boolean;
  isMuted: boolean;
  isCamEnabled: boolean;
};

export type MeetingActions = {
  setMediaStream: (mediaStream: MediaStream) => void;
  toggleMute: () => void;
  toggleCam: () => void;
  ready: () => void;
};

export type MeetingStore = MeetingState & MeetingActions;

export const defaultInitState: MeetingState = {
  isReady: false,
  isMuted: false,
  isCamEnabled: true,
};

export const createMeetingStore = (
  initState: MeetingState = defaultInitState
) => {
  return createStore<MeetingStore>()((set) => ({
    ...initState,
    setMediaStream: (mediaStream: MediaStream) =>
      set((state) => ({ ...state, mediaStream })),
    ready: () => set((state) => ({ ...state, isReady: true })),
    toggleMute: () => set((state) => ({ ...state, isMuted: !state.isMuted })),
    toggleCam: () =>
      set((state) => ({ ...state, isCamEnabled: !state.isCamEnabled })),
  }));
};
