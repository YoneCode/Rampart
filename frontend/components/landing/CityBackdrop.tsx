"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const CityBackground = dynamic(
  () => import("./CityBackground").then((m) => m.CityBackground),
  { ssr: false },
);

export function CityBackdrop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const small = window.innerWidth < 768;
    if (!reduce && !small) setShow(true);
  }, []);

  if (!show) return null;
  return (
    <div className="absolute inset-0">
      <CityBackground />
    </div>
  );
}
