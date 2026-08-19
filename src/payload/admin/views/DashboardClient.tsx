"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";

export default function DashboardClient() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div style={{ padding: "40px" }} className="gdc-dashboard">
      <h1>Dashboard View Client</h1>
      <p>If you see this, using a client component fixed the crashing issue!</p>
    </div>
  );
}
