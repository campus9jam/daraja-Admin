import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const STAFF = ["super_admin", "admin", "moderator", "support"];

export const runAiWorkflow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ workflowId: z.string().uuid(), input: z.string().min(1).max(8000) }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: roles } = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId);
    if (!(roles ?? []).some((r: any) => STAFF.includes(r.role))) throw new Error("Forbidden");

    const { data: wf, error } = await context.supabase.from("ai_workflows").select("*").eq("id", data.workflowId).maybeSingle();
    if (error || !wf) throw new Error("Workflow not found");
    if (!wf.is_active) throw new Error("Workflow is paused — activate it first");

    const cfg = (wf.config ?? {}) as Record<string, any>;
    const system = cfg.prompt ?? cfg.system_prompt ??
      `You are the "${wf.name}" automation for House of Daraja, an African luxury fashion marketplace. ${wf.description ?? ""} Respond concisely with actionable output.`;

    const started = Date.now();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let output = "";
    let level = "info";
    try {
      const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${process.env["LOVABLE_API_KEY"]}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: cfg.model ?? "google/gemini-3-flash-preview",
          messages: [{ role: "system", content: system }, { role: "user", content: data.input }],
        }),
      });
      if (res.status === 429) throw new Error("AI is rate limited — try again shortly");
      if (res.status === 402) throw new Error("AI credits exhausted — top up in workspace settings");
      if (!res.ok) throw new Error(`AI request failed (${res.status})`);
      const json: any = await res.json();
      output = json.choices?.[0]?.message?.content ?? "";
    } catch (e: any) {
      level = "error";
      output = e.message;
    }
    const duration = Date.now() - started;
    await supabaseAdmin.from("ai_logs").insert({
      workflow_id: wf.id, user_id: context.userId, level, event: "workflow.run",
      payload: { input: data.input.slice(0, 2000), output: output.slice(0, 4000) }, duration_ms: duration,
    });
    await supabaseAdmin.from("ai_workflows")
      .update({ total_runs: (wf.total_runs ?? 0) + 1, last_run_at: new Date().toISOString() }).eq("id", wf.id);
    if (level === "error") throw new Error(output);
    return { output, duration };
  });
