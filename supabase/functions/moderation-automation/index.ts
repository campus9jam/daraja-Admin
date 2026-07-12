// Moderation automation — classifies and routes new moderation reports.
// Payload: { type:'INSERT', table:'moderation_reports', record }
// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const admin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { auth: { persistSession: false } },
);

const HIGH = ["fraud", "csam", "violence", "hate", "threat"];
const LOW = ["spam", "duplicate"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const payload = await req.json().catch(() => ({}));
    const rec = payload?.record ?? {};
    const reason = (rec.reason ?? "").toString().toLowerCase();
    console.log("[moderation-automation]", rec.id, reason);

    let priority = "normal";
    let status = rec.status ?? "pending";
    if (HIGH.some((k) => reason.includes(k))) { priority = "urgent"; status = "escalated"; }
    else if (LOW.some((k) => reason.includes(k))) { priority = "low"; status = "auto_dismissed"; }

    if (rec.id) {
      await admin.from("moderation_reports")
        .update({ priority, status }).eq("id", rec.id);
    }

    await admin.from("audit_logs").insert({
      action: "moderation.classify",
      entity_type: "moderation_report",
      entity_id: rec.id ?? null,
      after: { priority, status, reason },
      user_agent: "edge:moderation-automation",
    });

    return new Response(JSON.stringify({ ok: true, priority, status }), {
      headers: { ...CORS, "content-type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ ok: false, error: err.message }), {
      status: 500, headers: { ...CORS, "content-type": "application/json" },
    });
  }
});
