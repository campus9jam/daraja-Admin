import { createStartHandler, defaultStreamHandler } from "@tanstack/react-start/server";
import { getRouterManifest } from "@tanstack/react-start/manifest";
import { getRouter } from "./router";

// Standard TanStack Start request handler. Nitro adapts this handler to
// Vercel Functions; do not export a Cloudflare Worker fetch(env, ctx) wrapper.
const fetch = createStartHandler({
  createRouter: getRouter,
  getRouterManifest,
})(defaultStreamHandler);

export default fetch;
