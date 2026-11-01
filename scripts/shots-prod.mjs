// Builds the site, serves it with `next start` on port 3100, runs shots.mjs against it,
// and always stops the server (see prod-server.mjs).
// Usage: node scripts/shots-prod.mjs [--reduced] [--paths=/,/dev/design-system]
import path from "node:path";
import { root, runNode, withProdServer } from "./prod-server.mjs";

await withProdServer(3100, (url) => runNode([path.join(root, "scripts/shots.mjs"), url, ...process.argv.slice(2)]));
