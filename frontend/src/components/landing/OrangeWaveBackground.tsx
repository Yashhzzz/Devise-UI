import React from "react";
import waveBg from "../../assets/image.png";

export const OrangeWaveBackground = () => {
  return (
    <div
      className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none"
      style={{ zIndex: 0 }}
    >
      <img
        src={waveBg}
        alt="Background Graphic"
        className="w-full h-full object-cover object-top opacity-90"
      />
    </div>
  );
};
