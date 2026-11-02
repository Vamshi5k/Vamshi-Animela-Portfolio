// Hero motion checks against a production build.
// Usage: npm run motion:check   (builds, serves on 3100, runs checks, stops the server)
// Desktop with a mouse: pointer depth moves within bounds and returns on leave; scroll parallax moves
// without horizontal overflow. Reduced motion and 390 touch: no parallax or pointer transforms.
import { chromium } from "playwright";
import { withProdServer } from "./prod-server.mjs";

const results = [];
function check(name, ok, detail = "") {
  results.push(ok);
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  (${detail})` : ""}`);
}
const info = (name, detail) => console.log(`INFO  ${name}  (${detail})`);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const PLATE = '[data-hero="plate"]';
const BACK = '[data-hero="back"]';
const NAME = '[data-hero="name"]';
/** Theoretical maxima from Hero.tsx: plate ±7 / ±5 px, back frame ±5 / ±4 px. Small slack for easing. */
const DEPTH_LIMIT = { x: 8, y: 6 };

const translate = (page, selector) =>
  page.evaluate((s) => {
    const m = new DOMMatrixReadOnly(getComputedStyle(document.querySelector(s)).transform);
    return { x: +m.m41.toFixed(2), y: +m.m42.toFixed(2) };
  }, selector);
const isIdentity = (t) => Math.abs(t.x) < 0.5 && Math.abs(t.y) < 0.5;
const overflowX = (page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
const scrollToY = (page, y) => page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), y);

async function open(browser, base, options) {
  const context = await browser.newContext(options);
  const page = await context.newPage();
  await page.goto(base, { waitUntil: "networkidle" });
  await page.waitForSelector("header[data-ready]");
  await wait(1800); // CSS entrance (≤ 1.4s) finished, GSAP set up
  return { context, page };
}

async function desktop(browser, base) {
  const { context, page } = await open(browser, base, { viewport: { width: 1440, height: 900 } });

  check("1440 mouse: plate at rest before any pointer movement", isIdentity(await translate(page, PLATE)), JSON.stringify(await translate(page, PLATE)));

  // Sweep across the hero, ending near its bottom-right.
  for (const [x, y] of [[200, 300], [500, 400], [900, 550], [1300, 750]]) {
    await page.mouse.move(x, y, { steps: 8 });
    await wait(80);
  }
  await wait(1200);
  const plate = await translate(page, PLATE);
  const back = await translate(page, BACK);
  const moved = !isIdentity(plate) && !isIdentity(back);
  const bounded = [plate, back].every((t) => Math.abs(t.x) <= DEPTH_LIMIT.x && Math.abs(t.y) <= DEPTH_LIMIT.y);
  check("1440 mouse: pointer depth moves plate and back frame", moved, `plate ${JSON.stringify(plate)}, back ${JSON.stringify(back)}`);
  check(`1440 mouse: depth stays within ±${DEPTH_LIMIT.x}px / ±${DEPTH_LIMIT.y}px`, bounded);
  check("1440 mouse: plate and back frame move in opposite directions", Math.sign(plate.x) === -Math.sign(back.x) && plate.x !== 0);
  check("1440 mouse: no horizontal overflow at full depth", (await overflowX(page)) <= 0, `${await overflowX(page)}px`);

  // Leave the hero (onto the fixed header, which is not part of the section).
  await page.mouse.move(720, 20, { steps: 4 });
  await wait(1300);
  const rested = await translate(page, PLATE);
  check("1440 mouse: depth returns to rest on pointer leave", isIdentity(rested) && isIdentity(await translate(page, BACK)), JSON.stringify(rested));

  // Scroll parallax.
  const nameBefore = await translate(page, NAME);
  await scrollToY(page, 400);
  await wait(400);
  const plateScrolled = await translate(page, PLATE);
  const nameScrolled = await translate(page, NAME);
  check("1440 scroll: plate parallax moves up", plateScrolled.y < -1, `y ${plateScrolled.y}px`);
  check("1440 scroll: name parallax moves down", nameScrolled.y > nameBefore.y + 1, `y ${nameBefore.y} → ${nameScrolled.y}px`);
  check("1440 scroll: no horizontal overflow", (await overflowX(page)) <= 0, `${await overflowX(page)}px`);
  await scrollToY(page, 0);
  await wait(400);
  check("1440 scroll: parallax returns at the top", isIdentity(await translate(page, PLATE)) && isIdentity(await translate(page, NAME)));

  await context.close();
}

/** Pointer sweep + scroll, then assert no GSAP transform landed on the plate, back frame or name. */
async function noMotion(browser, base, label, options) {
  const { context, page } = await open(browser, base, options);
  const { width, height } = options.viewport;
  for (const [x, y] of [[width * 0.2, height * 0.3], [width * 0.8, height * 0.7]]) {
    await page.mouse.move(x, y, { steps: 6 });
  }
  await wait(1000);
  const afterPointer = await Promise.all([PLATE, BACK, NAME].map((s) => translate(page, s)));
  check(`${label}: no pointer depth transforms`, afterPointer.every(isIdentity), JSON.stringify(afterPointer));
  await scrollToY(page, 300);
  await wait(500);
  const afterScroll = await Promise.all([PLATE, NAME].map((s) => translate(page, s)));
  check(`${label}: no parallax transforms`, afterScroll.every(isIdentity), JSON.stringify(afterScroll));
  check(`${label}: no horizontal overflow`, (await overflowX(page)) <= 0, `${await overflowX(page)}px`);
  await context.close();
}

/** Where the primary hero button sits in the first viewport. */
async function fold(browser, base, viewport, required) {
  const { context, page } = await open(browser, base, { viewport, hasTouch: true, isMobile: true });
  const r = await page.evaluate(() => {
    const b = document.querySelector('[data-hero="ctas"] a')?.getBoundingClientRect();
    return b ? { top: Math.round(b.top), bottom: Math.round(b.bottom) } : null;
  });
  const label = `${viewport.width}x${viewport.height}: primary button top ${r?.top}px, bottom ${r?.bottom}px`;
  if (required) check(`${viewport.width}x${viewport.height}: primary button fully above the fold`, !!r && r.bottom <= viewport.height, label);
  else info(`${viewport.width}x${viewport.height}: primary button position`, label);
  await context.close();
}

await withProdServer(3100, async (base) => {
  const browser = await chromium.launch({ args: ["--disable-lcd-text"] }); // see shots.mjs
  try {
    await desktop(browser, base);
    await noMotion(browser, base, "1440 reduced motion", { viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
    await noMotion(browser, base, "390 touch", { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    await fold(browser, base, { width: 390, height: 844 }, true);
    await fold(browser, base, { width: 375, height: 667 }, false);
  } finally {
    await browser.close();
  }
  const failed = results.filter((ok) => !ok).length;
  console.log(`\n${results.length - failed}/${results.length} passed.`);
  return failed > 0 ? 1 : 0;
});
