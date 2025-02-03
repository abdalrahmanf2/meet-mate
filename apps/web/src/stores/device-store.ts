import { createStore } from "zustand/vanilla";

export type DeviceState = {
  isReady: boolean;
  videoTrack?: MediaStreamTrack;
  audioTrack?: MediaStreamTrack;
  displayTrack?: MediaStreamTrack;
  muted: boolean;
  deafened: boolean;
  sharescreen: boolean;
};

export type DeviceActions = {
  mute: () => void;
  deafen: () => void;
  sharescreenToggle: () => void;
  ready: () => void;
};

export type DeviceStore = DeviceState & DeviceActions;

export const defaultInitState: DeviceState = {
  isReady: false,
  muted: false,
  deafened: false,
  sharescreen: false,
};

export const createMeetingStore = (
  initState: DeviceState = defaultInitState
) => {
  return createStore<DeviceStore>()((set) => ({
    ...initState,
    ready: () => set((state) => ({ ...state, isReady: true })),
    mute: () => set((state) => ({ ...state, muted: !state.muted })),
    deafen: () => set((state) => ({ ...state, deafened: !state.deafened })),
    sharescreenToggle: () =>
      set((state) => ({ ...state, sharescreen: !state.sharescreen })),
  }));
};
