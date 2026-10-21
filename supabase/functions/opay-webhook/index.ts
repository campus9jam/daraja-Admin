import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: corsHeaders });
}

function constantTimeEqual(a: string, b: string) {
  if (!a || !b || a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

async function hmacSha512(secret: string, data: string) {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-512" }, false, ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return [...new Uint8Array(signature)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const raw = await req.text();
  if (raw.length > 256_000) return json({ error: "payload_too_large" }, 413);

  const secret = Deno.env.get("OPAY_PRIVATE_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!secret || !supabaseUrl || !serviceKey) return json({ error: "webhook_not_configured" }, 503);

  let payload: Record<string, any>;
  try {
    payload = JSON.parse(raw);
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) throw new Error("invalid");
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  const signature = (
    req.headers.get("Authorization")?.replace(/^Bearer\s+/i, "") ||
    req.headers.get("Signature") || ""
  ).trim();
  const timestamp = (req.headers.get("RequestTimestamp") || "").trim();
  // Keep the provider's documented signing input. Timestamp freshness must only be
  // enforced after confirming OPay's exact timestamp units/format for this account.
  const signingInput = timestamp
    ? `RequestBody=${raw}&RequestTimestamp=${timestamp}`
    : raw;
  const expected = await hmacSha512(secret, signingInput);
  if (!constantTimeEqual(signature.toLowerCase(), expected.toLowerCase())) {
    return json({ error: "unauthorized" }, 401);
  }

  const data = payload.data && typeof payload.data === "object" ? payload.data : {};
  const status = String(payload.status ?? data.status ?? "").toUpperCase();
  if (status !== "SUCCESS") return json({ received: true, status: status || "UNKNOWN" });

  const reference = payload.reference ?? data.reference ??
    payload.merchantOrderNo ?? data.merchantOrderNo;
  if (typeof reference !== "string" && typeof reference !== "number") {
    return json({ error: "missing_reference" }, 400);
  }

  const eventId = payload.notifyId ?? data.notifyId ?? payload.id ?? data.id ?? null;
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // The production RPC accepts p_metadata, not p_provider_event_id. The event ID
  // is carried inside metadata, where confirm_order_payment already reads it.
  const metadata = {
    ...payload,
    event_id: eventId === null ? undefined : String(eventId),
    provider_event_id: eventId === null ? undefined : String(eventId),
    webhook_received_at: new Date().toISOString(),
  };

  const { data: transaction, error } = await supabase.rpc("confirm_order_payment", {
    p_provider: "opay",
    p_provider_reference: String(reference),
    p_status: "paid",
    p_metadata: metadata,
  });

  if (error) {
    // Do not return internal SQL/provider details to an unauthenticated webhook caller.
    console.error("opay_webhook_confirmation_failed", {
      code: error.code,
      reference: String(reference),
      eventId: eventId === null ? null : String(eventId),
    });
    return json({ error: "payment_confirmation_failed" }, 500);
  }
  return json({ received: true, payment: transaction });
});
