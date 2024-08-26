import "../styles/Intro.css";

export const Intro = (props: any) => {
  return (
    <div className="introContainer">
      <div className="TitleColumn">
        <img />
        <h1 className="Title">Suspension Arm</h1>
        <h2 className="Subtitle">3D Model</h2>
        <button
          className="Button"
          onClick={(e) => props.setIntroVisible(false)}
        >
          View Model
        </button>
      </div>
    </div>
  );
};
