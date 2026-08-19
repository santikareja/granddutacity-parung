import React from "react";

export default function DashboardWidget() {
  return (
    <div
      className="gdc-dash"
      style={{
        padding: 24,
        background: "#09090b",
        color: "white",
        borderRadius: 8,
      }}
    >
      <h1>Custom Dashboard Widget</h1>
      <p>If you see this, the Modular Dashboard widgets work!</p>
    </div>
  );
};
