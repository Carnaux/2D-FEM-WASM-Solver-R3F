import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { ActionSlice, createActionSlice } from "./ActionSlice";

// create the store to manage the behaviours of 3d objects
export const useStore = create<ActionSlice>()(
  subscribeWithSelector((...a) => ({
    ...createActionSlice(...a),
  }))
);
