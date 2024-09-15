import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { ActionSlice, createActionSlice } from "./ActionSlice";

export const useStore = create<ActionSlice>()(
  subscribeWithSelector((...a) => ({
    ...createActionSlice(...a),
  }))
);
