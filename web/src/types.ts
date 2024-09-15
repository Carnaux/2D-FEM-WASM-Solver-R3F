import { Dispatch, SetStateAction } from "react";
import { Vector3 } from "three";

export type Selection = {
  name: string;
  type: string;
  pos: Vector3;
};

export const dummySelection: Selection = {
  name: "",
  type: "",
  pos: new Vector3(),
};

export type NodeObject = {
  name: string;
};

export type BaseProps = {
  selected: Selection[];
  setSelected: Dispatch<SetStateAction<Selection[]>>;
  nodes3d: any;
  setNodes3d: Dispatch<SetStateAction<any>>;
};

export type IntroProps = {
  setIntroVisible: Dispatch<SetStateAction<boolean>>;
};

export type ControllerProps = {} & BaseProps;

export type AppProps = {
  outlineHover: any;
  setOutlineHover: Dispatch<SetStateAction<any>>;
} & BaseProps;

export type NodeComponentProps = {
  name: string;
  selected: Selection[];
  setSelected: Dispatch<SetStateAction<Selection[]>>;
  outlineHover: any;
  setOutlineHover: Dispatch<SetStateAction<any>>;
};

export type OutlinerProps = {} & BaseProps;
