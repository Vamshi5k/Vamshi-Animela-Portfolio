// Hero motion checks against a production build.
// Usage: npm run motion:check   (builds, serves on 3100, runs checks, stops the server)
// Also checks the technology marquee (loop geometry, hover, pause, velocity, reduced motion, touch, no-JS).
// Desktop with a mouse: pointer depth moves within bounds and returns on leave; scroll parallax moves
// without horizontal overflow. Reduced motion and 390 touch: no parallax or pointer transforms.
import { chromium } from "playwright";
import { tech } from "../src/data/tech.ts";
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

// ---------------------------------------------------------------------------------------------
// Marquee
// ---------------------------------------------------------------------------------------------

const marquee = (page) =>
  page.evaluate(() => {
    const track = document.querySelector(".marquee-track");
    const sets = [...track.querySelectorAll(":scope > .marquee-set")];
    const anim = track.getAnimations()[0] ?? null;
    return {
      sets: sets.map((s) => [...s.querySelectorAll(".marquee-name")].map((n) => n.textContent)),
      setDisplay: sets.map((s) => getComputedStyle(s).display),
      animationName: getComputedStyle(track).animationName,
      playState: anim?.playState ?? null,
      playbackRate: anim?.playbackRate ?? null,
      currentTime: anim ? Math.round(anim.currentTime) : null,
      ariaHiddenTrack: track.closest("[aria-hidden='true']") !== null,
      srList: [...document.querySelectorAll(".marquee ul.sr-only li")].map((li) => li.textContent),
    };
  });

/**
 * Loop distance from the computed layout: the final keyframe's translateX (a % of the track's own
 * width) times the track width, against the distance between the starts of set one and set two.
 * Read-only: calling pause()/play() on a CSS animation would detach it from animation-play-state.
 */
const loopGeometry = (page) =>
  page.evaluate(() => {
    const track = document.querySelector(".marquee-track");
    const [a, b] = track.querySelectorAll(":scope > .marquee-set");
    const anim = track.getAnimations()[0];
    const frames = anim.effect.getKeyframes();
    const last = frames[frames.length - 1];
    // The minifier may serialise the keyframe as `transform: translate3d(-50%,…)` or `translate: -50%`.
    const end = String(last.transform ?? last.translate ?? JSON.stringify(last));
    const match = end.match(/(-?[\d.]+)%/);
    const percent = match ? Number.parseFloat(match[1]) : Number.NaN;
    const loopDistance = (-percent / 100) * track.getBoundingClientRect().width;
    const setWidth = b.getBoundingClientRect().left - a.getBoundingClientRect().left;
    return { loopDistance, setWidth, duration: anim.effect.getComputedTiming().duration, end };
  });

async function marqueeDesktop(browser, base) {
  const { context, page } = await open(browser, base, { viewport: { width: 1440, height: 900 } });
  await page.evaluate(() => document.querySelector(".marquee").scrollIntoView({ block: "center", behavior: "instant" }));
  await wait(400);

  const s = await marquee(page);
  const identical = s.sets.length === 2 && JSON.stringify(s.sets[0]) === JSON.stringify(s.sets[1]);
  check("marquee: track holds exactly two identical sets", identical, `${s.sets.length} sets × ${s.sets[0]?.length} items`);
  check("marquee: each set matches src/data/tech.ts in order", JSON.stringify(s.sets[0]) === JSON.stringify(tech));
  check("marquee: moving track is aria-hidden, screen readers get a plain list", s.ariaHiddenTrack && JSON.stringify(s.srList) === JSON.stringify(tech));

  const g = await loopGeometry(page);
  check(
    "marquee: loop translates by exactly one set's width (seamless)",
    Math.abs(g.loopDistance - g.setWidth) <= 0.5,
    `translate ${g.loopDistance.toFixed(2)}px vs set ${g.setWidth.toFixed(2)}px; keyframe ${g.end}`,
  );
  info("marquee 1440: speed", `${g.setWidth.toFixed(0)}px per ${(g.duration / 1000).toFixed(0)}s = ${(g.setWidth / (g.duration / 1000)).toFixed(1)}px/s`);

  // Hover pauses (desktop has hover).
  const box = await page.locator(".marquee-track").boundingBox();
  await page.mouse.move(720, box.y + box.height / 2);
  await wait(150);
  const t1 = (await marquee(page)).currentTime;
  await wait(400);
  const hovered = await marquee(page);
  check("marquee: hover pauses the row", hovered.playState === "paused" && hovered.currentTime === t1, `${hovered.playState}, t ${t1} → ${hovered.currentTime}`);
  await page.mouse.move(720, 20);
  await wait(200);
  check("marquee: leaving resumes the row", (await marquee(page)).playState === "running");

  // Pause toggle (WCAG 2.2.2).
  const toggle = page.locator(".marquee button[aria-pressed]");
  await toggle.click();
  await page.mouse.move(720, 20);
  await wait(200);
  const toggled = await marquee(page);
  check("marquee: PAUSE toggle stops the loop", toggled.playState === "paused" && (await toggle.getAttribute("aria-pressed")) === "true");
  await toggle.click();
  await page.mouse.move(720, 20);
  await wait(200);
  check("marquee: toggle again resumes it", (await marquee(page)).playState === "running" && (await toggle.getAttribute("aria-pressed")) === "false");

  // Velocity coupling (SPEC): faster on scroll down, reversed on scroll up.
  for (let i = 0; i < 6; i++) {
    await page.mouse.wheel(0, 120);
    await wait(30);
  }
  await wait(120);
  const down = (await marquee(page)).playbackRate;
  for (let i = 0; i < 6; i++) {
    await page.mouse.wheel(0, -120);
    await wait(30);
  }
  await wait(250);
  const up = (await marquee(page)).playbackRate;
  check("marquee: scrolling down speeds the loop up", down > 1.2, `playbackRate ${down.toFixed(2)}`);
  check("marquee: scrolling up reverses it", up < 0, `playbackRate ${up.toFixed(2)}`);
  check("marquee 1440: no horizontal overflow", (await overflowX(page)) <= 0, `${await overflowX(page)}px`);
  await context.close();
}

/** Reduced motion (SPEC §1a): a static wrapped list with every technology fully visible. */
async function marqueeReduced(browser, base, viewport) {
  const tag = `marquee reduced ${viewport.width}`;
  const { context, page } = await open(browser, base, { viewport, reducedMotion: "reduce" });
  await page.evaluate(() => document.querySelector(".marquee").scrollIntoView({ block: "center", behavior: "instant" }));
  await wait(200);
  const s = await marquee(page);
  const list = await page.evaluate(() => {
    const set = document.querySelector(".marquee-set");
    const items = [...set.children].map((el) => {
      const r = el.getBoundingClientRect();
      return { name: el.querySelector(".marquee-name").textContent, left: r.left, right: r.right, top: Math.round(r.top) };
    });
    const vw = document.documentElement.clientWidth;
    return {
      names: items.map((i) => i.name),
      allInside: items.every((i) => i.left >= 0 && i.right <= vw + 0.5),
      rows: new Set(items.map((i) => i.top)).size,
      lastSepShown: getComputedStyle(set.lastElementChild.querySelector(".marquee-sep")).display !== "none",
      toggleShown: getComputedStyle(document.querySelector(".marquee button")).display !== "none",
    };
  });
  check(`${tag}: animation is none`, s.animationName === "none" && s.playState === null, s.animationName);
  check(`${tag}: duplicate set hidden`, s.setDisplay[1] === "none");
  check(`${tag}: all ${tech.length} technologies listed in order`, JSON.stringify(list.names) === JSON.stringify(tech));
  check(`${tag}: list wraps and every item is fully inside the viewport`, list.rows > 1 && list.allInside, `${list.rows} rows`);
  check(`${tag}: no trailing separator`, !list.lastSepShown);
  check(`${tag}: no PAUSE toggle when nothing moves`, !list.toggleShown);
  check(`${tag}: no horizontal overflow`, (await overflowX(page)) <= 0, `${await overflowX(page)}px`);
  await context.close();
}

async function marqueeTouch(browser, base) {
  const { context, page } = await open(browser, base, { viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true });
  await page.evaluate(() => document.querySelector(".marquee").scrollIntoView({ block: "center", behavior: "instant" }));
  await wait(300);
  const box = await page.locator(".marquee-track").boundingBox();
  await page.touchscreen.tap(180, box.y + box.height / 2);
  await wait(300);
  const s = await marquee(page);
  check("marquee 375 touch: loop keeps running after a tap (no hover dependence)", s.playState === "running", s.playState);
  await page.evaluate(() => window.scrollBy({ top: 600, behavior: "instant" }));
  await wait(300);
  check("marquee 375 touch: no velocity coupling (constant speed)", (await marquee(page)).playbackRate === 1);
  const g = await loopGeometry(page);
  check("marquee 375: loop translates by exactly one set's width", Math.abs(g.loopDistance - g.setWidth) <= 0.5, `${g.loopDistance.toFixed(2)} vs ${g.setWidth.toFixed(2)}px`);
  info("marquee 375: speed", `${g.setWidth.toFixed(0)}px per ${(g.duration / 1000).toFixed(0)}s = ${(g.setWidth / (g.duration / 1000)).toFixed(1)}px/s`);
  check("marquee 375: no horizontal overflow", (await overflowX(page)) <= 0, `${await overflowX(page)}px`);
  await context.close();
}

async function marqueeNoJs(browser, base) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(base, { waitUntil: "load" });
  const s = await marquee(page);
  const visible = await page.locator(".marquee-track").isVisible();
  check("marquee: visible and moving without JavaScript (pure CSS)", visible && s.playState === "running", `${s.animationName}, ${s.playState}`);
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
    await marqueeDesktop(browser, base);
    await marqueeReduced(browser, base, { width: 1440, height: 900 });
    await marqueeReduced(browser, base, { width: 375, height: 812 });
    await marqueeTouch(browser, base);
    await marqueeNoJs(browser, base);
  } finally {
    await browser.close();
  }
  const failed = results.filter((ok) => !ok).length;
  console.log(`\n${results.length - failed}/${results.length} passed.`);
  return failed > 0 ? 1 : 0;
});
