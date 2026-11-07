import { cacheLife } from "next/cache";

/**
 * The year at build time, cached into the static shell ("use cache", per the cacheComponents docs on
 * timestamps). It is the footer's no-JavaScript fallback; FooterYear replaces it on the client after mount.
 */
export async function buildYear(): Promise<number> {
  "use cache";
  cacheLife("max");
  return new Date().getFullYear();
}
