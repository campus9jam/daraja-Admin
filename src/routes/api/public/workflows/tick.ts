import { createFileRoute } from "@tanstack/react-router";

/** Scheduler endpoint intentionally disabled until a protected scheduler schema exists. */
export const Route = createFileRoute("/api/public/workflows/tick")({
  server: { handlers: { POST: async () => new Response("Workflow scheduler is not configured", { status: 503 }) } },
});
