import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/admin/page-header";
import { DataTable } from "@/components/admin/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Megaphone, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useCurrentUser } from "@/hooks/use-current-user";

export const Route = createFileRoute("/_authenticated/admin/announcements")({ component: AnnouncementsPage });

const SEVERITIES = ["info", "success", "warning", "critical"];

function AnnouncementsPage() {
  const { data: me } = useCurrentUser();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", severity: "info", is_active: true, audience: "all" });

  const { data, isLoading } = useQuery({
    queryKey: ["admin-announcements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("system_announcements")
        .select("id, title, body, severity, audience, is_active, starts_at, ends_at, created_at")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase.from("system_announcements").insert({
        title: form.title, body: form.body, severity: form.severity,
        audience: form.audience, is_active: form.is_active, created_by: u.user?.id ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-announcements"] });
      setOpen(false); setForm({ title: "", body: "", severity: "info", is_active: true, audience: "all" });
      toast.success("Announcement posted");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("system_announcements").update({ is_active: active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-announcements"] }),
  });

  const sevTone: Record<string, string> = {
    info: "bg-blue-500/15 text-blue-300 border-blue-500/30",
    success: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    warning: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    critical: "bg-red-500/15 text-red-300 border-red-500/30",
  };

  return (
    <div>
      <PageHeader
        title="System Announcements"
        description="Broadcast banners, maintenance notices, and product news."
        actions={me?.isAdmin ? (
          <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> New announcement</Button>
        ) : null}
      />
      <DataTable
        loading={isLoading}
        rows={data ?? []}
        columns={[
          {
            key: "title", header: "Title", render: (r: any) => (
              <div className="flex items-start gap-2">
                <Megaphone className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <div className="font-medium">{r.title}</div>
                  <div className="text-xs text-muted-foreground line-clamp-1">{r.body}</div>
                </div>
              </div>
            ),
          },
          { key: "severity", header: "Severity", render: (r: any) => <Badge variant="outline" className={`capitalize ${sevTone[r.severity] ?? ""}`}>{r.severity}</Badge> },
          { key: "audience", header: "Audience", render: (r: any) => <span className="capitalize text-xs text-muted-foreground">{r.audience}</span> },
          {
            key: "is_active", header: "Active", render: (r: any) => me?.isAdmin
              ? <Switch checked={!!r.is_active} onCheckedChange={(v) => toggle.mutate({ id: r.id, active: v })} />
              : <Badge variant={r.is_active ? "default" : "secondary"}>{r.is_active ? "Live" : "Off"}</Badge>,
          },
        ]}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New announcement</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div><Label>Body</Label><Textarea rows={4} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Severity</Label>
                <Select value={form.severity} onValueChange={(v) => setForm({ ...form, severity: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{SEVERITIES.map(s => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Audience</Label>
                <Select value={form.audience} onValueChange={(v) => setForm({ ...form, audience: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All users</SelectItem>
                    <SelectItem value="customers">Customers</SelectItem>
                    <SelectItem value="vendors">Vendors</SelectItem>
                    <SelectItem value="staff">Staff only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-md border border-border/60 p-3">
              <Label>Publish immediately</Label>
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button disabled={!form.title || !form.body || create.isPending} onClick={() => create.mutate()}>Post</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}