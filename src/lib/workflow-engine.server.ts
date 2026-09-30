// Server-only workflow execution engine (AI Gateway via Responses API, streamed).
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const MODEL = "openai/gpt-6-astra";

export class AiError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

/** Streams a Responses API call and returns the final text. */
export async function callAI(system: string, user: string): Promise<string> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new AiError("AI is not configured (missing key)", 401);
  const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Lovable-API-Key": key,
      "X-Lovable-AIG-SDK": "fetch",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      stream: true,
      store: false,
      reasoning: { effort: "low" },
      input: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok || !res.body) {
    let msg = `AI request failed (${res.status})`;
    try { const j: any = await res.json(); msg = j?.error?.message ?? j?.message ?? msg; } catch { /* ignore */ }
    if (res.status === 429) msg = "AI is rate limited — try again shortly";
    if (res.status === 402) msg = j402(msg);
    throw new AiError(msg, res.status);
  }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "", text = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let i;
    while ((i = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, i).trim();
      buf = buf.slice(i + 1);
      if (!line.startsWith("data:")) continue;
      const payload = line.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const ev = JSON.parse(payload);
        if (ev.type === "response.output_text.delta") text += ev.delta ?? "";
        else if (ev.type === "response.failed" || ev.type === "error")
          throw new AiError(ev.response?.error?.message ?? ev.message ?? "AI stream failed", 500);
      } catch (e) { if (e instanceof AiError) throw e; }
    }
  }
  if (!text.trim()) throw new AiError("AI returned no output (possibly refused)", 422);
  return text;
}
function j402(m: string) { return m.includes("credit") ? m : "AI credits exhausted — top up in workspace settings"; }

/**
 * Atomically claims a queued run (queued -> running) and executes it.
 * The conditional claim guarantees a run is never executed twice.
 */
export async function executeRun(runId: string) {
  const { data: run } = await supabaseAdmin.from("ai_workflow_runs")
    .update({ status: "running", started_at: new Date().toISOString() })
    .eq("id", runId).eq("status", "queued").select("*").maybeSingle();
  if (!run) return { skipped: true as const };

  const { data: wf } = await supabaseAdmin.from("ai_workflows").select("*").eq("id", run.workflow_id).maybeSingle();
  const started = Date.now();
  let output: string | null = null, error: string | null = null, status: number | null = null;
  try {
    if (!wf) throw new AiError("Workflow was deleted", 404);
    if (!wf.is_active) throw new AiError("Workflow is paused", 409);
    const cfg = (wf.config ?? {}) as Record<string, any>;
    const system = cfg.prompt ?? cfg.system_prompt ??
      `You are the "${wf.name}" automation for House of Daraja, an African luxury fashion marketplace. ${wf.description ?? ""} Respond concisely with actionable output.`;
    output = await callAI(system, run.input);
  } catch (e: any) {
    error = e.message ?? String(e);
    status = e instanceof AiError ? e.status : 500;
  }
  const duration = Date.now() - started;
  const finalStatus = error ? "failed" : "succeeded";
  await supabaseAdmin.from("ai_workflow_runs").update({
    status: finalStatus, output, error, error_status: status,
    finished_at: new Date().toISOString(), duration_ms: duration,
  }).eq("id", runId);
  await supabaseAdmin.from("ai_logs").insert({
    workflow_id: run.workflow_id, user_id: run.triggered_by, level: error ? "error" : "info",
    event: run.retry_of ? "workflow.retry" : `workflow.run.${run.trigger_source}`,
    payload: { run_id: runId, retry_of: run.retry_of, attempt: run.attempt, output: output?.slice(0, 4000), error },
    duration_ms: duration,
  });
  if (wf) {
    await supabaseAdmin.from("ai_workflows")
      .update({ total_runs: (wf.total_runs ?? 0) + 1, last_run_at: new Date().toISOString() }).eq("id", wf.id);
  }
  return { skipped: false as const, runId, status: finalStatus, output, error, errorStatus: status, duration };
}
