import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useCurrentUser } from "@/hooks/use-current-user";
import { toast } from "sonner";

const RESOLVE = ["action_taken", "dismissed", "escalated", "reviewing"] as const;

export function ModerationDrawer({ id, onClose }: { id: string | null; onClose: () => void }) {
  const qc = useQueryClient();
  const { data: me } = useCurrentUser();
  const [resolution, setResolution] = useState("");

  const q = useQuery({
    queryKey: ["admin-mod-report", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from("moderation_reports").select("*").eq("id", id!).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const audit = useQuery({
    queryKey: ["admin-mod-audit", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from("audit_logs").select("id, action, after, created_at")
        .eq("entity_type", "moderation_report").eq("entity_id", id!).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  useEffect(() => { setResolution((q.data as any)?.resolution ?? ""); }, [q.data]);

  const log = async (action: string, after: any) => {
    await supabase.from("audit_logs").insert({ action, entity_type: "moderation_report", entity_id: id!, actor_id: me!.id, after });
  };
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin-moderation"] });
    qc.invalidateQueries({ queryKey: ["admin-mod-report", id] });
    qc.invalidateQueries({ queryKey: ["admin-mod-audit", id] });
  };

  const update = useMutation({
    mutationFn: async (patch: Record<string, any>) => {
      if (patch.status && patch.status !== "reviewing" && !resolution.trim())
        throw new Error("Add resolution notes before closing a report");
      const { error } = await supabase.from("moderation_reports").update(patch).eq("id", id!);
      if (error) throw error;
      await log("moderation.update", patch);
    },
    onSuccess: () => { refresh(); toast.success("Report updated"); },
    onError: (e: any) => toast.error(e.message),
  });

  const hide = useMutation({
    mutationFn: async () => {
      const r: any = q.data;
      if (r.target_type === "review") {
        const { error } = await supabase.from("product_reviews").update({ is_hidden: true }).eq("id", r.target_id);
        if (error) throw error;
      } else if (r.target_type === "product") {
        const { error } = await supabase.from("products").update({ status: "rejected" }).eq("id", r.target_id);
        if (error) throw error;
      } else if (r.target_type === "user") {
        const { error } = await supabase.rpc("admin_set_account_status", { _user_id: r.target_id, _status: "suspended", _reason: `Moderation ${id}` });
        if (error) throw error;
      } else throw new Error(`No takedown action for "${r.target_type}"`);
      await log("moderation.takedown", { target_type: r.target_type, target_id: r.target_id });
      const { error } = await supabase.from("moderation_reports")
        .update({ status: "action_taken", resolution: resolution || "Content taken down" }).eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => { refresh(); toast.success("Takedown applied"); },
    onError: (e: any) => toast.error(e.message),
  });

  const r: any = q.data;
  const busy = update.isPending || hide.isPending;

  return (
    <Sheet open={!!id} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader><SheetTitle>Moderation case</SheetTitle></SheetHeader>
        {q.isLoading && <p className="text-sm text-muted-foreground mt-6">Loading…</p>}
        {q.isError && <div className="mt-6 text-sm text-destructive">Failed to load. <Button size="sm" variant="link" onClick={() => q.refetch()}>Retry</Button></div>}
        {q.isSuccess && !r && <p className="text-sm text-muted-foreground mt-6">Report not found.</p>}
        {r && (
          <div className="mt-6 space-y-5 text-sm">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="capitalize">{r.target_type}</Badge>
              <Badge variant="secondary" className="capitalize">{r.status.replace(/_/g, " ")}</Badge>
            </div>
            <dl className="grid grid-cols-3 gap-2 text-xs">
              <dt className="text-muted-foreground">Target</dt><dd className="col-span-2 font-mono break-all">{r.target_id}</dd>
              <dt className="text-muted-foreground">Reason</dt><dd className="col-span-2">{r.reason}</dd>
              <dt className="text-muted-foreground">Reporter</dt><dd className="col-span-2 font-mono">{r.reporter_id?.slice(0, 8) ?? "system"}</dd>
              <dt className="text-muted-foreground">Assigned</dt><dd className="col-span-2 font-mono">{r.assigned_to ? (r.assigned_to === me?.id ? "you" : r.assigned_to.slice(0, 8)) : "—"}</dd>
              <dt className="text-muted-foreground">Filed</dt><dd className="col-span-2">{new Date(r.created_at).toLocaleString()}</dd>
            </dl>
            {r.description && <p className="rounded-md border border-border/60 p-3 text-xs text-muted-foreground whitespace-pre-wrap">{r.description}</p>}

            {me?.isStaff && (
              <>
                <Button size="sm" variant="outline" disabled={busy || r.assigned_to === me.id}
                  onClick={() => update.mutate({ assigned_to: me.id, status: r.status === "open" ? "reviewing" : r.status })}>
                  Assign to me
                </Button>
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Resolution notes</label>
                  <Textarea rows={3} maxLength={2000} value={resolution} onChange={(e) => setResolution(e.target.value)} />
                  <div className="flex flex-wrap gap-2">
                    {RESOLVE.map((s) => (
                      <Button key={s} size="sm" variant={s === "action_taken" ? "default" : "secondary"} disabled={busy || r.status === s}
                        className="capitalize" onClick={() => update.mutate({ status: s, resolution: resolution.trim() || null })}>
                        {s.replace(/_/g, " ")}
                      </Button>
                    ))}
                  </div>
                </div>
                {["review", "product", "user"].includes(r.target_type) && (
                  <Button size="sm" variant="destructive" disabled={busy} onClick={() => {
                    if (confirm(`Take down this ${r.target_type}?`)) hide.mutate();
                  }}>Take down {r.target_type}</Button>
                )}
              </>
            )}

            <div>
              <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Audit trail</h4>
              {(audit.data ?? []).length === 0 && <p className="text-xs text-muted-foreground">No actions yet.</p>}
              <ul className="space-y-1">
                {(audit.data ?? []).map((a: any) => (
                  <li key={a.id} className="text-xs flex justify-between gap-2">
                    <span className="font-mono">{a.action}</span>
                    <span className="text-muted-foreground">{new Date(a.created_at).toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
