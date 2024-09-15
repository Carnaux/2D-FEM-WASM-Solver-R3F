import { StateCreator } from "zustand";
import { ACTION_TRIGGERS } from "./ActionTriggers";

export type Action = {
  target: string;
  trigger: ACTION_TRIGGERS | any;
  cb: (event: Event | any) => void;
  id?: string;
};

export const createActionSlice: StateCreator<
  ActionSlice,
  [["zustand/subscribeWithSelector", never]],
  []
> = (set, get) => ({
  actions: new Map(),
  addAction: (action: Action, overwrite = true) => {
    if (!overwrite) {
      set({
        actions: get().actions.set(action.target, [
          ...(get().getActions(action.target) || []),
          action,
        ]),
      });
    } else {
      const filteredStoredActions = get()
        .getActions(action.target)
        ?.filter((elem) => elem.trigger !== action.trigger);
      set({
        actions: get().actions.set(action.target, [
          ...(filteredStoredActions || []),
          action,
        ]),
      });
    }
  },
  getActions: (key: string) => get().actions.get(key),
  triggerAction: (
    trigger: ACTION_TRIGGERS | any,
    targetName: string,
    event?
  ) => {
    const selectedActions = get()
      .actions.get(targetName)
      ?.filter((action) => action.trigger === trigger);

    selectedActions &&
      selectedActions.forEach((action) => {
        action.cb(event);
      });
  },
});

export interface ActionSlice {
  actions: Map<string, Action[]>;
  addAction: (action: Action, overwrite?: boolean) => void;
  getActions: (key: string) => Action[] | undefined;
  triggerAction: (
    trigger: ACTION_TRIGGERS | any,
    targetName: string,
    event?: Event | any
  ) => void;
}
