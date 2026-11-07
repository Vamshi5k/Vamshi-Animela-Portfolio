import type { CSSProperties, ReactElement } from "react";

/**
 * Abstract line-art pictograms for the Services ladder (SPEC §1a): hairline geometry only, never product UI.
 * Every stroke has pathLength=1 so CSS can draw it (stroke-dashoffset 1 → 0) when its panel opens; --i staggers
 * the strokes. Without JS or under reduced motion they render fully drawn.
 */
const P = ({ i, ...rest }: { i: number } & Record<string, string | number>) => ({ ...rest, pathLength: 1, className: "svc-draw", style: { "--i": i } as CSSProperties });

const shapes: Record<string, () => ReactElement> = {
  // One codebase, two platforms: two device outlines overlapping, joined at a single node.
  "react-native": () => (
    <>
      <rect {...P({ i: 0, x: 26, y: 22, width: 58, height: 104, rx: 11 })} />
      <rect {...P({ i: 1, x: 76, y: 38, width: 58, height: 104, rx: 11 })} />
      <path {...P({ i: 2, d: "M55 74 H105" })} />
      <circle {...P({ i: 3, cx: 80, cy: 74, r: 4 })} />
    </>
  ),
  // A site as stacked blocks inside one frame.
  "business-websites": () => (
    <>
      <rect {...P({ i: 0, x: 18, y: 30, width: 124, height: 100 })} />
      <path {...P({ i: 1, d: "M18 46 H142" })} />
      <rect {...P({ i: 2, x: 32, y: 58, width: 96, height: 18 })} />
      <rect {...P({ i: 3, x: 32, y: 86, width: 44, height: 32 })} />
      <rect {...P({ i: 4, x: 84, y: 86, width: 44, height: 32 })} />
    </>
  ),
  // A tag on a string: commerce, drawn as geometry.
  "ecommerce-frontend": () => (
    <>
      <path {...P({ i: 0, d: "M28 82 L78 32 H128 V82 L78 132 Z" })} />
      <circle {...P({ i: 1, cx: 110, cy: 50, r: 7 })} />
      <path {...P({ i: 2, d: "M117 43 C132 28 146 30 148 18" })} />
    </>
  ),
  // One long page, a fold line, and the scroll below it.
  "landing-pages": () => (
    <>
      <rect {...P({ i: 0, x: 50, y: 14, width: 60, height: 132 })} />
      <path {...P({ i: 1, d: "M36 66 H46 M54 66 H64 M72 66 H82 M90 66 H100 M108 66 H118" })} />
      <path {...P({ i: 2, d: "M80 86 V120 M70 110 L80 120 L90 110" })} />
    </>
  ),
  // A broken line, rejoined: work on something that already exists.
  "app-improvements": () => (
    <>
      <path {...P({ i: 0, d: "M16 96 H62" })} />
      <path {...P({ i: 1, d: "M98 96 H144" })} />
      <path {...P({ i: 2, d: "M62 96 A18 18 0 0 1 98 96" })} />
      <path {...P({ i: 3, d: "M62 104 V112 M98 104 V112" })} />
    </>
  ),
  // A gauge: measuring before changing.
  performance: () => (
    <>
      <path {...P({ i: 0, d: "M28 112 A52 52 0 0 1 132 112" })} />
      <path {...P({ i: 1, d: "M80 112 L112 74" })} />
      <circle {...P({ i: 2, cx: 80, cy: 112, r: 5 })} />
      <path {...P({ i: 3, d: "M36 84 L44 88 M80 60 V69 M124 84 L116 88" })} />
    </>
  ),
  // A phone outline beside a hatched, empty backend block; the link between them stops short (no backend).
  "expo-app": () => (
    <>
      <rect {...P({ i: 0, x: 20, y: 26, width: 54, height: 108, rx: 10 })} />
      <path {...P({ i: 1, d: "M40 124 H54" })} />
      <path {...P({ i: 2, d: "M78 80 H85 M91 80 H96" })} />
      <rect {...P({ i: 3, x: 102, y: 50, width: 44, height: 60 })} />
      <path {...P({ i: 4, d: "M102 62 L114 50 M102 76 L128 50 M102 90 L142 50 M106 108 L146 68 M120 108 L146 82 M134 108 L146 96" })} />
    </>
  ),
};

export function ServicePictogram({ id }: { id: string }) {
  const draw = shapes[id];
  if (!draw) return null;
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 160 160"
      className="svc-picto block size-full"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.25}
      strokeLinecap="square"
    >
      {draw()}
    </svg>
  );
}
