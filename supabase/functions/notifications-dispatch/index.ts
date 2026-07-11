// Notifications dispatch — stub.
// Trigger: workflow status changes (orders, support_tickets, tailoring_orders, delivery_tasks).
// Wire real providers (email/SMS/push) here. Payload shape follows pg_net trigger below.
// deno-lint-ignore-file no-explicit-any
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const payload = await req.json().catch(() => ({}));
    console.log("[notifications-dispatch]", JSON.stringify(payload));
    // TODO: fan out to email/SMS/push provider based on payload.table / payload.type / payload.record
    return new Response(JSON.stringify({ ok: true, received: payload }), {
      headers: { ...CORS, "content-type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ ok: false, error: err.message }), {
      status: 500, headers: { ...CORS, "content-type": "application/json" },
    });
  }
});
