import React from "react";
import PropTypes from "prop-types";
import "./button-styles.css";

const d3ToCustom = {
  "#1f77b4": "bg-blue-600",
  "#ff7f0e": "bg-orange-500",
  "#2ca02c": "bg-green-600",
  "#d62728": "bg-red-600",
  "#9467bd": "bg-purple-600",
  "#8c564b": "bg-yellow-950",
  "#e377c2": "bg-pink-500",
  "#7f7f7f": "bg-gray-600",
  "#bcbd22": "bg-yellow-500",
  "#17becf": "bg-teal-500",
};

function MyButton({ color, nodeName }) {
  const customClass = d3ToCustom[color] || ""; // fallback to an empty string if not mapped

  // Truncate the nodeName to 10 characters followed by "..." if it's longer than 10 characters
  const displayText = nodeName.length > 10 ? `${nodeName.substring(0, 10)}...` : nodeName;

  return (
    <button
      className={`button-11 ${customClass} text-white text-sm px-2 py-1 rounded`} // Combine the classes here
      title={nodeName} // Full nodeName will be shown as a tooltip on hover
    >
      {displayText} {/* Display the truncated text */}
    </button>
  );
}

MyButton.propTypes = {
  color: PropTypes.string.isRequired,
  nodeName: PropTypes.string.isRequired,
};

export default MyButton;
