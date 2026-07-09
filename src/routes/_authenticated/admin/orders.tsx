import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/admin/page-header";
import { DataTable } from "@/components/admin/data-table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCurrentUser } from "@/hooks/use-current-user";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";

const ORDER_STATUSES = ["pending","confirmed","processing","shipped","delivered","cancelled","refunded","disputed"] as const;
type OrderStatus = typeof ORDER_STATUSES[number];

export const Route = createFileRoute("/_authenticated/admin/orders")({ component: OrdersPage });

function OrdersPage() {
  const { data: me } = useCurrentUser();
  const qc = useQueryClient();
  const [openId, setOpenId] = useState<string | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, order_number, status, payment_status, grand_total, currency, created_at")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrderStatus }) => {
      const { error } = await supabase.from("orders").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-orders"] }); toast.success("Order updated"); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div>
      <PageHeader title="Orders" description="All marketplace orders & payments." />
      <DataTable
        loading={isLoading}
        rows={data ?? []}
        columns={[
          { key: "order_number", header: "Order", render: (r: any) => (
            <button className="font-mono text-xs hover:text-primary underline-offset-2 hover:underline" onClick={() => setOpenId(r.id)}>
              {r.order_number ?? r.id.slice(0,8)}
            </button>
          ) },
          { key: "status", header: "Status", render: (r: any) => me?.isStaff ? (
              <Select value={r.status} onValueChange={(v) => updateStatus.mutate({ id: r.id, status: v as OrderStatus })}>
                <SelectTrigger className="h-7 w-36 text-xs capitalize"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ORDER_STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                </SelectContent>
              </Select>
            ) : <Badge variant="secondary" className="capitalize">{r.status}</Badge>
          },
          { key: "payment_status", header: "Payment", render: (r: any) => <Badge variant="outline" className="capitalize">{r.payment_status ?? "—"}</Badge> },
          { key: "grand_total", header: "Total", render: (r: any) => `${r.currency ?? "KES"} ${Number(r.grand_total ?? 0).toLocaleString()}` },
          { key: "created_at", header: "Date", render: (r: any) => new Date(r.created_at).toLocaleDateString() },
        ]}
      />
      <OrderDrawer id={openId} onClose={() => setOpenId(null)} />
    </div>
  );
}

function OrderDrawer({ id, onClose }: { id: string | null; onClose: () => void }) {
  const qc = useQueryClient();
  const { data: me } = useCurrentUser();
  const [refundAmt, setRefundAmt] = useState("");
  const [refundReason, setRefundReason] = useState("");

  const { data, isLoading, isError, error, refetch } = useQuery({
    enabled: !!id,
    queryKey: ["admin-order", id],
    queryFn: async () => {
      const [order, items, payments, refunds] = await Promise.all([
        supabase.from("orders").select("*").eq("id", id!).maybeSingle(),
        supabase.from("order_items").select("*").eq("order_id", id!),
        supabase.from("payments").select("*").eq("order_id", id!).order("created_at", { ascending: false }),
        supabase.from("refunds").select("*").eq("order_id", id!).order("created_at", { ascending: false }),
      ]);
      if (order.error) throw order.error;
      if (items.error) throw items.error;
      if (payments.error) throw payments.error;
      if (refunds.error) throw refunds.error;
      if (!order.data) throw new Error("Order not found");
      return {
        order: order.data, items: items.data ?? [],
        payments: payments.data ?? [], refunds: refunds.data ?? [],
      };
    },
  });

  const paidTotal = (data?.payments ?? []).filter((p: any) => p.status === "paid").reduce((s: number, p: any) => s + Number(p.amount ?? 0), 0);
  const refundedTotal = (data?.refunds ?? []).filter((r: any) => r.status !== "failed" && r.status !== "cancelled").reduce((s: number, r: any) => s + Number(r.amount ?? 0), 0);
  const refundable = Math.max(0, paidTotal - refundedTotal);
  const refundAmtNum = Number(refundAmt);
  const refundValid = refundAmt !== "" && Number.isFinite(refundAmtNum) && refundAmtNum > 0 && refundAmtNum <= refundable;

  const refund = useMutation({
    mutationFn: async () => {
      if (!refundValid) throw new Error(`Refund must be between 0 and ${refundable}.`);
      const payment = data?.payments[0];
      if (!payment) throw new Error("No payment to refund against.");
      const { error } = await supabase.from("refunds").insert({
        order_id: id!, payment_id: payment?.id ?? null,
        amount: refundAmtNum, reason: refundReason.trim() || null, status: "pending",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-order", id] });
      setRefundAmt(""); setRefundReason("");
      toast.success("Refund request created");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Sheet open={!!id} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Order {data?.order?.order_number ?? id?.slice(0,8)}</SheetTitle>
          <SheetDescription>{data?.order ? `${data.order.currency} ${Number(data.order.grand_total).toLocaleString()} · ${new Date(data.order.created_at).toLocaleString()}` : "Loading…"}</SheetDescription>
        </SheetHeader>
        {isLoading ? (
          <div className="py-8 text-sm text-muted-foreground">Loading order…</div>
        ) : isError ? (
          <div className="py-8 space-y-3">
            <div className="text-sm text-destructive">Failed to load order: {(error as any)?.message ?? "Unknown error"}</div>
            <Button size="sm" variant="outline" onClick={() => refetch()}>Retry</Button>
          </div>
        ) : !data?.order ? (
          <div className="py-8 text-sm text-muted-foreground">Order not found.</div>
        ) : (
          <div className="mt-6 space-y-6">
            <section>
              <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Line items</h3>
              <div className="border border-border/60 rounded-md divide-y divide-border/60">
                {data?.items.length === 0 && <div className="p-3 text-xs text-muted-foreground">No items.</div>}
                {data?.items.map((it: any) => (
                  <div key={it.id} className="p-3 flex justify-between text-sm">
                    <div><div>{it.title}</div><div className="text-xs text-muted-foreground">Qty {it.quantity} × {Number(it.unit_price).toLocaleString()}</div></div>
                    <div className="font-mono">{Number(it.line_total).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </section>
            <section>
              <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Payments</h3>
              <div className="border border-border/60 rounded-md divide-y divide-border/60">
                {data?.payments.length === 0 && <div className="p-3 text-xs text-muted-foreground">No payments.</div>}
                {data?.payments.map((p: any) => (
                  <div key={p.id} className="p-3 flex justify-between text-sm">
                    <div><div className="capitalize">{p.provider} <Badge variant="outline" className="ml-1 capitalize">{p.status}</Badge></div><div className="text-xs text-muted-foreground font-mono">{p.provider_reference ?? "—"}</div></div>
                    <div className="font-mono">{p.currency} {Number(p.amount).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </section>
            <section>
              <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Refunds</h3>
              <div className="border border-border/60 rounded-md divide-y divide-border/60">
                {data?.refunds.length === 0 && <div className="p-3 text-xs text-muted-foreground">No refunds.</div>}
                {data?.refunds.map((r: any) => (
                  <div key={r.id} className="p-3 flex justify-between text-sm">
                    <div><div className="capitalize">{r.status}</div><div className="text-xs text-muted-foreground">{r.reason ?? "—"}</div></div>
                    <div className="font-mono">{Number(r.amount).toLocaleString()}</div>
                  </div>
                ))}
              </div>
              {me?.isAdmin && (
                <div className="mt-3 space-y-2 border border-border/60 rounded-md p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-medium">Issue refund</div>
                    <div className="text-xs text-muted-foreground">Refundable: {data?.order?.currency} {refundable.toLocaleString()}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="col-span-1">
                      <Label className="text-xs">Amount</Label>
                      <Input type="number" min="0" step="0.01" max={refundable} value={refundAmt} onChange={(e) => setRefundAmt(e.target.value)} />
                    </div>
                    <div className="col-span-2"><Label className="text-xs">Reason</Label><Input value={refundReason} onChange={(e) => setRefundReason(e.target.value)} /></div>
                  </div>
                  {refundAmt !== "" && !refundValid && (
                    <p className="text-xs text-destructive">Enter an amount between 0 and {refundable}.</p>
                  )}
                  {refundable === 0 && (
                    <p className="text-xs text-muted-foreground">Nothing to refund on this order.</p>
                  )}
                  <Button size="sm" disabled={!refundValid || refund.isPending || refundable === 0} onClick={() => refund.mutate()}>
                    {refund.isPending ? "Creating…" : "Create refund"}
                  </Button>
                </div>
              )}
            </section>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}