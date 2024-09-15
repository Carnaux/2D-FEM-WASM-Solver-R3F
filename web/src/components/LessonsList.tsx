import "../styles/LessonsList.scss";

export const LessonsList = (props: any) => {
  return (
    <div className={props.className}>
      {Object.keys(props.lessonJSON).map((lesson, index) => (
        <ul key={index} className="lessonItemList">
          <li
            className={`lessonItem ${
              props.currentLesson === (props.lessonJSON as any)[lesson].index
                ? "lessonActive"
                : ""
            }`}
            onClick={(e) => {
              if (
                props.currentLesson !== (props.lessonJSON as any)[lesson].index
              ) {
                props.setCurrentLesson((props.lessonJSON as any)[lesson].index);

                const subLessonIndex = `${
                  (props.lessonJSON as any)[lesson].index
                }-1`;

                if (
                  (props.lessonJSON as any)[lesson].sublessons["sublesson1"]
                ) {
                  props.setCurrentSubLesson(subLessonIndex);
                } else {
                  props.setCurrentSubLesson("");
                }
              }
            }}
          >
            {(props.lessonJSON as any)[lesson].title}
          </li>
          <ul className="subLessonItemList">
            {Object.keys((props.lessonJSON as any)[lesson].sublessons).map(
              (subLesson, index) => (
                <li
                  key={index}
                  className={`subLessonItem ${
                    props.currentSubLesson ===
                    (props.lessonJSON as any)[lesson].sublessons[subLesson]
                      .index
                      ? "subLessonActive"
                      : ""
                  }`}
                  onClick={(e) => {
                    if (
                      props.currentLesson !==
                      (props.lessonJSON as any)[lesson].index
                    ) {
                      props.setCurrentLesson(
                        (props.lessonJSON as any)[lesson].index
                      );
                      props.setCurrentSubLesson(
                        (props.lessonJSON as any)[lesson].sublessons[subLesson]
                          .index
                      );
                    } else {
                      props.setCurrentSubLesson(
                        (props.lessonJSON as any)[lesson].sublessons[subLesson]
                          .index
                      );
                    }
                  }}
                >
                  {
                    (props.lessonJSON as any)[lesson].sublessons[subLesson]
                      .title
                  }
                </li>
              )
            )}
          </ul>
        </ul>
      ))}
    </div>
  );
};
