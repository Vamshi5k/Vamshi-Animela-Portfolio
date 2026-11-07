"use client";

import { useSyncExternalStore } from "react";
import { devDesignSystem as copy } from "@/data/devDesignSystem";
import { cssEase, motion, type EaseToken } from "@/lib/motion-tokens";

const noop = () => () => {};
const kebab = (s: string) => s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

/**
 * Compare by value, not by string: the CSS minifier rewrites "120ms" as ".12s" and "0.16" as ".16".
 * Durations become milliseconds; easings become their four numbers.
 */
function normalize(s: string): string {
  const t = s.trim();
  const time = t.match(/^(-?[\d.]+)(ms|s)$/);
  if (time) return String(Number(time[1]) * (time[2] === "s" ? 1000 : 1));
  const nums = t.match(/-?[\d.]+/g);
  return t.startsWith("cubic-bezier") && nums ? nums.map(Number).join(",") : t;
}

function useCssVar(name: string) {
  return useSyncExternalStore(
    noop,
    () => getComputedStyle(document.documentElement).getPropertyValue(name).trim(),
    () => "",
  );
}

function Row({ name, expected }: { name: string; expected: string }) {
  const actual = useCssVar(name);
  const ok = actual !== "" && normalize(actual) === normalize(expected);
  return (
    <tr className="border-t border-rule">
      <td className="py-2 pr-4">{name}</td>
      <td className="py-2 pr-4">{expected}</td>
      <td className="py-2 pr-4">{actual || "—"}</td>
      <td className={`py-2 ${ok ? "text-accent" : "text-muted"}`}>{ok ? copy.tokenMatch : copy.tokenMismatch}</td>
    </tr>
  );
}

/** Compares src/lib/motion-tokens.ts with the CSS variables in globals.css at runtime. */
export function MotionTokenCheck() {
  const durations = Object.entries(motion.duration).map(([k, v]) => ({
    name: `--duration-${k}`,
    expected: `${Math.round(v * 1000)}ms`,
  }));
  const eases = (Object.keys(motion.ease) as EaseToken[]).map((k) => ({
    name: `--ease-${kebab(k)}`,
    expected: cssEase(k),
  }));
  return (
    <div className="overflow-x-auto">
      <table className="type-mono-xs w-full min-w-xl text-left">
        <tbody>
          {[...durations, ...eases].map((r) => (
            <Row key={r.name} {...r} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
