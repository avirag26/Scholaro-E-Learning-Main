import React from "react";

export default function Button({ children, variant = "primary", className = "", ...rest }) {
  let style = "px-5 py-2 rounded-lg font-semibold transition ";
  if (variant === "primary")
    style += "bg-cyan-600 text-white hover:bg-cyan-700";
  else if (variant === "outline")
    style += "border border-cyan-600 text-cyan-600 bg-white hover:bg-cyan-50";
  return (
    <button className={`${style} ${className}`} {...rest}>
      {children}
    </button>
  );
}