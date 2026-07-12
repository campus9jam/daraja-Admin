// Delivery dispatch — assigns a partner and seeds tracking for a new delivery task.
// Payload: { type:'INSERT', table:'delivery_tasks', record }
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
    console.log("[delivery-dispatch]", rec.id);

    // Auto-pick the first active partner if none assigned yet.
    let partnerId = rec.partner_id ?? null;
    if (!partnerId) {
      const { data: partner } = await admin
        .from("delivery_partners").select("id").eq("is_active", true).limit(1).maybeSingle();
      partnerId = partner?.id ?? null;
      if (partnerId && rec.id) {
        await admin.from("delivery_tasks")
          .update({ partner_id: partnerId, status: "dispatched" }).eq("id", rec.id);
      }
    }

    // Seed shipping_tracking so ops has a visible record.
    if (rec.order_id) {
      await admin.from("shipping_tracking").insert({
        order_id: rec.order_id,
        status: "created",
        notes: `Delivery task ${rec.id} dispatched`,
      }).select().maybeSingle();
    }

    await admin.from("audit_logs").insert({
      action: "delivery.dispatch",
      entity_type: "delivery_task",
      entity_id: rec.id ?? null,
      after: { partner_id: partnerId },
      user_agent: "edge:delivery-dispatch",
    });

    return new Response(JSON.stringify({ ok: true, partner_id: partnerId }), {
      headers: { ...CORS, "content-type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ ok: false, error: err.message }), {
      status: 500, headers: { ...CORS, "content-type": "application/json" },
    });
  }
});
