// Hero motion checks against a production build.
// Usage: npm run motion:check   (builds, serves on 3100, runs checks, stops the server)
// Also checks the Expertise plate (entry decode, inversion scan by hover/focus/tap, reduced motion, overflow).
// Also checks the technology marquee (loop geometry, hover, pause, velocity, reduced motion, touch, no-JS).
// Desktop with a mouse: pointer depth moves within bounds and returns on leave; scroll parallax moves
// without horizontal overflow. Reduced motion and 390 touch: no parallax or pointer transforms.
import { chromium } from "playwright";
import { skills } from "../src/data/skills.ts";
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

/** `ready`: selector that marks the page as hydrated (the home page header by default). */
async function open(browser, base, options, ready = "header[data-ready]") {
  const context = await browser.newContext(options);
  const page = await context.newPage();
  await page.goto(base, { waitUntil: "networkidle" });
  await page.waitForSelector(ready);
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

// ---------------------------------------------------------------------------------------------
// Experience ruler
// ---------------------------------------------------------------------------------------------

/** Ruler state: scaleX of each desktop segment, opacity of each role, scaleY of the mobile cover. */
const ruler = (page) =>
  page.evaluate(() => {
    const m = (el) => new DOMMatrixReadOnly(getComputedStyle(el).transform);
    const opacity = (el) => +Number(getComputedStyle(el).opacity).toFixed(2);
    return {
      segs: [...document.querySelectorAll("[data-exp-seg]")].map((el) => +m(el).a.toFixed(3)),
      // Station dates + markers, and the fixed PRESENT station (desktop ruler).
      stations: [...document.querySelectorAll("[data-exp-ruler] [data-exp-station]")].map(opacity),
      // Each elbow leader: down (scaleY), across (scaleX), into the column (scaleY); min of the three.
      leaders: [...document.querySelectorAll("[data-exp-leader]")].map((l) => {
        const [down, across, into] = l.children;
        return +Math.min(m(down).d, m(across).a, m(into).d).toFixed(3);
      }),
      items: [...document.querySelectorAll("[data-exp-item]")].map(opacity),
      cover: +m(document.querySelector("[data-exp-mcover]")).d.toFixed(3),
    };
  });

/** Scrolls so the desktop ruler's top sits at `fraction` of the viewport height. */
const placeRuler = (page, fraction) =>
  page.evaluate((f) => {
    // The desktop ruler is display:none below lg; use whichever element is laid out.
    const desktopRuler = document.querySelector("[data-exp-ruler]");
    const el = desktopRuler?.getClientRects().length ? desktopRuler : document.querySelector("[data-exp-list]");
    const top = el.getBoundingClientRect().top + window.scrollY - window.innerHeight * f;
    window.scrollTo({ top, behavior: "instant" });
  }, fraction);

const all = (xs, v) => xs.length > 0 && xs.every((x) => x === v);
const drawn = (r) => all(r.segs, 1) && all(r.stations, 1) && all(r.leaders, 1) && all(r.items, 1);

async function experienceDesktop(browser, base) {
  const { context, page } = await open(browser, base, { viewport: { width: 1440, height: 900 } });
  await placeRuler(page, 0.95); // before the trigger start (top 80%)
  await wait(900);
  const before = await ruler(page);
  check(
    "experience 1440: ruler, stations and leaders undrawn before the trigger",
    all(before.segs, 0) && all(before.stations, 0) && all(before.leaders, 0),
    JSON.stringify(before),
  );
  await placeRuler(page, 0.55); // about halfway between start (80%) and end (30%)
  await wait(900);
  const mid = await ruler(page);
  const partial = mid.segs.some((s) => s > 0) && mid.segs.some((s) => s < 1);
  check("experience 1440: ruler progress follows scroll (partially drawn midway)", partial, JSON.stringify(mid));
  await placeRuler(page, 0.2); // past the end
  await wait(900);
  const after = await ruler(page);
  check("experience 1440: past the end, ruler drawn, stations visible, leaders drawn, roles visible", drawn(after), JSON.stringify(after));

  // Each leader's last piece lands on its column's left edge.
  const landing = await page.evaluate(() =>
    [...document.querySelectorAll("[data-exp-leader]")].map((l, i) => {
      const into = l.children[2].getBoundingClientRect().left;
      const col = document.querySelectorAll("[data-exp-item]")[i].getBoundingClientRect().left;
      return +(into - col).toFixed(1);
    }),
  );
  check("experience 1440: elbow leaders land on their columns (±1px)", landing.every((d) => Math.abs(d) <= 1), JSON.stringify(landing));
  check("experience 1440: no horizontal overflow", (await overflowX(page)) <= 0, `${await overflowX(page)}px`);
  await scrollToY(page, 0);
  await wait(900);
  const reset = await ruler(page);
  check("experience 1440: ruler and leaders reset at the top of the page", all(reset.segs, 0) && all(reset.leaders, 0), JSON.stringify(reset));
  await context.close();
}

async function experienceStatic(browser, base, label, options) {
  const { context, page } = await open(browser, base, options);
  const atTop = await ruler(page);
  await placeRuler(page, 0.5);
  await wait(1800); // allow a one-time draw on enter to finish where it applies
  const inView = await ruler(page);
  await placeRuler(page, 0.95);
  await wait(500);
  const backOut = await ruler(page);
  await scrollToY(page, 0);
  await wait(500);
  const top = await ruler(page);
  return { context, page, atTop, inView, backOut, top, label };
}

async function experienceReduced(browser, base) {
  const desk = await experienceStatic(browser, base, "experience reduced 1440", { viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  check("experience reduced 1440: ruler fully drawn at every scroll position (no scrub)", [desk.atTop, desk.inView, desk.backOut, desk.top].every(drawn), JSON.stringify(desk.atTop));
  await desk.context.close();

  // The mobile cover only has a box below lg (display:none elements report transform "none").
  const mob = await experienceStatic(browser, base, "experience reduced 390", { viewport: { width: 390, height: 844 }, reducedMotion: "reduce" });
  check(
    "experience reduced 390: no draw, cover never applied and roles always visible",
    [mob.atTop, mob.inView, mob.backOut, mob.top].every((x) => x.cover === 0 && all(x.items, 1)),
    JSON.stringify(mob.atTop),
  );
  await mob.context.close();
}

async function experienceTouch(browser, base) {
  const r = await experienceStatic(browser, base, "experience 390 touch", { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  check("experience 390 touch: drawn once on enter, roles visible", r.inView.cover === 0 && all(r.inView.items, 1), JSON.stringify(r.inView));
  check("experience 390 touch: no scrub, stays drawn when scrolling away and back to the top", [r.backOut, r.top].every((x) => x.cover === 0 && all(x.items, 1)));
  await r.context.close();

  const { context, page } = await open(browser, base, { viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true });
  await placeRuler(page, 0.5);
  await wait(500);
  check("experience 375: no horizontal overflow", (await overflowX(page)) <= 0, `${await overflowX(page)}px`);
  await context.close();
}

// ---------------------------------------------------------------------------------------------
// Viewfinder cursor (shared layer; demo targets live on /dev/design-system)
// ---------------------------------------------------------------------------------------------

const cursorState = (page) =>
  page.evaluate(() => {
    const root = document.querySelector("[data-viewfinder]");
    if (!root) return null;
    const m = new DOMMatrixReadOnly(getComputedStyle(root).transform);
    const label = root.querySelector(".viewfinder-label");
    const cross = root.querySelector(".viewfinder-cross");
    const tl = new DOMMatrixReadOnly(getComputedStyle(root.querySelector('[data-corner="tl"]')).transform);
    return {
      state: root.dataset.state,
      x: +m.m41.toFixed(1),
      y: +m.m42.toFixed(1),
      shown: +getComputedStyle(root).opacity,
      cross: +getComputedStyle(cross).opacity,
      // Top-left bracket offset: 0 as a ring, negative (outward) while framing a label.
      frame: +tl.m41.toFixed(1),
      pill: +getComputedStyle(label).opacity,
      label: label.textContent,
      pillColour: getComputedStyle(label).color,
      pointerEvents: getComputedStyle(root).pointerEvents,
    };
  });

const centreOf = (page, selector) =>
  page.evaluate((s) => {
    const r = document.querySelector(s).getBoundingClientRect();
    return { x: Math.round(r.left + r.width / 2), y: Math.round(r.top + r.height / 2) };
  }, selector);

async function cursorDesktop(browser, base) {
  const { context, page } = await open(browser, base.replace(/\/$/, "") + "/dev/design-system", { viewport: { width: 1440, height: 900 } }, "main");
  const accent = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue("--color-accent").trim());

  const initial = await cursorState(page);
  check("cursor 1440: mounted with a mouse, hidden until the first pointer move", initial?.state === "hidden" && initial.shown === 0, JSON.stringify(initial));
  check("cursor: never intercepts the pointer (pointer-events: none)", initial?.pointerEvents === "none");

  await page.mouse.move(300, 300);
  await wait(400);
  await page.mouse.move(700, 500); // a jump: the viewfinder should trail, not snap
  await wait(16);
  const trailing = await cursorState(page);
  await wait(700);
  const settled = await cursorState(page);
  const lag = Math.hypot(700 - trailing.x, 500 - trailing.y);
  check("cursor 1440: trails the pointer with a lerped follow", lag > 2, `${lag.toFixed(1)}px behind one frame after a jump`);
  check("cursor 1440: settles on the pointer as a ring", settled.state === "ring" && settled.shown === 1 && settled.cross === 1 && settled.pill === 0 && settled.frame === 0 && Math.abs(settled.x - 700) <= 1 && Math.abs(settled.y - 500) <= 1, JSON.stringify(settled));

  for (const key of ["view", "copy", "drag", "open"]) {
    await page.locator(`[data-cursor="${key}"]`).scrollIntoViewIfNeeded();
    const c = await centreOf(page, `[data-cursor="${key}"]`);
    await page.mouse.move(c.x, c.y, { steps: 4 });
    await wait(450);
    const s = await cursorState(page);
    check(
      `cursor: data-cursor="${key}" frames a ${key.toUpperCase()} label (brackets slide out; light, never lime)`,
      s.state === key && s.pill === 1 && s.cross === 0 && s.frame < -2 && s.label === key.toUpperCase() && !s.pillColour.includes(accent),
      `${s.state} "${s.label}" frame ${s.frame}px ${s.pillColour}`,
    );
  }

  const none = await centreOf(page, '[data-cursor="none"]');
  await page.mouse.move(none.x, none.y, { steps: 4 });
  await wait(400);
  const hiddenNone = await cursorState(page);
  check('cursor: data-cursor="none" hides it', hiddenNone.state === "hidden" && hiddenNone.shown === 0);

  const field = await centreOf(page, "[data-cursor-field]");
  await page.mouse.move(field.x, field.y, { steps: 4 });
  await wait(400);
  check("cursor: hidden over text fields", (await cursorState(page)).state === "hidden");

  await page.mouse.move(1438, 400, { steps: 4 });
  await wait(700);
  check("cursor 1440: no horizontal overflow at the right edge", (await overflowX(page)) <= 0, `${await overflowX(page)}px`);
  await context.close();
}

async function cursorAbsent(browser, base, label, options) {
  const { context, page } = await open(browser, base.replace(/\/$/, "") + "/dev/design-system", options, "main");
  await page.mouse.move(100, 200);
  await page.mouse.move(options.viewport.width - 5, 300, { steps: 4 });
  await wait(400);
  check(`cursor ${label}: no cursor element exists`, (await cursorState(page)) === null);
  check(`cursor ${label}: no horizontal overflow`, (await overflowX(page)) <= 0, `${await overflowX(page)}px`);
  await context.close();
}

// ---------------------------------------------------------------------------------------------
// Expertise spec plate (§03): entry fill + decode, inversion scan (hover, focus, tap), reduced motion
// ---------------------------------------------------------------------------------------------

const ROW = (i) => `[data-plate-row="${i}"]`;
const clipFull = (c) => /^inset\(0(px|%)?\)$/.test(c);
const clipHidden = (c) => c.includes("100%");

const plate = (page) =>
  page.evaluate(() =>
    [...document.querySelectorAll("[data-plate-row]")].map((row) => {
      const fill = row.querySelector("[data-plate-fill]");
      const inverse = row.querySelector(".plate-inverse");
      return {
        role: row.getAttribute("role"),
        tabIndex: row.getAttribute("tabindex"),
        ariaLabel: row.getAttribute("aria-label"),
        active: row.hasAttribute("data-active"),
        heading: row.querySelector("h3")?.textContent,
        visual: row.querySelector("[data-plate-label]")?.textContent,
        fillClip: getComputedStyle(fill).clipPath,
        fillVisible: getComputedStyle(fill).visibility === "visible",
        fillOpacity: +getComputedStyle(fill).opacity,
        dim: +getComputedStyle(row.querySelector(".plate-dim")).opacity,
        inverseClip: getComputedStyle(inverse).clipPath,
        inverseTransition: getComputedStyle(inverse).transitionDuration,
        readout: row.querySelector("[data-plate-readout]")?.textContent,
      };
    }),
  );

const sectionTop = (page) => page.evaluate(() => document.getElementById("expertise").getBoundingClientRect().top + window.scrollY);

/** Scroll the whole plate through the viewport so every row's entry trigger fires. */
async function scrollPlateThrough(page, height) {
  const top = await sectionTop(page);
  const h = await page.evaluate(() => document.getElementById("expertise").offsetHeight);
  for (let y = top - height; y <= top + h; y += height / 3) {
    await scrollToY(page, y);
    await wait(120);
  }
  await wait(1200);
}

async function expertiseDesktop(browser, base) {
  const { context, page } = await open(browser, base, { viewport: { width: 1440, height: 900 } });
  const before = await plate(page);
  check("expertise: six rows, each a focusable group (role=group, tabindex=0)", before.length === skills.length && before.every((r) => r.role === "group" && r.tabIndex === "0"));
  check(
    "expertise: each row's aria-label names the group and lists its items from src/data/skills.ts",
    before.every((r, i) => r.ariaLabel === `${skills[i].label}: ${skills[i].items.join(", ")}`),
  );
  check("expertise: real label text present before entry (heading and visual copy)", before.every((r, i) => r.heading === skills[i].label && r.visual === skills[i].label));
  check("expertise: label fills wait below the fold (wiped out to the outline)", clipHidden(before[0].fillClip), before[0].fillClip);

  // Entry on row 0: decode settles on the real text within one second; the heading never changes.
  const top = await sectionTop(page);
  const rowTop = await page.evaluate((s) => document.querySelector(s).getBoundingClientRect().top + window.scrollY, ROW(0));
  await scrollToY(page, top - 900 + 200); // section header in view, row 0 still below the 85% trigger
  await wait(200);
  const t0 = Date.now();
  await scrollToY(page, rowTop - 400);
  let scrambled = false;
  let headingStable = true;
  let settledAt = null;
  while (Date.now() - t0 < 2000) {
    const r = (await plate(page))[0];
    if (r.heading !== skills[0].label) headingStable = false;
    if (r.visual !== skills[0].label) scrambled = true;
    else if (scrambled && settledAt === null) settledAt = Date.now() - t0;
    await wait(30);
  }
  check("expertise 1440: entry decode scrambles the visual label", scrambled);
  check("expertise 1440: decode ends on the real text within 1s", settledAt !== null && settledAt <= 1000, `${settledAt}ms`);
  check("expertise: accessible heading never scrambles", headingStable);

  await scrollPlateThrough(page, 900);
  const drawn = await plate(page);
  check("expertise 1440: every label filled solid after entry", drawn.every((r) => r.fillVisible && clipFull(r.fillClip) && r.fillOpacity === 1), drawn.map((r) => r.fillClip).join(" | "));
  check("expertise 1440: every visual label ends on its real text", drawn.every((r, i) => r.visual === skills[i].label));

  // Signature moment: hover row 1 (12 items).
  const count = skills[1].items.length;
  const final = `${String(count).padStart(2, "0")} / ${String(count).padStart(2, "0")}`;
  await page.locator(ROW(1)).scrollIntoViewIfNeeded();
  await page.mouse.move(5, 5);
  await wait(300);
  const box = await page.locator(ROW(1)).boundingBox();
  await page.mouse.move(box.x + box.width * 0.6, box.y + box.height * 0.5);
  const readouts = new Set();
  const t1 = Date.now();
  while (Date.now() - t1 < 500) {
    readouts.add((await plate(page))[1].readout);
    await wait(15);
  }
  await wait(300);
  const hovered = await plate(page);
  check("expertise 1440 hover: row floods cream (inverse clip-path wiped to inset 0)", hovered[1].active && clipFull(hovered[1].inverseClip), hovered[1].inverseClip);
  check(
    "expertise 1440 hover: neighbours fall back to hollow outlines and dim",
    hovered.every((r, i) => i === 1 || (r.fillOpacity === 0 && r.dim < 0.5 && clipHidden(r.inverseClip))),
    hovered.map((r) => `${r.fillOpacity}/${r.dim}`).join(" "),
  );
  check("expertise 1440 hover: count ticks up through intermediate values to the total", [...readouts].some((v) => v !== final && !v.startsWith("00")) && hovered[1].readout === final, [...readouts].join(", "));

  const vf = await page.evaluate(() => {
    const root = document.querySelector("[data-viewfinder]");
    return root ? { state: root.dataset.state, shown: +getComputedStyle(root).opacity, blend: getComputedStyle(root).mixBlendMode } : null;
  });
  check("expertise 1440 hover: viewfinder stays visible over the cream row (difference blend)", vf?.shown === 1 && vf.state !== "hidden" && vf.blend === "difference", JSON.stringify(vf));
  check("expertise 1440: no horizontal overflow with a row inverted", (await overflowX(page)) <= 0, `${await overflowX(page)}px`);

  await page.mouse.move(box.x + box.width * 0.6, box.y - 400 > 60 ? box.y - 400 : 60); // up into the header area
  await page.mouse.move(5, 70);
  await wait(500);
  const left = await plate(page);
  check("expertise 1440: pointer leave reverts the row and the neighbours", left.every((r) => !r.active && clipHidden(r.inverseClip) && r.fillOpacity === 1));

  // Keyboard: Tab from row 0 to row 1 moves the inversion; blur reverts.
  await page.locator(ROW(0)).focus();
  await wait(700);
  const f0 = await plate(page);
  await page.keyboard.press("Tab");
  await wait(500);
  const f1 = await plate(page);
  check("expertise 1440 keyboard: focus inverts the row", f0[0].active && clipFull(f0[0].inverseClip), `${f0[0].active} ${f0[0].inverseClip}`);
  check("expertise 1440 keyboard: Tab moves the inversion to the next row", f1[1].active && !f1[0].active && clipFull(f1[1].inverseClip) && f1[0].fillOpacity === 0);
  await page.evaluate(() => document.activeElement.blur());
  await wait(500);
  check("expertise 1440 keyboard: blur reverts", (await plate(page)).every((r) => !r.active && clipHidden(r.inverseClip)));
  await context.close();
}

async function expertiseReduced(browser, base) {
  const { context, page } = await open(browser, base, { viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  let scrambled = false;
  const top = await sectionTop(page);
  for (let y = top - 900; y <= top + 1200; y += 150) {
    await scrollToY(page, y);
    for (let k = 0; k < 4; k++) {
      if ((await plate(page)).some((r, i) => r.visual !== skills[i].label)) scrambled = true;
      await wait(25);
    }
  }
  const s = await plate(page);
  check("expertise reduced: no decode (labels never scramble)", !scrambled);
  check("expertise reduced: labels solid at once, no wipe", s.every((r) => r.fillVisible && (r.fillClip === "none" || clipFull(r.fillClip))), s[0].fillClip);
  check("expertise reduced: inversion has no transition (instant colour change)", s.every((r) => parseFloat(r.inverseTransition) < 0.01), s[0].inverseTransition);
  await page.locator(ROW(1)).focus();
  await wait(60);
  const f = await plate(page);
  const count = String(skills[1].items.length).padStart(2, "0");
  check("expertise reduced: focus inverts at once, count shows the total (no tick)", f[1].active && clipFull(f[1].inverseClip) && f[1].readout === `${count} / ${count}`, `${f[1].inverseClip} ${f[1].readout}`);
  await context.close();
}

async function expertiseTouch(browser, base, viewport) {
  const tag = `expertise ${viewport.width} touch`;
  const { context, page } = await open(browser, base, { viewport, hasTouch: true, isMobile: true });
  await scrollPlateThrough(page, viewport.height);
  const drawn = await plate(page);
  check(`${tag}: labels filled after entry, nothing active without a tap`, drawn.every((r) => r.fillVisible && clipFull(r.fillClip) && !r.active));
  const tap = async (i) => {
    await page.locator(ROW(i)).scrollIntoViewIfNeeded();
    const b = await page.locator(ROW(i)).boundingBox();
    await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2);
    await wait(500);
    return plate(page);
  };
  const on = await tap(5);
  check(`${tag}: tap inverts the row (12 items)`, on[5].active && clipFull(on[5].inverseClip), on[5].inverseClip);
  check(`${tag}: no horizontal overflow with a row inverted`, (await overflowX(page)) <= 0, `${await overflowX(page)}px`);
  const off = await tap(5);
  check(`${tag}: second tap toggles it off`, !off[5].active && clipHidden(off[5].inverseClip));
  await tap(4);
  const moved = await tap(3);
  check(`${tag}: tapping another row moves the inversion`, moved[3].active && !moved[4].active);
  await context.close();
}

/** Wrapped item lines: no line starts or ends with a visible separator; dark and inverted layers break identically. */
async function expertiseSeparators(browser, base, viewport, touch) {
  const tag = `expertise ${viewport.width}`;
  const { context, page } = await open(browser, base, { viewport, hasTouch: touch, isMobile: touch });
  await scrollPlateThrough(page, viewport.height);
  const rows = await page.evaluate(() =>
    [...document.querySelectorAll("[data-plate-row]")].map((row) =>
      [...row.querySelectorAll("[data-plate-items]")].map((box) => {
        const clip = box.getBoundingClientRect();
        const lines = [];
        for (const li of box.querySelectorAll("li")) {
          const r = li.getBoundingClientRect();
          const sep = li.querySelector("[data-plate-sep]").getBoundingClientRect();
          // Visible part of the separator glyph box inside the clip.
          const visible = Math.min(sep.right, clip.right) - Math.max(sep.left, clip.left) > 0.5;
          const last = lines.at(-1);
          const entry = { text: li.textContent.replace(/^\//, ""), sepVisible: visible, endsWithSep: li.lastChild.nodeType !== Node.TEXT_NODE, overflowsRight: r.right > clip.right + 0.5 };
          if (last && Math.abs(last.top - r.top) < 2) last.items.push(entry);
          else lines.push({ top: r.top, items: [entry] });
        }
        return lines.map((l) => l.items);
      }),
    ),
  );
  const bad = [];
  rows.forEach((layers, i) =>
    layers.forEach((lines, layer) =>
      lines.forEach((items, n) => {
        if (items[0].sepVisible) bad.push(`row ${i} layer ${layer} line ${n} starts with "/"`);
        if (items.some((it) => it.endsWithSep)) bad.push(`row ${i} layer ${layer} line ${n} ends with "/"`);
        if (items.slice(1).some((it) => !it.sepVisible)) bad.push(`row ${i} layer ${layer} line ${n} lost an inner "/"`);
        if (items.some((it) => it.overflowsRight)) bad.push(`row ${i} layer ${layer} line ${n} overflows its column`);
      }),
    ),
  );
  check(`${tag}: no wrapped line starts or ends with a separator (both layers)`, bad.length === 0, bad.slice(0, 4).join("; ") || `${rows.reduce((n, l) => n + l[0].length, 0)} lines`);
  const shape = (lines) => JSON.stringify(lines.map((l) => l.map((it) => it.text)));
  check(`${tag}: dark and inverted layers break lines identically`, rows.every(([a, b]) => b && shape(a) === shape(b)));
  check(`${tag}: 12-item rows wrap (multi-line check is meaningful)`, rows[1][0].length > 1 && rows[5][0].length > 1, `${rows[1][0].length} / ${rows[5][0].length} lines`);
  await context.close();
}

// ---------------------------------------------------------------------------------------------
// About manuscript (§06): bio split, read-through scrub, caret, type-in, contrast, reduced, touch
// ---------------------------------------------------------------------------------------------

const norm = (s) => s.replace(/\s+/g, " ").trim();
const BG = [9, 9, 9];
const lum = ([r, g, b]) => {
  const c = (v) => ((v /= 255) <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * c(r) + 0.7152 * c(g) + 0.0722 * c(b);
};
const contrast = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

/** Per-word opacity (including ancestors) and effective colour blended over the page background. */
const reading = (page) =>
  page.evaluate(() => {
    const words = [...document.querySelectorAll("[data-read-word]")].map((el) => {
      let o = 1;
      for (let n = el; n && n !== document.body; n = n.parentElement) o *= +getComputedStyle(n).opacity;
      const rgb = getComputedStyle(el).color.match(/[\d.]+/g).slice(0, 3).map(Number);
      return { o: +o.toFixed(3), rgb };
    });
    const lines = [...document.querySelectorAll("[data-type-line]")].map((el) => ({ clip: getComputedStyle(el).clipPath, visible: getComputedStyle(el).visibility === "visible" }));
    const caret = document.querySelector("[data-caret]");
    const cs = getComputedStyle(caret);
    const last = document.querySelectorAll("[data-read-word]");
    const lr = last[last.length - 1].getBoundingClientRect();
    const cr = caret.getBoundingClientRect();
    return {
      words,
      lines,
      numeralClip: getComputedStyle(document.querySelector("[data-numeral]")).clipPath,
      caret: {
        hidden: caret.getAttribute("aria-hidden") === "true",
        afterLast: cr.left >= lr.right - 1 && Math.abs(cr.bottom - lr.bottom) < lr.height,
        animation: cs.animationName,
        duration: parseFloat(cs.animationDuration),
        iterations: cs.animationIterationCount,
        opacity: +cs.opacity,
      },
      pinned: !!document.querySelector(".pin-spacer"),
    };
  });

const readCount = (r) => r.words.filter((w) => w.o > 0.99).length;
const blended = (w) => w.rgb.map((c, i) => c * w.o + BG[i] * (1 - w.o));
const quoteTop = (page) => page.evaluate(() => document.querySelector("[data-read]").getBoundingClientRect().top + window.scrollY);
/** Scroll so the quote's top sits at `frac` of the viewport height. */
const placeQuote = async (page, top, h, frac) => scrollToY(page, top - h * frac);

/** Scroll distance from the first word starting to read to the last word fully read. */
async function travel(page, h, settle) {
  const top = await quoteTop(page);
  let start = null;
  let end = null;
  for (let frac = 0.95; frac >= 0; frac -= 0.025) {
    await placeQuote(page, top, h, frac);
    await wait(settle);
    const r = await reading(page);
    if (start === null && r.words.some((w) => w.o > 0.56)) start = top - h * frac;
    if (end === null && readCount(r) === r.words.length) {
      end = top - h * frac;
      break;
    }
  }
  return start !== null && end !== null ? Math.round(end - start) : null;
}

async function aboutText(browser, base) {
  const { splitLead } = await import("../src/lib/text.ts");
  const { profile } = await import("../src/data/profile.ts");
  const cases = [
    ["Built with React.js and Next.js. Then v2.1 shipped.", "Built with React.js and Next.js."],
    ["Uses tools, e.g. Expo and EAS. Ships weekly.", "Uses tools, e.g. Expo and EAS."],
    ["Ranked No. 5 nationally. Then more.", "Ranked No. 5 nationally."],
    ["Mentored by J. Smith for a year. Then left.", "Mentored by J. Smith for a year."],
    ["One sentence only.", "One sentence only."],
  ];
  check("about: splitLead ignores periods in abbreviations, initials, numbers and versions", cases.every(([t, lead]) => splitLead(t)[0] === lead), cases.map(([t]) => splitLead(t)[0]).join(" | "));

  const { context, page } = await open(browser, base, { viewport: { width: 1440, height: 900 } });
  const dom = await page.evaluate(() => ({
    quote: [...document.querySelectorAll("[data-read-word]")].map((w) => w.textContent).join(" "),
    quoteText: document.querySelector("[data-read]").textContent,
    bio: document.querySelector("[data-bio]")?.textContent ?? "",
    learning: [...document.querySelectorAll("[data-fact='credentials'] [data-type-line]")].map((l) => ({ text: l.textContent, color: getComputedStyle(l).color })),
  }));
  check("about: quote + bio column reproduce profile.bio exactly (whitespace normalised)", norm(`${dom.quote} ${dom.bio}`) === norm(profile.bio), `${norm(dom.quote).length} + ${norm(dom.bio).length} chars`);
  check("about: quote is the bio's first sentence, not repeated in the column", norm(dom.quoteText) === norm(splitLead(profile.bio)[0]) && !dom.bio.includes(dom.quote));
  const learn = dom.learning.find((l) => /react native/i.test(l.text));
  const learnRgb = learn ? learn.color.match(/[\d.]+/g).slice(0, 3).map(Number) : [0, 0, 0];
  const learnRatio = contrast(learnRgb, BG);
  check("about: muted learning line is at least 4.5:1 on #090909", learnRatio >= 4.5, `${learn?.color} = ${learnRatio.toFixed(2)}:1`);
  check("about: React Native course labelled as learning, never as a certificate", !!learn && /learning/i.test(learn.text) && !/certificate/i.test(learn.text), learn?.text);
  const strokes = [];
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await wait(200);
    strokes.push(await page.evaluate(() => getComputedStyle(document.querySelector("[data-numeral]")).webkitTextStrokeWidth));
  }
  check("about: numeral outline is 2px on desktop, 1.5px on phones", strokes[0] === "2px" && strokes[1] === "1.5px", strokes.join(" / "));
  await context.close();
}

async function aboutDesktop(browser, base) {
  const h = 900;
  const { context, page } = await open(browser, base, { viewport: { width: 1440, height: h } });
  const top = await quoteTop(page);
  const lineCount = await page.evaluate(() => new Set([...document.querySelectorAll("[data-read-word]")].map((e) => Math.round(e.getBoundingClientRect().top))).size);
  check("about 1440: quote sets in at most 4 lines", lineCount <= 4, `${lineCount} lines`);

  for (let y = top - 2 * h; y < top - h; y += h / 3) {
    await scrollToY(page, y);
    await wait(100);
  }
  const before = await reading(page);
  check("about 1440: before the scrub, every word is unread and lines wait to type", readCount(before) === 0 && before.lines.every((l) => l.visible && clipHidden(l.clip)), `${readCount(before)} read`);
  const worst = Math.min(...before.words.map((w) => contrast(blended(w), BG)));
  check("about: unread words stay ≥ 4.5:1 on #090909", worst >= 4.5, `${worst.toFixed(2)}:1`);

  await placeQuote(page, top, h, 0.5);
  await wait(900);
  const mid = await reading(page);
  const ops = mid.words.map((w) => w.o);
  const ordered = ops.every((o, i) => i === 0 || o <= ops[i - 1] + 0.001);
  check("about 1440: mid-scrub, words read one by one in order (a read prefix, the rest unread)", readCount(mid) > 0 && readCount(mid) < ops.length && ordered, `${readCount(mid)}/${ops.length}`);
  check("about 1440: in normal flow (no pinning)", !mid.pinned);

  await placeQuote(page, top, h, 0.82);
  await wait(900);
  check("about 1440: scrolling back un-reads the words (scrubbed, not one-shot)", readCount(await reading(page)) === 0);

  // End of the read-through: lines type in one at a time.
  await placeQuote(page, top, h, 0.15);
  const firstDone = [];
  const t0 = Date.now();
  let lastSample;
  while (Date.now() - t0 < 6000) {
    lastSample = await reading(page);
    lastSample.lines.forEach((l, i) => {
      if (firstDone[i] === undefined && clipFull(l.clip)) firstDone[i] = Date.now() - t0;
    });
    if (firstDone.filter((x) => x !== undefined).length === lastSample.lines.length) break;
    await wait(20);
  }
  const all = readCount(lastSample) === lastSample.words.length;
  const sequential = firstDone.length === lastSample.lines.length && firstDone.every((t, i) => t !== undefined && (i === 0 || t >= firstDone[i - 1]));
  check("about 1440: read-through ends with every word full text", all);
  check("about 1440: fact-sheet lines then type in, one at a time, in order", sequential && firstDone.at(-1) > firstDone[0], firstDone.join(", ") + "ms");
  check("about 1440: numeral revealed", clipFull(lastSample.numeralClip), lastSample.numeralClip);
  check("about 1440: caret sits after the last word, aria-hidden, blinking", lastSample.caret.hidden && lastSample.caret.afterLast && lastSample.caret.animation === "caret-blink" && lastSample.caret.iterations === "infinite", JSON.stringify(lastSample.caret));
  check("about 1440: no horizontal overflow", (await overflowX(page)) <= 0, `${await overflowX(page)}px`);
  await placeQuote(page, top, h, 1.2);
  await wait(900);
  const desktopTravel = await travel(page, h, 700);
  info("about 1440: read-through travel", `${desktopTravel}px`);
  await context.close();
  return desktopTravel;
}

async function aboutTouch(browser, base, viewport, desktopTravel) {
  const tag = `about ${viewport.width} touch`;
  const { context, page } = await open(browser, base, { viewport, hasTouch: true, isMobile: true });
  const top = await quoteTop(page);
  for (let y = top - 2 * viewport.height; y < top - viewport.height; y += viewport.height / 3) {
    await scrollToY(page, y);
    await wait(100);
  }
  const t = await travel(page, viewport.height, 120);
  check(`${tag}: read-through scrubs on touch, with shorter travel than desktop`, t !== null && desktopTravel !== null && t < desktopTravel, `${t}px vs ${desktopTravel}px`);
  const order = await page.evaluate(() => {
    const y = (s) => document.querySelector(s).getBoundingClientRect().top;
    return y("[data-read]") < y("[data-bio]") && y("[data-bio]") < y("[data-numeral]") && y("[data-numeral]") < y("[data-fact='location']");
  });
  check(`${tag}: phone reading order is quote, bio, numeral, facts`, order);
  const sheetTop = await page.evaluate(() => document.querySelector("[data-sheet]").getBoundingClientRect().top + window.scrollY);
  await scrollToY(page, sheetTop - viewport.height * 0.4);
  await wait(4000);
  const r = await reading(page);
  check(`${tag}: every word read and every line typed`, readCount(r) === r.words.length && r.lines.every((l) => clipFull(l.clip)));
  check(`${tag}: no horizontal overflow`, (await overflowX(page)) <= 0, `${await overflowX(page)}px`);
  await context.close();
}

async function aboutStatic(browser, base, label, options) {
  const { context, page } = await open(browser, base, options, options.javaScriptEnabled === false ? "main" : undefined);
  const top = await quoteTop(page);
  const h = options.viewport.height;
  let allFull = true;
  for (const frac of [1.2, 0.8, 0.5, 0.2, -0.3]) {
    await placeQuote(page, top, h, frac);
    await wait(150);
    const r = await reading(page);
    if (!r.words.every((w) => w.o === 1) || !r.lines.every((l) => l.visible && (l.clip === "none" || clipFull(l.clip)))) allFull = false;
  }
  const r = await reading(page);
  check(`about ${label}: every word full text and every line visible at every scroll position`, allFull);
  if (options.reducedMotion === "reduce") check(`about ${label}: caret static and visible`, r.caret.duration < 0.01 && r.caret.opacity === 1, JSON.stringify(r.caret));
  await context.close();
}

// ---------------------------------------------------------------------------------------------
// Contact (§07): proximity type, reserved width, copy paths, links, reduced motion, touch, no JS
// ---------------------------------------------------------------------------------------------

const EMAIL = "[data-email]";

const emailState = (page) =>
  page.evaluate(() => {
    const box = document.querySelector(".contact-email-box");
    const line = document.querySelector("[data-email]");
    const letters = [...line.querySelectorAll("[data-letter]")];
    return {
      fitted: box.dataset.fitted,
      box: box.getBoundingClientRect().toJSON(),
      boxWidth: box.clientWidth,
      line: line.getBoundingClientRect().width,
      lineScroll: line.scrollWidth,
      stretch: letters.map((l) => parseFloat(getComputedStyle(l).fontStretch)),
      next: document.querySelector("[data-contact-link]").getBoundingClientRect().top,
      doc: document.documentElement.scrollHeight,
      ox: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });

async function toContact(page) {
  await page.evaluate(() => document.getElementById("contact").scrollIntoView({ behavior: "instant", block: "center" }));
  await page.evaluate(() => document.fonts.ready);
  await wait(500);
}

const copyStatus = (page) =>
  page.evaluate(() => ({ state: document.querySelector("[data-copy-status]").dataset.copyStatus, live: document.querySelector("[data-copy-status]").textContent, visible: document.querySelector("[data-copy-visible]").textContent }));

async function contactStructure(browser, base) {
  const { contact } = await import("../src/data/contact.ts");
  const { context, page } = await open(browser, base, { viewport: { width: 1440, height: 900 } });
  await toContact(page);
  const a = await page.evaluate(() => {
    const line = document.querySelector("[data-email]");
    const letters = [...line.querySelectorAll("[data-letter]")];
    return {
      role: line.getAttribute("role"),
      tab: line.getAttribute("tabindex"),
      name: line.getAttribute("aria-label"),
      cursor: line.dataset.cursor,
      lettersHidden: letters.every((l) => l.getAttribute("aria-hidden") === "true"),
      text: letters.map((l) => l.textContent).join(""),
      mailto: document.querySelector("[data-mailto]")?.getAttribute("href"),
      links: [...document.querySelectorAll("[data-contact-link]")].map((l) => ({ id: l.dataset.contactLink, href: l.getAttribute("href"), target: l.target, rel: l.rel })),
    };
  });
  check("contact: email line is a focusable button named by the plain address", a.role === "button" && a.tab === "0" && a.name === contact.email);
  check('contact: letters are aria-hidden real text (selectable, copyable) and data-cursor="copy"', a.lettersHidden && a.text === contact.email && a.cursor === "copy");
  check("contact: plain mailto link", a.mailto === `mailto:${contact.email}`);
  check(
    "contact: LinkedIn and GitHub rows open safely in a new tab (noopener noreferrer)",
    contact.socials.every((s) => a.links.some((l) => l.href === s.href && l.target === "_blank" && /noopener/.test(l.rel) && /noreferrer/.test(l.rel))),
    JSON.stringify(a.links.map((l) => l.id)),
  );
  for (const s of contact.socials) {
    const n = await page.getByRole("link", { name: new RegExp(`^${s.label}\\b.*opens in a new tab`) }).count();
    check(`contact: "${s.label}" link has a clear accessible name (label + new tab)`, n === 1);
  }
  check("contact: no WhatsApp element while contact.whatsapp is null", contact.whatsapp !== null || !a.links.some((l) => l.id === "whatsapp"));
  await context.close();
}

async function contactWave(browser, base, viewport) {
  const tag = `contact ${viewport.width}`;
  const { context, page } = await open(browser, base, { viewport });
  await toContact(page);
  await page.mouse.move(5, 5);
  await wait(300);
  const rest = await emailState(page);
  check(`${tag}: wave mode, line fitted inside the box at rest`, rest.fitted === "wave" && rest.line <= rest.boxWidth && rest.stretch.every((s) => s === 75), `${Math.round(rest.line)} / ${rest.boxWidth}px`);

  const lb = await page.locator(EMAIL).boundingBox();
  const k = 10;
  const kx = await page.evaluate((i) => {
    const r = document.querySelectorAll("[data-letter]")[i].getBoundingClientRect();
    return r.left + r.width / 2;
  }, k);
  await page.mouse.move(kx, lb.y + lb.height / 2, { steps: 6 });
  await wait(600);
  const on = await emailState(page);
  check(`${tag}: letters near the pointer widen (wdth/wght follow distance), far letters stay at rest`, on.stretch[k] > 110 && on.stretch[on.stretch.length - 1] === 75 && on.stretch[0] === 75, `${on.stretch[k]}% at the pointer, ${on.stretch.at(-1)}% far`);

  // Slow and fast sweeps: the line never exceeds the box and nothing around it moves.
  let worst = 0;
  let shifted = [];
  const sweep = async (step, pause) => {
    for (let x = lb.x - 60; x <= lb.x + lb.width + 60; x += step) {
      await page.mouse.move(x, lb.y + lb.height * (0.3 + 0.4 * Math.random()));
      await wait(pause);
      const s = await emailState(page);
      worst = Math.max(worst, s.lineScroll - s.boxWidth);
      if (Math.abs(s.box.height - rest.box.height) > 0.5 || Math.abs(s.box.top - on.box.top) > 0.5 || Math.abs(s.next - on.next) > 0.5 || s.doc !== rest.doc || s.ox > 0) shifted.push(Math.round(x));
    }
  };
  await sweep(14, 16);
  await sweep(90, 0);
  await sweep(40, 30);
  check(`${tag}: the line never overflows its reserved box during slow and fast sweeps`, worst <= 0, `${worst}px over (≤ 0 passes)`);
  check(`${tag}: layout never shifts (box, following rows, page height, no overflow)`, shifted.length === 0, shifted.slice(0, 5).join(", "));

  await page.mouse.move(lb.x + lb.width / 2, lb.y - 300, { steps: 4 });
  await wait(1200);
  const off = await emailState(page);
  check(`${tag}: wave relaxes on leave`, off.stretch.every((s) => s === 75), off.stretch.join(","));
  check(`${tag}: no horizontal overflow`, off.ox <= 0, `${off.ox}px`);
  await context.close();
}

/** Frame times of the wave at 4x CPU throttle (desktop). */
async function contactFrames(browser, base) {
  const { context, page } = await open(browser, base, { viewport: { width: 1440, height: 900 } });
  await toContact(page);
  const cdp = await context.newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  const lb = await page.locator(EMAIL).boundingBox();
  await page.mouse.move(lb.x - 40, lb.y + lb.height / 2);
  await page.evaluate(() => {
    window.__frames = [];
    let last = performance.now();
    const end = last + 3000;
    const rec = (now) => {
      window.__frames.push(now - last);
      last = now;
      if (now < end) requestAnimationFrame(rec);
    };
    requestAnimationFrame(rec);
  });
  const t0 = Date.now();
  let x = lb.x - 40;
  let dir = 1;
  while (Date.now() - t0 < 3000) {
    x += dir * 24;
    if (x > lb.x + lb.width + 40 || x < lb.x - 40) dir *= -1;
    await page.mouse.move(x, lb.y + lb.height / 2);
  }
  await wait(200);
  const f = (await page.evaluate(() => window.__frames)).slice(2).sort((a, b) => a - b);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
  const pct = (p) => f[Math.min(f.length - 1, Math.floor(p * f.length))];
  const over = f.filter((v) => v > 20).length / f.length;
  info("contact wave @4x CPU: frame times", `${f.length} frames, p50 ${pct(0.5).toFixed(1)}ms, p95 ${pct(0.95).toFixed(1)}ms, max ${f.at(-1).toFixed(1)}ms, ${(over * 100).toFixed(1)}% over 20ms`);
  check("contact wave @4x CPU: smooth (p95 frame ≤ 20ms)", pct(0.95) <= 20, `p95 ${pct(0.95).toFixed(1)}ms`);
  await context.close();
}

async function contactCopy(browser, base) {
  const { contact } = await import("../src/data/contact.ts");
  const { ui } = await import("../src/data/ui.ts");
  const { context, page } = await open(browser, base, { viewport: { width: 1440, height: 900 } });
  await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: base });
  await toContact(page);

  await page.locator(EMAIL).click();
  await wait(300);
  const ok = await copyStatus(page);
  const clip = await page.evaluate(() => navigator.clipboard.readText());
  check("contact copy: click writes the email to the clipboard and shows Copied", ok.state === "copied" && ok.live === ui.contact.copied && ok.visible === ui.contact.copied && clip === contact.email, `${ok.state}, clipboard "${clip}"`);

  // "Copied" only after writeText resolves.
  await page.evaluate(() => {
    navigator.clipboard.writeText = () => new Promise((r) => setTimeout(r, 600));
  });
  await page.locator(EMAIL).focus();
  await page.keyboard.press("Enter");
  await wait(150);
  const pending = await copyStatus(page);
  await wait(700);
  const resolved = await copyStatus(page);
  check("contact copy: Enter copies; Copied appears only after the write resolves", pending.live !== ui.contact.copied && resolved.state === "copied", `${pending.state} at 150ms → ${resolved.state}`);

  await page.evaluate(() => {
    navigator.clipboard.writeText = () => Promise.reject(new Error("denied"));
  });
  await page.keyboard.press(" ");
  await wait(200);
  const failed = await copyStatus(page);
  check("contact copy: Space copies; a rejected write shows the honest failure message", failed.state === "failed" && failed.live === ui.contact.copyFailed && failed.visible === ui.contact.copyFailed, failed.visible);

  const focusOutline = await page.evaluate(() => getComputedStyle(document.querySelector("[data-email]")).outlineStyle);
  check("contact: visible keyboard focus state on the email line", focusOutline !== "none", focusOutline);
  await context.close();
}

async function contactStatic(browser, base, label, options) {
  const { ui } = await import("../src/data/ui.ts");
  const { context, page } = await open(browser, base, options, options.javaScriptEnabled === false ? "main" : undefined);
  if (options.javaScriptEnabled !== false) await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: base });
  await toContact(page);
  const s = await emailState(page);
  if (options.javaScriptEnabled === false) {
    check(`contact ${label}: email visible and inside the width without JavaScript`, s.line > 0 && s.lineScroll <= s.boxWidth && s.ox <= 0, `${Math.round(s.line)} / ${s.boxWidth}px`);
    await context.close();
    return;
  }
  check(`contact ${label}: static email at rest width, fitted to fill the line`, s.fitted === "static" && s.line <= s.boxWidth && s.line >= s.boxWidth * 0.95 && s.stretch.every((v) => v === 75), `${Math.round(s.line)} / ${s.boxWidth}px`);
  const lb = await page.locator(EMAIL).boundingBox();
  if (options.hasTouch) {
    await page.touchscreen.tap(lb.x + lb.width / 2, lb.y + lb.height / 2);
  } else {
    for (let x = lb.x; x < lb.x + lb.width; x += 60) await page.mouse.move(x, lb.y + lb.height / 2);
    await wait(300);
    const after = await emailState(page);
    check(`contact ${label}: no wave (letters never change width)`, after.stretch.every((v) => v === 75));
    await page.locator(EMAIL).click();
  }
  await wait(300);
  const st = await copyStatus(page);
  check(`contact ${label}: ${options.hasTouch ? "tap" : "click"} copies`, st.state === "copied" && st.visible === ui.contact.copied, st.state);
  check(`contact ${label}: no horizontal overflow`, (await overflowX(page)) <= 0, `${await overflowX(page)}px`);
  await context.close();
}

async function contactTouchHint(browser, base, viewport) {
  const { context, page } = await open(browser, base, { viewport, hasTouch: true, isMobile: true });
  await toContact(page);
  const h = await page.evaluate(() => ({
    pointer: getComputedStyle(document.querySelector(".contact-hint-pointer")).display,
    touch: getComputedStyle(document.querySelector(".contact-hint-touch")).display,
    rule: new DOMMatrixReadOnly(getComputedStyle(document.querySelector(".contact-email-rule")).transform).a,
  }));
  check(`contact ${viewport.width} touch: tap hint shown, pointer hint hidden, underline drawn as the tap cue`, h.pointer === "none" && h.touch !== "none" && h.rule === 1, JSON.stringify(h));
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
    await experienceDesktop(browser, base);
    await experienceReduced(browser, base);
    await experienceTouch(browser, base);
    await expertiseDesktop(browser, base);
    await expertiseReduced(browser, base);
    await expertiseTouch(browser, base, { width: 390, height: 844 });
    await expertiseTouch(browser, base, { width: 375, height: 812 });
    await expertiseSeparators(browser, base, { width: 1440, height: 900 }, false);
    await expertiseSeparators(browser, base, { width: 768, height: 1024 }, true);
    await expertiseSeparators(browser, base, { width: 390, height: 844 }, true);
    await aboutText(browser, base);
    const desktopTravel = await aboutDesktop(browser, base);
    await aboutTouch(browser, base, { width: 390, height: 844 }, desktopTravel);
    await aboutTouch(browser, base, { width: 375, height: 812 }, desktopTravel);
    await aboutStatic(browser, base, "reduced 1440", { viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
    await aboutStatic(browser, base, "reduced 390", { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, reducedMotion: "reduce" });
    await aboutStatic(browser, base, "no JS", { viewport: { width: 1440, height: 900 }, javaScriptEnabled: false });
    await contactStructure(browser, base);
    await contactWave(browser, base, { width: 1440, height: 900 });
    await contactWave(browser, base, { width: 1280, height: 800 });
    await contactFrames(browser, base);
    await contactCopy(browser, base);
    await contactStatic(browser, base, "reduced 1440", { viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
    await contactStatic(browser, base, "390 touch", { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    await contactStatic(browser, base, "375 touch", { viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true });
    await contactTouchHint(browser, base, { width: 390, height: 844 });
    await contactStatic(browser, base, "no JS 1440", { viewport: { width: 1440, height: 900 }, javaScriptEnabled: false });
    await contactStatic(browser, base, "no JS 375", { viewport: { width: 375, height: 812 }, javaScriptEnabled: false });
    await cursorDesktop(browser, base);
    await cursorAbsent(browser, base, "reduced motion 1440", { viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
    await cursorAbsent(browser, base, "touch 390", { viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    await cursorAbsent(browser, base, "touch 375", { viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true });
  } finally {
    await browser.close();
  }
  const failed = results.filter((ok) => !ok).length;
  console.log(`\n${results.length - failed}/${results.length} passed.`);
  return failed > 0 ? 1 : 0;
});
