// Shared production-server lifecycle for shots:prod and nav:check:
// build, `next start` on a port, wait until it responds, run a task, always stop the server
// (whole process tree on Windows). Checks run against a production build because the dev
// indicator and dev-only behavior pollute results.
import { spawn, spawnSync } from "node:child_process";
import path from "node:path";

export const root = path.resolve(import.meta.dirname, "..");
const nextBin = path.join(root, "node_modules/next/dist/bin/next");
const isWindows = process.platform === "win32";

/** Runs a Node script with inherited output and returns its exit code. */
export const runNode = (args) => spawnSync(process.execPath, args, { cwd: root, stdio: "inherit" }).status ?? 1;

async function responds(url) {
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

/**
 * Builds, serves on `port`, awaits `task(url)` (which returns an exit code) and exits the process
 * with that code. The server is stopped on success, failure and Ctrl+C.
 */
export async function withProdServer(port, task) {
  const url = `http://localhost:${port}`;

  if (await responds(url)) {
    console.error(`Something is already listening on port ${port}. Stop it and retry.`);
    process.exit(1);
  }

  if (runNode([nextBin, "build"]) !== 0) {
    console.error("Build failed.");
    process.exit(1);
  }

  const server = spawn(process.execPath, [nextBin, "start", "-p", String(port)], {
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
    while (!(await responds(url))) {
      if (server.exitCode !== null) throw new Error("next start exited before responding.");
      if (Date.now() > deadline) throw new Error(`Server did not respond on ${url} within 60s.`);
      await new Promise((r) => setTimeout(r, 500));
    }
    code = await task(url);
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
  } finally {
    stop(server);
  }

  process.exit(code);
}
