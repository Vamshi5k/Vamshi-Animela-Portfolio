// Full-page screenshots plus a horizontal overflow check at each target width.
// Usage: node scripts/shots.mjs [baseUrl] [--reduced] [--paths=/,/dev/design-system]
// Run it against a production build (npm run shots:prod), not next dev.
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const args = process.argv.slice(2);
const reduced = args.includes("--reduced");
const baseUrl = args.find((a) => !a.startsWith("--")) ?? "http://localhost:3000";
const pathsArg = args.find((a) => a.startsWith("--paths="));
const paths = pathsArg ? pathsArg.slice("--paths=".length).split(",").filter(Boolean) : ["/"];

/** "/" → "home", "/dev/design-system" → "dev-design-system". */
const slug = (p) => p.replace(/^\/+|\/+$/g, "").replace(/[^a-z0-9]+/gi, "-") || "home";

const viewports = [
  { width: 1440, height: 900 },
  { width: 1280, height: 800 },
  { width: 768, height: 1024, hasTouch: true },
  { width: 390, height: 844, hasTouch: true, isMobile: true },
  { width: 375, height: 812, hasTouch: true, isMobile: true },
];

const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const outDir = path.resolve(
  import.meta.dirname,
  "../design/screenshots",
  `${stamp}${reduced ? "-reduced" : ""}`,
);

/** Scroll top to bottom in steps so scroll-triggered content reveals, then return to the top. */
async function scrollThrough(page) {
  await page.evaluate(async () => {
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const step = Math.max(1, Math.floor(window.innerHeight * 0.75));
    for (let y = 0, i = 0; y < document.documentElement.scrollHeight && i < 200; y += step, i++) {
      window.scrollTo(0, y);
      await wait(120);
    }
    window.scrollTo(0, document.documentElement.scrollHeight);
    await wait(300);
    window.scrollTo(0, 0);
    await wait(300);
  });
}

/** Elements whose right edge is past the viewport, keeping only the outermost offender of each chain. */
async function findOverflow(page) {
  return page.evaluate(() => {
    const root = document.documentElement;
    const limit = root.clientWidth;

    const selectorFor = (el) => {
      const parts = [];
      for (let node = el; node && node !== root && parts.length < 4; node = node.parentElement) {
        if (node.id) {
          parts.unshift(`#${CSS.escape(node.id)}`);
          break;
        }
        let part = node.tagName.toLowerCase();
        const classes = [...node.classList].slice(0, 2).map((c) => `.${CSS.escape(c)}`);
        part += classes.join("");
        const parent = node.parentElement;
        if (parent) {
          const same = [...parent.children].filter((c) => c.tagName === node.tagName);
          if (same.length > 1) part += `:nth-of-type(${same.indexOf(node) + 1})`;
        }
        parts.unshift(part);
      }
      return parts.join(" > ");
    };

    const overflows = (el) => el.getBoundingClientRect().right > limit + 0.5;
    const offenders = [...document.body.querySelectorAll("*")].filter(
      (el) => overflows(el) && !(el.parentElement && el.parentElement !== document.body && overflows(el.parentElement)),
    );

    return {
      scrollWidth: root.scrollWidth,
      clientWidth: limit,
      failed: root.scrollWidth > root.clientWidth,
      offenders: offenders.slice(0, 20).map((el) => {
        const r = el.getBoundingClientRect();
        return { selector: selectorFor(el), width: Math.round(r.width), right: Math.round(r.right) };
      }),
    };
  });
}

await mkdir(outDir, { recursive: true });
const browser = await chromium.launch();
let failures = 0;

try {
  for (const route of paths) {
    console.log(`\n${route}`);
    for (const { width, height, hasTouch = false, isMobile = false } of viewports) {
      const context = await browser.newContext({
        viewport: { width, height },
        hasTouch,
        isMobile,
        reducedMotion: reduced ? "reduce" : "no-preference",
      });
      const page = await context.newPage();
      await page.goto(new URL(route, baseUrl).href, { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);
      await scrollThrough(page);
      await page.waitForLoadState("networkidle");

      const file = path.join(outDir, `${slug(route)}-${width}.png`);
      await page.screenshot({ path: file, fullPage: true });

      const result = await findOverflow(page);
      if (result.failed) {
        failures++;
        console.log(`FAIL ${width}px  scrollWidth ${result.scrollWidth} > clientWidth ${result.clientWidth}`);
        for (const o of result.offenders) {
          console.log(`       ${o.selector}  (width ${o.width}px, right edge ${o.right}px)`);
        }
      } else {
        console.log(`PASS ${width}px`);
      }
      await context.close();
    }
  }
} finally {
  await browser.close();
}

console.log(`\nScreenshots: ${outDir}`);
if (failures > 0) process.exitCode = 1;
