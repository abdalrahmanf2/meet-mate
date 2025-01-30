import { createStore } from "zustand/vanilla";

export type MeetingState = {
  muted: boolean;
  deafened: boolean;
};

export type MeetingActions = {
  mute: () => void;
  deafen: () => void;
};

export type MeetingStore = MeetingState & MeetingActions;

export const defaultInitState: MeetingState = {
  muted: false,
  deafened: false,
};

export const createMeetingStore = (
  initState: MeetingState = defaultInitState
) => {
  return createStore<MeetingStore>()((set) => ({
    ...initState,
    mute: () => set((state) => ({ ...state, muted: !state.muted })),
    deafen: () => set((state) => ({ ...state, deafened: !state.deafened })),
  }));
};
