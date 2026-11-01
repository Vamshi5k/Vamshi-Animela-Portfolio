// Keyboard, menu and scroll checks for the site header, against a production build.
// Usage: npm run nav:check   (builds, serves on 3100, runs checks, stops the server)
// Expected labels come from src/data (loaded via Node type stripping), so the checks follow the content.
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";
import { nav } from "../src/data/nav.ts";
import { profile } from "../src/data/profile.ts";
import { ui } from "../src/data/ui.ts";
import { root, withProdServer } from "./prod-server.mjs";

const results = [];
function check(name, ok, detail = "") {
  results.push(ok);
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? `  (${detail})` : ""}`);
}

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const idOf = (href) => href.split("#")[1];

/** Waits until window.scrollY has not changed for `quiet` ms (smooth scrolling has finished). */
async function settle(page, quiet = 400, timeout = 5000) {
  const start = Date.now();
  let last = await page.evaluate(() => window.scrollY);
  let since = Date.now();
  while (Date.now() - start < timeout) {
    await wait(100);
    const y = await page.evaluate(() => window.scrollY);
    if (y !== last) {
      last = y;
      since = Date.now();
    } else if (Date.now() - since >= quiet) return;
  }
}

const focused = (page) =>
  page.evaluate(() => {
    const el = document.activeElement;
    const cs = el ? getComputedStyle(el) : null;
    return {
      text: el?.textContent?.trim() ?? "",
      href: el?.getAttribute("href") ?? null,
      outline: cs ? cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0 : false,
      inHeader: !!el?.closest("header"),
      isToggle: el?.getAttribute("aria-controls") === "mobile-menu",
    };
  });

/** Waits until the menu's open animation is done: panel fully revealed, last item at rest. */
async function menuSettled(page, timeout = 4000) {
  await page.waitForSelector("#mobile-menu");
  await page.waitForFunction(
    () => {
      const menu = document.getElementById("mobile-menu");
      const last = menu?.querySelector("li:last-child");
      if (!menu || !last) return false;
      const t = getComputedStyle(last).transform;
      const atRest = (t === "none" || t === "matrix(1, 0, 0, 1, 0, 0)") && getComputedStyle(last).opacity === "1";
      const clip = getComputedStyle(menu).clipPath; // "inset(0%)" when fully open
      const open = clip === "none" || (clip.match(/[\d.]+/g) ?? []).every((n) => Number(n) === 0);
      return atRest && open;
    },
    null,
    { timeout, polling: 50 },
  );
  await wait(100);
}

const activeLabel = (page) =>
  page.evaluate(() => document.querySelector('header nav a[aria-current="location"]')?.textContent?.trim() ?? null);

const markerX = (page) =>
  page.evaluate(() => {
    const r = document.querySelector("[data-nav-marker]")?.getBoundingClientRect();
    return r ? Math.round(r.left) : null;
  });

async function desktop(browser, base, outDir) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(base, { waitUntil: "networkidle" });
  await page.waitForSelector("header[data-ready]");

  // Tab order: skip link, wordmark, nav items, CTA. Every stop shows a focus outline.
  const expected = [ui.skipToContent, profile.siteName, ...nav.items.map((i) => i.label), nav.cta.label];
  const seen = [];
  let outlines = true;
  for (let i = 0; i < expected.length; i++) {
    await page.keyboard.press("Tab");
    const f = await focused(page);
    seen.push(f.text);
    if (!f.outline) outlines = false;
  }
  check("desktop: skip link is the first Tab stop", seen[0] === ui.skipToContent, seen[0]);
  check("desktop: Tab order wordmark → nav → CTA", seen.slice(1).join("|") === expected.slice(1).join("|"), seen.join(" → "));
  check("desktop: visible focus outline on every stop", outlines);

  await page.keyboard.press("Escape");
  await page.evaluate(() => (document.activeElement)?.blur());
  check("desktop: top of page marks Home active", (await activeLabel(page)) === nav.items[0].label, await activeLabel(page));

  // Click a nav item: hash and active marker change.
  const target = nav.items.find((i) => idOf(i.href) === "services") ?? nav.items[3];
  const xBefore = await markerX(page);
  await page.click(`header nav a[href="${target.href}"]`);
  await settle(page);
  await wait(500); // marker layout animation
  const hash = await page.evaluate(() => location.hash);
  const xAfter = await markerX(page);
  const label = await activeLabel(page);
  check("desktop: click nav item updates URL hash", hash === `#${idOf(target.href)}`, hash);
  check("desktop: click nav item moves active marker", label === target.label && xAfter !== null && xAfter !== xBefore, `${label}, marker x ${xBefore} → ${xAfter}`);
  await page.screenshot({ path: path.join(outDir, `desktop-${idOf(target.href)}-1440.png`) });

  const sectionTop = await page.evaluate((id) => Math.round(document.getElementById(id).getBoundingClientRect().top), idOf(target.href));
  check("desktop: section lands below the bar (scroll-margin)", sectionTop >= 40 && sectionTop <= 72, `section top ${sectionTop}px`);

  // Sections without a nav item keep the marker on the nav item above them; the centre index shows
  // the real section. Expected mapping is derived from data: last nav item at or before the section.
  const pageOrder = await page.evaluate(() => [...document.querySelectorAll("main > section")].map((s) => s.id));
  const navIds = nav.items.map((i) => idOf(i.href));
  for (const id of pageOrder.filter((s) => !navIds.includes(s))) {
    const before = pageOrder.slice(0, pageOrder.indexOf(id) + 1).filter((s) => navIds.includes(s)).at(-1);
    const expectedLabel = nav.items.find((i) => idOf(i.href) === before)?.label;
    await page.evaluate((sid) => {
      const top = document.getElementById(sid).getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: top - window.innerHeight * 0.3, behavior: "instant" });
    }, id);
    await wait(500);
    const got = await page.evaluate(() => ({
      marker: document.querySelector('header nav a[aria-current="location"]')?.textContent?.trim() ?? null,
      index: document.querySelector("[data-section-index]")?.getAttribute("data-section-index"),
    }));
    check(`desktop: #${id} keeps marker on ${expectedLabel}, index shows ${id}`, got.marker === expectedLabel && got.index === id, JSON.stringify(got));
  }

  // Last section becomes active at the bottom even if it is short.
  await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "instant" }));
  await wait(400);
  const last = nav.items.at(-1).label;
  check("desktop: bottom of page marks the last section active", (await activeLabel(page)) === last, await activeLabel(page));

  // Hide on scroll down, return on scroll up, condensed while scrolled.
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await wait(400);
  const topHeight = await page.evaluate(() => Math.round(document.querySelector("header").getBoundingClientRect().height));
  await page.mouse.move(720, 450);
  for (let i = 0; i < 8; i++) {
    await page.mouse.wheel(0, 150);
    await wait(60);
  }
  await settle(page);
  await wait(500);
  const down = await page.evaluate(() => {
    const h = document.querySelector("header");
    return { hidden: h.dataset.hidden, bottom: Math.round(h.getBoundingClientRect().bottom) };
  });
  check("desktop: bar hides on scroll down", down.hidden === "true" && down.bottom <= 0, JSON.stringify(down));

  for (let i = 0; i < 3; i++) {
    await page.mouse.wheel(0, -120);
    await wait(60);
  }
  await settle(page);
  await wait(500);
  const up = await page.evaluate(() => {
    const h = document.querySelector("header");
    const r = h.getBoundingClientRect();
    return { hidden: h.dataset.hidden, top: Math.round(r.top), height: Math.round(r.height) };
  });
  check("desktop: bar returns on scroll up", up.hidden === "false" && up.top === 0, JSON.stringify(up));
  check("desktop: bar is condensed while scrolled", up.height < topHeight, `${topHeight}px → ${up.height}px`);

  await page.close();
}

async function mobile(browser, base, outDir) {
  for (const { width, height } of [
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
  ]) {
    const page = await browser.newPage({ viewport: { width, height }, hasTouch: true, isMobile: width < 768 });
    await page.goto(base, { waitUntil: "networkidle" });
    await page.waitForSelector("header[data-ready]");
    const toggle = page.locator('button[aria-controls="mobile-menu"]');
    const tag = `${width}px`;

    check(`${tag}: toggle closed state (aria-expanded=false, aria-controls)`, (await toggle.getAttribute("aria-expanded")) === "false");

    await toggle.click();
    await menuSettled(page);
    const opened = await page.evaluate(() => ({
      expanded: document.querySelector('button[aria-controls="mobile-menu"]').getAttribute("aria-expanded"),
      dialog: document.getElementById("mobile-menu")?.getAttribute("role"),
      overflow: document.documentElement.style.overflow,
      inert: document.getElementById("main")?.hasAttribute("inert"),
    }));
    check(`${tag}: menu opens as a dialog (aria-expanded=true)`, opened.expanded === "true" && opened.dialog === "dialog");
    check(`${tag}: body scroll locked and page inert`, opened.overflow === "hidden" && opened.inert === true, JSON.stringify(opened));
    const first = await focused(page);
    check(`${tag}: focus moves into the menu`, first.href === nav.items[0].href, first.text);
    await page.screenshot({ path: path.join(outDir, `menu-open-${width}.png`) });

    // Focus trap in both directions.
    let trapped = true;
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press("Tab");
      if (!(await focused(page)).inHeader) trapped = false;
    }
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press("Shift+Tab");
      if (!(await focused(page)).inHeader) trapped = false;
    }
    check(`${tag}: focus is trapped inside the menu (Tab and Shift+Tab)`, trapped);

    await page.keyboard.press("Escape");
    await wait(700);
    const closed = await page.evaluate(() => ({
      menu: !!document.getElementById("mobile-menu"),
      expanded: document.querySelector('button[aria-controls="mobile-menu"]').getAttribute("aria-expanded"),
      overflow: document.documentElement.style.overflow,
      inert: document.getElementById("main")?.hasAttribute("inert"),
    }));
    const afterEsc = await focused(page);
    check(`${tag}: Escape closes the menu`, !closed.menu && closed.expanded === "false", JSON.stringify(closed));
    check(`${tag}: focus returns to the toggle`, afterEsc.isToggle, afterEsc.text);
    check(`${tag}: scroll lock and inert released`, closed.overflow === "" && closed.inert === false);

    // Navigate from the menu.
    const about = nav.items.find((i) => idOf(i.href) === "about") ?? nav.items[1];
    await toggle.click();
    await menuSettled(page);
    await page.click(`#mobile-menu a[href="${about.href}"]`);
    await wait(700);
    await settle(page);
    const nav1 = await page.evaluate((id) => ({
      menu: !!document.getElementById("mobile-menu"),
      hash: location.hash,
      top: Math.round(document.getElementById(id).getBoundingClientRect().top),
    }), idOf(about.href));
    check(`${tag}: menu link closes the menu and navigates`, !nav1.menu && nav1.hash === `#${idOf(about.href)}`, JSON.stringify(nav1));
    check(`${tag}: target section is scrolled into view`, nav1.top >= 0 && nav1.top <= 72, `top ${nav1.top}px`);
    const barAfterNav = await page.evaluate(() => {
      const h = document.querySelector("header");
      return { hidden: h.dataset.hidden, top: Math.round(h.getBoundingClientRect().top) };
    });
    check(`${tag}: bar stays visible after navigating from the menu`, barAfterNav.hidden === "false" && barAfterNav.top === 0, JSON.stringify(barAfterNav));

    await toggle.click();
    await menuSettled(page);
    const current = await page.evaluate(() => document.querySelector('#mobile-menu a[aria-current="location"]')?.textContent ?? "");
    check(`${tag}: menu marks the current section`, current.includes(about.label), current.trim());
    await toggle.click();
    await wait(700);
    check(`${tag}: closing with the toggle keeps focus on it`, (await focused(page)).isToggle);

    await page.close();
  }
}

await withProdServer(3100, async (base) => {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const outDir = path.join(root, "design/screenshots", `${stamp}-nav`);
  await mkdir(outDir, { recursive: true });

  const browser = await chromium.launch({ args: ["--disable-lcd-text"] }); // see shots.mjs
  try {
    await desktop(browser, base, outDir);
    await mobile(browser, base, outDir);
  } finally {
    await browser.close();
  }

  const failed = results.filter((ok) => !ok).length;
  console.log(`\n${results.length - failed}/${results.length} passed. Screenshots: ${outDir}`);
  return failed > 0 ? 1 : 0;
});
