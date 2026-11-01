// Builds the site, serves it with `next start` on port 3100, runs shots.mjs against it,
// and always stops the server (whole process tree on Windows).
// Usage: node scripts/shots-prod.mjs [--reduced]
// Screenshots and the overflow check run against a production build because the
// dev indicator and dev-only behavior pollute the results.
import { spawn, spawnSync } from "node:child_process";
import path from "node:path";

const PORT = 3100;
const url = `http://localhost:${PORT}`;
const root = path.resolve(import.meta.dirname, "..");
const nextBin = path.join(root, "node_modules/next/dist/bin/next");
const isWindows = process.platform === "win32";

const run = (args) =>
  spawnSync(process.execPath, args, { cwd: root, stdio: "inherit" }).status ?? 1;

async function responds() {
  try {
    await fetch(url, { signal: AbortSignal.timeout(2000) });
    return true;
  } catch {
    return false;
  }
}

function stop(child) {
  if (!child || child.exitCode !== null) return;
  if (isWindows) spawnSync("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore" });
  else process.kill(-child.pid, "SIGTERM");
}

if (await responds()) {
  console.error(`Something is already listening on port ${PORT}. Stop it and retry.`);
  process.exit(1);
}

if (run([nextBin, "build"]) !== 0) {
  console.error("Build failed.");
  process.exit(1);
}

const server = spawn(process.execPath, [nextBin, "start", "-p", String(PORT)], {
  cwd: root,
  stdio: ["ignore", "inherit", "inherit"],
  detached: !isWindows,
});
const onSignal = () => {
  stop(server);
  process.exit(130);
};
process.on("SIGINT", onSignal);
process.on("SIGTERM", onSignal);

let code = 1;
try {
  const deadline = Date.now() + 60_000;
  while (!(await responds())) {
    if (server.exitCode !== null) throw new Error("next start exited before responding.");
    if (Date.now() > deadline) throw new Error(`Server did not respond on ${url} within 60s.`);
    await new Promise((r) => setTimeout(r, 500));
  }
  code = run([path.join(root, "scripts/shots.mjs"), url, ...process.argv.slice(2)]);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
} finally {
  stop(server);
}

process.exit(code);
