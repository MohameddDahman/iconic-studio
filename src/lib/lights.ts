import { useSyncExternalStore } from "react";

/**
 * Site-wide lighting state for the lamp switch.
 *
 * "day" shows each paired room as rendered in daylight; "evening" shows the
 * same frame after dark with only the room's own lighting on. One switch
 * changes every paired image on the page, and the house walkthrough, together.
 *
 * A tiny external store rather than context: the header, the images and the
 * WebGL scene all subscribe without sharing a React parent, and nothing here
 * ever needs setState inside an effect.
 */

export type LightMode = "day" | "evening";

interface LightState {
  mode: LightMode;
  /** How many components on the page can respond to the switch. */
  listeners: number;
}

const SERVER_STATE: LightState = { mode: "day", listeners: 0 };

let state: LightState = SERVER_STATE;
const subscribers = new Set<() => void>();

function emit(next: LightState) {
  state = next;
  subscribers.forEach((notify) => notify());
}

function subscribe(notify: () => void) {
  subscribers.add(notify);
  return () => {
    subscribers.delete(notify);
  };
}

export const lights = {
  get mode() {
    return state.mode;
  },
  toggle() {
    emit({ ...state, mode: state.mode === "day" ? "evening" : "day" });
  },
  set(mode: LightMode) {
    if (mode !== state.mode) emit({ ...state, mode });
  },
  /** Call from an effect; returns the matching cleanup. */
  register() {
    emit({ ...state, listeners: state.listeners + 1 });
    return () => emit({ ...state, listeners: Math.max(0, state.listeners - 1) });
  },
  subscribe,
};

export function useLights(): LightState {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => SERVER_STATE,
  );
}
