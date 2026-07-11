// Delivery dispatch — stub.
// Trigger: new rows in `delivery_tasks` (after insert). Pick partner, create tracking, notify.
// deno-lint-ignore-file no-explicit-any
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  try {
    const payload = await req.json().catch(() => ({}));
    console.log("[delivery-dispatch]", JSON.stringify(payload));
    return new Response(JSON.stringify({ ok: true, dispatched: false, note: "stub" }), {
      headers: { ...CORS, "content-type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ ok: false, error: err.message }), {
      status: 500, headers: { ...CORS, "content-type": "application/json" },
    });
  }
});
