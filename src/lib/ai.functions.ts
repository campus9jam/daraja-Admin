import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const STAFF = ["super_admin", "admin", "moderator", "support"];
const ADMIN = ["super_admin", "admin"];
export const WORKFLOW_EVENTS = [
  "orders.insert", "support_tickets.insert", "moderation_reports.insert", "products.insert", "tailoring_orders.insert",
] as const;

async function requireRole(context: any, allowed: string[]) {
  const { data: roles } = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId);
  if (!(roles ?? []).some((r: any) => allowed.includes(r.role))) throw new Error("Forbidden");
}

export const runAiWorkflow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    workflowId: z.string().uuid(), input: z.string().min(1).max(8000), idempotencyKey: z.string().min(8).max(100),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await requireRole(context, STAFF);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { executeRun } = await import("./workflow-engine.server");
    const { data: run, error } = await supabaseAdmin.from("ai_workflow_runs").insert({
      workflow_id: data.workflowId, input: data.input, trigger_source: "manual",
      idempotency_key: `manual:${data.idempotencyKey}`, triggered_by: context.userId,
    }).select("id").single();
    if (error) {
      if (error.code === "23505") throw new Error("This run was already submitted");
      throw new Error(error.message);
    }
    const r = await executeRun(run.id);
    if (r.skipped) throw new Error("Run already in progress");
    if (r.error) throw new Error(r.error);
    return { output: r.output ?? "", duration: r.duration };
  });

/** Retry a failed run with its original input. Unique indexes block duplicate retries. */
export const retryWorkflowRun = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ runId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await requireRole(context, STAFF);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { executeRun } = await import("./workflow-engine.server");
    const { data: orig } = await supabaseAdmin.from("ai_workflow_runs").select("*").eq("id", data.runId).maybeSingle();
    if (!orig) throw new Error("Run not found");
    if (orig.status !== "failed") throw new Error(`Only failed runs can be retried (this one is ${orig.status})`);
    if ([401, 402, 403, 422].includes(orig.error_status ?? 0))
      throw new Error("This failure isn't retryable as-is — fix the cause shown in the error first");
    const { data: run, error } = await supabaseAdmin.from("ai_workflow_runs").insert({
      workflow_id: orig.workflow_id, input: orig.input, trigger_source: "retry",
      retry_of: orig.id, attempt: orig.attempt + 1, event_payload: orig.event_payload,
      idempotency_key: `retry:${orig.id}:${orig.attempt + 1}`, triggered_by: context.userId,
    }).select("id").single();
    if (error) {
      if (error.code === "23505") throw new Error("A retry for this run is already running or succeeded");
      throw new Error(error.message);
    }
    await supabaseAdmin.from("audit_logs").insert({
      action: "workflow.retry", entity_type: "ai_workflow_run", entity_id: run.id, actor_id: context.userId,
      after: { retry_of: orig.id, attempt: orig.attempt + 1 },
    });
    const r = await executeRun(run.id);
    return { runId: run.id, status: r.skipped ? "running" : r.status, error: r.skipped ? null : r.error };
  });

/** AI diagnosis of pasted logs and/or a stored run. */
export const diagnoseWorkflowFailure = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    runId: z.string().uuid().optional(), logs: z.string().max(20000).optional(),
  }).refine((v) => v.runId || (v.logs && v.logs.trim()), "Provide logs or a run").parse(d))
  .handler(async ({ data, context }) => {
    await requireRole(context, STAFF);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { callAI } = await import("./workflow-engine.server");
    let ctx = "";
    if (data.runId) {
      const { data: run } = await supabaseAdmin.from("ai_workflow_runs")
        .select("*, ai_workflows(name, description, trigger_type, config, is_active)").eq("id", data.runId).maybeSingle();
      if (!run) throw new Error("Run not found");
      const { data: history } = await supabaseAdmin.from("ai_workflow_runs")
        .select("status, error, error_status, attempt, created_at").eq("workflow_id", run.workflow_id)
        .order("created_at", { ascending: false }).limit(10);
      ctx = JSON.stringify({ run: { ...run, input: run.input.slice(0, 3000) }, recent_runs: history }, null, 2);
    }
    const system = `You are an SRE assistant for the House of Daraja admin automation platform. Workflows call an AI model with an input and store the output. Known failure classes: 429 rate limit (retryable later), 402 out of credits (top up), 403 access/policy blocked, 401 missing key, 422 empty/refused output, 409 workflow paused, 404 workflow deleted, 5xx transient.
Diagnose the failure. Reply in markdown with sections: **Root cause**, **Evidence** (quote log lines), **Fix steps** (numbered, concrete admin actions), **Safe to retry?** (yes/no + why). Keep it under 250 words.`;
    const user = [ctx && `Run context:\n${ctx}`, data.logs && `Admin-provided logs:\n${data.logs}`].filter(Boolean).join("\n\n");
    const diagnosis = await callAI(system, user);
    if (data.runId) await supabaseAdmin.from("ai_workflow_runs").update({ diagnosis }).eq("id", data.runId);
    return { diagnosis };
  });

export const updateWorkflowTriggers = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({
    workflowId: z.string().uuid(),
    scheduleIntervalMinutes: z.number().int().min(5).max(43200).nullable(),
    scheduleEnabled: z.boolean(),
    eventTrigger: z.enum(WORKFLOW_EVENTS).nullable(),
    eventEnabled: z.boolean(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await requireRole(context, ADMIN);
    if (data.scheduleEnabled && !data.scheduleIntervalMinutes) throw new Error("Set an interval before enabling the schedule");
    if (data.eventEnabled && !data.eventTrigger) throw new Error("Choose an event before enabling it");
    const { error } = await context.supabase.from("ai_workflows").update({
      schedule_interval_minutes: data.scheduleIntervalMinutes,
      schedule_enabled: data.scheduleEnabled,
      next_run_at: data.scheduleEnabled ? new Date(Date.now() + data.scheduleIntervalMinutes! * 60000).toISOString() : null,
      event_trigger: data.eventTrigger,
      event_enabled: data.eventEnabled,
    }).eq("id", data.workflowId);
    if (error) throw new Error(error.message);
    await context.supabase.from("audit_logs").insert({
      action: "workflow.triggers", entity_type: "ai_workflow", entity_id: data.workflowId, actor_id: context.userId, after: data,
    });
    return { ok: true };
  });

export const getSchedulerStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireRole(context, STAFF);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.from("ai_scheduler_state").select("paused_reason, last_tick_at").eq("id", 1).maybeSingle();
    return { pausedReason: data?.paused_reason ?? null, lastTickAt: data?.last_tick_at ?? null };
  });

export const resumeScheduler = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireRole(context, ADMIN);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("ai_scheduler_state").update({ paused_reason: null }).eq("id", 1);
    return { ok: true };
  });
