"use client";

import { useRef } from "react";
import { useMagnetic } from "@/hooks/useMagnetic";

export function MagneticDemo({ label }: { label: string }) {
  const ref = useRef<HTMLButtonElement>(null);
  useMagnetic(ref);
  return (
    <button ref={ref} type="button" className="type-mono-s h-12 border border-rule px-6 text-muted">
      {label}
    </button>
  );
}
