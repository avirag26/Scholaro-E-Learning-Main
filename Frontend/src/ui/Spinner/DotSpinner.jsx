import React from "react";
import "./DotSpinner.css"; // Create a separate CSS file for the spinner

const DotDotDotSpinner = () => {
  return (
    <div className="dot-dot-dot-spinner">
      <div className="dot"></div>
      <div className="dot"></div>
      <div className="dot"></div>
    </div>
  );
};

export default DotDotDotSpinner;
