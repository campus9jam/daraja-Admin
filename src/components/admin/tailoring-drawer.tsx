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
import { useState } from "react";
import { toast } from "sonner";
import { useCurrentUser } from "@/hooks/use-current-user";

const STATUSES = ["requested","measurements_pending","in_review","approved","in_production","quality_check","ready","delivered","cancelled","revision_requested"] as const;

export function TailoringDrawer({ orderId, onClose }: { orderId: string | null; onClose: () => void }) {
  const open = !!orderId;
  const qc = useQueryClient();
  const { data: me } = useCurrentUser();

  const detail = useQuery({
    enabled: open,
    queryKey: ["tailoring-detail", orderId],
    queryFn: async () => {
      const { data, error } = await supabase.from("tailoring_orders")
        .select("*, customer:profiles!tailoring_orders_customer_id_fkey(id, display_name, email), tailor:profiles!tailoring_orders_tailor_id_fkey(id, display_name, email), measurements(*), fabric_catalog(id, name, sku)")
        .eq("id", orderId!).maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Order not found");
      return data as any;
    },
  });

  const tailors = useQuery({
    enabled: open,
    queryKey: ["staff-tailors"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles")
        .select("user_id, profile:profiles!user_roles_user_id_fkey(id, display_name, email)")
        .eq("role", "tailor");
      if (error) throw error;
      return (data ?? []).map((r: any) => r.profile).filter(Boolean);
    },
  });

  const progress = useQuery({
    enabled: open,
    queryKey: ["tailoring-progress", orderId],
    queryFn: async () => {
      const { data, error } = await supabase.from("tailoring_progress_updates")
        .select("*, author:profiles!tailoring_progress_updates_posted_by_fkey(display_name)")
        .eq("tailoring_order_id", orderId!).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const revisions = useQuery({
    enabled: open,
    queryKey: ["tailoring-revisions", orderId],
    queryFn: async () => {
      const { data, error } = await supabase.from("tailoring_revisions")
        .select("*").eq("tailoring_order_id", orderId!).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const update = useMutation({
    mutationFn: async (patch: Record<string, any>) => {
      const { error } = await supabase.from("tailoring_orders").update(patch).eq("id", orderId!);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tailoring-detail", orderId] });
      qc.invalidateQueries({ queryKey: ["admin-tailoring"] });
      toast.success("Updated");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const [progressMsg, setProgressMsg] = useState("");
  const [progressStage, setProgressStage] = useState("");
  const postProgress = useMutation({
    mutationFn: async () => {
      if (!progressMsg.trim() && !progressStage.trim()) throw new Error("Provide a stage or message");
      const { error } = await supabase.from("tailoring_progress_updates").insert({
        tailoring_order_id: orderId!,
        posted_by: me!.id,
        stage: progressStage || null,
        message: progressMsg || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setProgressMsg(""); setProgressStage("");
      qc.invalidateQueries({ queryKey: ["tailoring-progress", orderId] });
      toast.success("Progress posted");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const setRevisionStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from("tailoring_revisions").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tailoring-revisions", orderId] });
      toast.success("Revision updated");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const d = detail.data;

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Tailoring order</SheetTitle>
          <SheetDescription className="font-mono text-xs">{orderId?.slice(0, 8)}</SheetDescription>
        </SheetHeader>

        {detail.isLoading ? (
          <div className="space-y-2 mt-6">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-8" />)}</div>
        ) : detail.error ? (
          <div className="mt-6 text-sm text-destructive">Failed to load: {(detail.error as Error).message}</div>
        ) : d ? (
          <Tabs defaultValue="overview" className="mt-4">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="progress">Progress</TabsTrigger>
              <TabsTrigger value="revisions">Revisions</TabsTrigger>
              <TabsTrigger value="measurements">Measurements</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <Field label="Customer" value={d.customer?.display_name || d.customer?.email || "—"} />
                <Field label="Fabric" value={d.fabric_catalog?.name || "—"} />
                <Field label="Quoted" value={`${d.currency ?? "KES"} ${Number(d.quoted_price ?? 0).toLocaleString()}`} />
                <Field label="Agreed" value={`${d.currency ?? "KES"} ${Number(d.agreed_price ?? 0).toLocaleString()}`} />
                <Field label="Delivery" value={d.delivery_date ? new Date(d.delivery_date).toLocaleDateString() : "—"} />
                <Field label="Created" value={new Date(d.created_at).toLocaleDateString()} />
              </div>

              <div>
                <Label className="text-xs">Style brief</Label>
                <Textarea rows={3} defaultValue={d.style_brief ?? ""} onBlur={(e) => e.target.value !== (d.style_brief ?? "") && update.mutate({ style_brief: e.target.value })} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Status</Label>
                  <Select value={d.status} onValueChange={(v) => update.mutate({ status: v })}>
                    <SelectTrigger className="h-9 capitalize"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, " ")}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Assigned tailor</Label>
                  <Select value={d.tailor_id ?? "unassigned"} onValueChange={(v) => update.mutate({ tailor_id: v === "unassigned" ? null : v })}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Unassigned" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unassigned">Unassigned</SelectItem>
                      {(tailors.data ?? []).map((t: any) => (
                        <SelectItem key={t.id} value={t.id}>{t.display_name || t.email}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Delivery date</Label>
                  <Input type="date" defaultValue={d.delivery_date ?? ""} onBlur={(e) => e.target.value !== (d.delivery_date ?? "") && update.mutate({ delivery_date: e.target.value || null })} />
                </div>
                <div>
                  <Label className="text-xs">Agreed price</Label>
                  <Input type="number" step="0.01" defaultValue={d.agreed_price ?? ""} onBlur={(e) => update.mutate({ agreed_price: e.target.value ? Number(e.target.value) : null })} />
                </div>
              </div>

              <div>
                <Label className="text-xs">Internal notes</Label>
                <Textarea rows={2} defaultValue={d.notes ?? ""} onBlur={(e) => e.target.value !== (d.notes ?? "") && update.mutate({ notes: e.target.value })} />
              </div>
            </TabsContent>

            <TabsContent value="progress" className="space-y-3 mt-4">
              <div className="space-y-2 border border-border/60 rounded-md p-3">
                <Input placeholder="Stage (e.g. cutting, fitting)" value={progressStage} onChange={(e) => setProgressStage(e.target.value)} />
                <Textarea placeholder="Message to customer / team" rows={2} value={progressMsg} onChange={(e) => setProgressMsg(e.target.value)} />
                <Button size="sm" onClick={() => postProgress.mutate()} disabled={postProgress.isPending}>Post update</Button>
              </div>
              {progress.isLoading ? <Skeleton className="h-16" /> : (progress.data ?? []).length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No progress posts yet.</p>
              ) : (
                <div className="space-y-2">
                  {(progress.data ?? []).map((p: any) => (
                    <div key={p.id} className="border border-border/60 rounded-md p-3 text-xs">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium capitalize">{p.stage ?? "update"}</span>
                        <span className="text-muted-foreground">{new Date(p.created_at).toLocaleString()}</span>
                      </div>
                      {p.message && <p className="text-muted-foreground">{p.message}</p>}
                      <p className="text-[10px] text-muted-foreground mt-1">by {p.author?.display_name ?? "staff"}</p>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="revisions" className="space-y-2 mt-4">
              {revisions.isLoading ? <Skeleton className="h-16" /> : (revisions.data ?? []).length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">No revisions requested.</p>
              ) : (revisions.data ?? []).map((r: any) => (
                <div key={r.id} className="border border-border/60 rounded-md p-3 text-xs space-y-2">
                  <div className="flex justify-between items-center">
                    <Badge variant="secondary" className="capitalize">{r.status ?? "pending"}</Badge>
                    <span className="text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                  </div>
                  <p>{r.description}</p>
                  <div className="flex gap-2">
                    {["approved","rejected","completed"].map((s) => (
                      <Button key={s} size="sm" variant="outline" onClick={() => setRevisionStatus.mutate({ id: r.id, status: s })} disabled={r.status === s}>{s}</Button>
                    ))}
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="measurements" className="mt-4">
              {!d.measurements ? (
                <p className="text-xs text-muted-foreground text-center py-4">No measurements linked to this order.</p>
              ) : (
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <Field label="Label" value={d.measurements.label ?? "—"} />
                  <Field label="Unit" value={d.measurements.unit} />
                  {["chest","waist","hips","shoulder","sleeve_length","inseam","outseam","thigh","neck","back_length","height","weight"].map((k) => (
                    <Field key={k} label={k.replace(/_/g, " ")} value={d.measurements[k] ?? "—"} />
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