"use client";

import { useSyncExternalStore } from "react";
import { devDesignSystem as copy } from "@/data/devDesignSystem";

function subscribe(onChange: () => void) {
  document.fonts.addEventListener("loadingdone", onChange);
  void document.fonts.ready.then(onChange);
  return () => document.fonts.removeEventListener("loadingdone", onChange);
}

/** "loaded" when at least one face of `family` (the next/font family name) has finished loading. */
function useFontLoaded(family: string) {
  return useSyncExternalStore(
    subscribe,
    () => [...document.fonts].some((f) => f.family.replace(/["']/g, "") === family && f.status === "loaded"),
    () => false,
  );
}

type Props = { label: string; fontFamily: string; className: string; sample: string };

export function FontCheck({ label, fontFamily, className, sample }: Props) {
  const family = fontFamily.split(",")[0].replace(/["']/g, "").trim();
  const loaded = useFontLoaded(family);
  return (
    <div className="flex flex-col gap-2 border-t border-rule py-4 md:flex-row md:items-baseline md:gap-6">
      <span className="type-mono-xs w-48 shrink-0 text-muted">{label}</span>
      <span className={className}>{sample}</span>
      <span className={`type-mono-xs md:ml-auto ${loaded ? "text-accent" : "text-muted"}`}>
        {loaded ? copy.fontLoaded : copy.fontPending} · {family}
      </span>
    </div>
  );
}
