import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const STATUSES = ["pending","assigned","picked_up","in_transit","out_for_delivery","delivered","failed","returned"] as const;

export function LogisticsDrawer({ taskId, onClose }: { taskId: string | null; onClose: () => void }) {
  const open = !!taskId;
  const qc = useQueryClient();

  const detail = useQuery({
    enabled: open,
    queryKey: ["logistics-detail", taskId],
    queryFn: async () => {
      const { data, error } = await supabase.from("delivery_tasks")
        .select("*, order:orders(id, order_number, status, grand_total, currency), partner:delivery_partners(id, name), agent:delivery_agents(id, full_name, phone, vehicle_type, license_plate)")
        .eq("id", taskId!).maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Task not found");
      return data as any;
    },
  });

  const partners = useQuery({
    enabled: open,
    queryKey: ["delivery-partners"],
    queryFn: async () => (await supabase.from("delivery_partners").select("id, name").eq("is_active", true)).data ?? [],
  });
  const agents = useQuery({
    enabled: open,
    queryKey: ["delivery-agents"],
    queryFn: async () => (await supabase.from("delivery_agents").select("id, full_name, current_region, is_available").order("full_name")).data ?? [],
  });

  const tracking = useQuery({
    enabled: open && !!detail.data?.order_id,
    queryKey: ["shipping-tracking", detail.data?.order_id],
    queryFn: async () => {
      const { data } = await supabase.from("shipping_tracking").select("*").eq("order_id", detail.data.order_id).order("updated_at", { ascending: false });
      return data ?? [];
    },
  });

  const live = useQuery({
    enabled: open,
    queryKey: ["live-tracking", taskId],
    queryFn: async () => (await supabase.from("live_delivery_tracking").select("*").eq("task_id", taskId!).order("recorded_at", { ascending: false }).limit(20)).data ?? [],
  });

  const update = useMutation({
    mutationFn: async (patch: Record<string, any>) => {
      const { error } = await (supabase.from("delivery_tasks") as any).update(patch).eq("id", taskId!);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["logistics-detail", taskId] });
      qc.invalidateQueries({ queryKey: ["admin-logistics"] });
      toast.success("Updated");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const d = detail.data;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Delivery task</SheetTitle>
          <SheetDescription className="font-mono text-xs">{taskId?.slice(0, 8)}</SheetDescription>
        </SheetHeader>

        {detail.isLoading ? (
          <div className="space-y-2 mt-6">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-8" />)}</div>
        ) : detail.error ? (
          <div className="mt-6 text-sm text-destructive">Failed to load: {(detail.error as Error).message}</div>
        ) : d ? (
          <Tabs defaultValue="overview" className="mt-4">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="tracking">Tracking</TabsTrigger>
              <TabsTrigger value="live">Live GPS</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <Field label="Order" value={d.order?.order_number || d.order_id?.slice(0, 8)} />
                <Field label="Order total" value={d.order ? `${d.order.currency ?? "KES"} ${Number(d.order.grand_total ?? 0).toLocaleString()}` : "—"} />
                <Field label="Scheduled" value={d.scheduled_pickup ? new Date(d.scheduled_pickup).toLocaleString() : "—"} />
                <Field label="Delivered" value={d.delivered_at ? new Date(d.delivered_at).toLocaleString() : "—"} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Status</Label>
                  <Select value={d.status} onValueChange={(v) => update.mutate({ status: v, ...(v === "delivered" && !d.delivered_at ? { delivered_at: new Date().toISOString() } : {}) })}>
                    <SelectTrigger className="h-9 capitalize"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, " ")}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Cost (KES)</Label>
                  <Input type="number" step="0.01" defaultValue={d.cost ?? ""} onBlur={(e) => update.mutate({ cost: e.target.value ? Number(e.target.value) : null })} />
                </div>
                <div>
                  <Label className="text-xs">Partner</Label>
                  <Select value={d.partner_id ?? "none"} onValueChange={(v) => update.mutate({ partner_id: v === "none" ? null : v })}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="None" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {(partners.data ?? []).map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Agent</Label>
                  <Select value={d.agent_id ?? "none"} onValueChange={(v) => update.mutate({ agent_id: v === "none" ? null : v, ...(v !== "none" && d.status === "pending" ? { status: "assigned" } : {}) })}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Unassigned" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Unassigned</SelectItem>
                      {(agents.data ?? []).map((a: any) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.full_name}{a.current_region ? ` — ${a.current_region}` : ""}{a.is_available ? "" : " (busy)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-xs">Pickup</Label>
                <Textarea rows={2} defaultValue={d.pickup_address ?? ""} onBlur={(e) => e.target.value !== (d.pickup_address ?? "") && update.mutate({ pickup_address: e.target.value || null })} />
              </div>
              <div>
                <Label className="text-xs">Drop-off</Label>
                <Textarea rows={2} defaultValue={d.drop_address ?? ""} onBlur={(e) => e.target.value !== d.drop_address && update.mutate({ drop_address: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Notes</Label>
                <Textarea rows={2} defaultValue={d.notes ?? ""} onBlur={(e) => e.target.value !== (d.notes ?? "") && update.mutate({ notes: e.target.value })} />
              </div>
              {d.proof_url && (
                <div className="text-xs"><a href={d.proof_url} target="_blank" rel="noreferrer" className="underline">View proof of delivery</a></div>
              )}
            </TabsContent>

            <TabsContent value="tracking" className="mt-4 space-y-2">
              {tracking.isLoading ? <Skeleton className="h-16" /> : (tracking.data ?? []).length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No shipping tracking rows yet.</p>
              ) : (tracking.data ?? []).map((t: any) => (
                <div key={t.id} className="border border-border/60 rounded-md p-3 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{t.carrier ?? "carrier"} — {t.tracking_number ?? "no #"}</span>
                    <Badge variant="secondary" className="capitalize">{t.status ?? "—"}</Badge>
                  </div>
                  {t.current_location && <div className="text-muted-foreground">at {t.current_location}</div>}
                  {t.estimated_delivery && <div className="text-muted-foreground">ETA {new Date(t.estimated_delivery).toLocaleString()}</div>}
                </div>
              ))}
            </TabsContent>

            <TabsContent value="live" className="mt-4 space-y-2">
              {live.isLoading ? <Skeleton className="h-16" /> : (live.data ?? []).length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No live GPS pings recorded.</p>
              ) : (
                <div className="border border-border/60 rounded-md divide-y divide-border/60">
                  {(live.data ?? []).map((p: any) => (
                    <div key={p.id} className="p-2 text-xs flex justify-between">
                      <span className="font-mono">{Number(p.latitude).toFixed(4)}, {Number(p.longitude).toFixed(4)}</span>
                      <span className="text-muted-foreground">{p.speed_kmh ? `${p.speed_kmh} km/h` : ""} · {new Date(p.recorded_at).toLocaleTimeString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function Field({ label, value }: { label: string; value: any }) {
  return (
    <div className="space-y-0.5">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="capitalize">{String(value ?? "—")}</div>
    </div>
  );
}