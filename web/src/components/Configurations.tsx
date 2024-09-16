import { useState } from "react";
import "../styles/Configurations.scss";

export const Configurations = () => {
  const [isHovered, setIsHovered] = useState(false);
  const [scaleValue, setScaleValue] = useState(1);

  return (
    <div
      className="configurationContainer"
      onPointerEnter={(e) => setIsHovered(true)}
      onPointerLeave={(e) => setIsHovered(false)}
    >
      {!isHovered && <div className="indicator">ˆˆ</div>}
      {isHovered && (
        <div className="content">
          <h3>Scale</h3>
          <input
            type="range"
            min={1}
            max={20}
            value={scaleValue}
            onChange={(e: any) => setScaleValue(e.target.value)}
          />
        </div>
      )}
    </div>
  );
};
