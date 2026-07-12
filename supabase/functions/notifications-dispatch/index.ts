// Notifications dispatch — processes workflow status changes from pg_net triggers.
// Payload: { type, table, old_status?, new_status?, record }
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
    const { type, table, record, old_status, new_status } = payload ?? {};
    console.log("[notifications-dispatch]", type, table, record?.id, old_status, "->", new_status);

    // Persist a compact audit record so admins see the dispatch in Audit Log.
    await admin.from("audit_logs").insert({
      action: `notify.${type ?? "event"}`,
      entity_type: table ?? "unknown",
      entity_id: record?.id ?? null,
      actor_id: null,
      before: old_status ? { status: old_status } : null,
      after: new_status ? { status: new_status } : { record_id: record?.id },
      user_agent: "edge:notifications-dispatch",
    });

    // TODO: fan out to email/SMS/push providers here (Resend, Twilio, FCM).
    return new Response(JSON.stringify({ ok: true, processed: true }), {
      headers: { ...CORS, "content-type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ ok: false, error: err.message }), {
      status: 500, headers: { ...CORS, "content-type": "application/json" },
    });
  }
});
