import { createFileRoute } from "@tanstack/react-router";
import { timingSafeEqual } from "crypto";

const BATCH = 5;

// Called every minute by the database scheduler. Enqueues due scheduled runs and
// processes a bounded batch of queued runs under a single-flight lease.
export const Route = createFileRoute("/api/public/workflows/tick")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { executeRun } = await import("@/lib/workflow-engine.server");
        const token = request.headers.get("x-scheduler-token") ?? "";
        const { data: state } = await supabaseAdmin.from("ai_scheduler_state").select("*").eq("id", 1).single();
        if (!state || token.length !== state.token.length ||
            !timingSafeEqual(Buffer.from(token), Buffer.from(state.token))) {
          return new Response("Unauthorized", { status: 401 });
        }
        const now = new Date();
        await supabaseAdmin.from("ai_scheduler_state").update({ last_tick_at: now.toISOString() }).eq("id", 1);
        if (state.paused_reason) return Response.json({ paused: state.paused_reason });

        // single-flight lease
        const { data: lease } = await supabaseAdmin.from("ai_scheduler_state")
          .update({ locked_until: new Date(now.getTime() + 55_000).toISOString() })
          .eq("id", 1).or(`locked_until.is.null,locked_until.lt.${now.toISOString()}`).select("id").maybeSingle();
        if (!lease) return Response.json({ skipped: "locked" });

        try {
          // enqueue due schedules (idempotent per slot)
          const { data: due } = await supabaseAdmin.from("ai_workflows")
            .select("id, schedule_interval_minutes, next_run_at, config")
            .eq("schedule_enabled", true).eq("is_active", true).lte("next_run_at", now.toISOString());
          for (const w of due ?? []) {
            const slot = w.next_run_at!;
            await supabaseAdmin.from("ai_workflow_runs").upsert({
              workflow_id: w.id, trigger_source: "schedule", status: "queued",
              input: (w.config as any)?.scheduled_input ?? `Scheduled run at ${slot}. Produce your periodic report.`,
              idempotency_key: `sched:${w.id}:${slot}`,
            }, { onConflict: "idempotency_key", ignoreDuplicates: true });
            await supabaseAdmin.from("ai_workflows").update({
              next_run_at: new Date(now.getTime() + w.schedule_interval_minutes! * 60000).toISOString(),
            }).eq("id", w.id);
          }

          const { data: queued } = await supabaseAdmin.from("ai_workflow_runs")
            .select("id").eq("status", "queued").order("created_at").limit(BATCH);
          let processed = 0, rateLimited = 0;
          for (const q of queued ?? []) {
            const r = await executeRun(q.id);
            if (r.skipped) continue;
            processed++;
            if (r.errorStatus === 402 || r.errorStatus === 403 || r.errorStatus === 401) {
              await supabaseAdmin.from("ai_scheduler_state").update({ paused_reason: r.error }).eq("id", 1);
              break;
            }
            if (r.errorStatus === 429 && ++rateLimited >= 2) break;
          }
          return Response.json({ enqueued: due?.length ?? 0, processed });
        } finally {
          await supabaseAdmin.from("ai_scheduler_state").update({ locked_until: null }).eq("id", 1);
        }
      },
    },
  },
});
