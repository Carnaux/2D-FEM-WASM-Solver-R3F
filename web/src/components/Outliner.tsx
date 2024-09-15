import { useEffect } from "react";
import "../styles/Outliner.scss";
import { useStore } from "../store/Store";
import { ACTION_TRIGGERS } from "../store/ActionTriggers";
import { Vector3 } from "three";
import { OutlinerProps } from "../types";

export const Outliner = ({
  selected,
  setSelected,
  nodes3d,
  setNodes3d,
}: OutlinerProps) => {
  const triggerAction = useStore((store) => store.triggerAction);

  return (
    <div className={"outliner"}>
      {nodes3d.map((node: any, index: number) => (
        <ul key={index} className="nodeItemList">
          <li
            className={`nodeItem  ${
              selected.find((n: any) => n.name === node.name)
                ? "nodeActive"
                : ""
            }`}
            onClick={(e: any) => {
              triggerAction(ACTION_TRIGGERS.OUTLINER_SELECT, `${node.name}`, {
                name: node.name,
                pos: new Vector3(),
              });
            }}
          >
            {node.name}
          </li>
          {/* <ul className="subLessonItemList">
            {Object.keys((props.lessonJSON as any)[lesson].sublessons).map(
              (subLesson, index) => (
                <li
                  key={index}
                  className={`subLessonItem`}
                  onClick={(e) => {
                    // if (
                    //   props.currentLesson !==
                    //   (props.lessonJSON as any)[lesson].index
                    // ) {
                    //   props.setCurrentLesson(
                    //     (props.lessonJSON as any)[lesson].index
                    //   );
                    //   props.setCurrentSubLesson(
                    //     (props.lessonJSON as any)[lesson].sublessons[subLesson]
                    //       .index
                    //   );
                    // } else {
                    //   props.setCurrentSubLesson(
                    //     (props.lessonJSON as any)[lesson].sublessons[subLesson]
                    //       .index
                    //   );
                    // }
                  }}
                >
                  {"Element"}
                </li>
              )
            )}
          </ul> */}
        </ul>
      ))}
    </div>
  );
};
