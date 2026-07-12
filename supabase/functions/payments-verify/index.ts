// Payment verification — reconciles a `payments` row against the PSP.
// Payload: { type:'INSERT', table:'payments', record }
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
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const payload = await req.json().catch(() => ({}));
    const rec = payload?.record ?? {};
    console.log("[payments-verify]", rec.id, rec.status, rec.provider);

    // Real PSP verification would go here. For now, mark provisional entries
    // as `pending_verification` so the ops queue picks them up.
    let nextStatus = rec.status;
    if (rec.status === "initiated" || rec.status === "pending") {
      nextStatus = "pending_verification";
    }
    if (nextStatus !== rec.status && rec.id) {
      await admin.from("payments").update({ status: nextStatus }).eq("id", rec.id);
    }

    await admin.from("audit_logs").insert({
      action: "payment.verify",
      entity_type: "payment",
      entity_id: rec.id ?? null,
      before: { status: rec.status },
      after: { status: nextStatus },
      user_agent: "edge:payments-verify",
    });

    return new Response(JSON.stringify({ ok: true, status: nextStatus }), {
      headers: { ...CORS, "content-type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ ok: false, error: err.message }), {
      status: 500, headers: { ...CORS, "content-type": "application/json" },
    });
  }
});
