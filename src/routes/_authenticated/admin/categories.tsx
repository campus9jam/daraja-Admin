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
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useCurrentUser } from "@/hooks/use-current-user";

export const Route = createFileRoute("/_authenticated/admin/categories")({ component: CategoriesPage });

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
}

function CategoriesPage() {
  const { data: me } = useCurrentUser();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", is_active: true });

  const { data, isLoading } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, slug, description, is_active, display_order, created_at")
        .order("display_order", { ascending: true })
        .limit(200);
      if (error) throw error;
      return data;
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const slug = `${slugify(form.name)}-${Math.random().toString(36).slice(2, 5)}`;
      const { error } = await supabase.from("categories").insert({
        name: form.name, slug, description: form.description || null, is_active: form.is_active,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-categories"] });
      setOpen(false); setForm({ name: "", description: "", is_active: true });
      toast.success("Category created");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      const { error } = await supabase.from("categories").update({ is_active: active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-categories"] }),
  });

  return (
    <div>
      <PageHeader
        title="Categories"
        description="Top-level taxonomy for the marketplace."
        actions={me?.isAdmin ? (
          <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> New category</Button>
        ) : null}
      />
      <DataTable
        loading={isLoading}
        rows={data ?? []}
        columns={[
          { key: "name", header: "Name" },
          { key: "slug", header: "Slug", render: (r: any) => <span className="font-mono text-xs text-muted-foreground">{r.slug}</span> },
          { key: "description", header: "Description", render: (r: any) => <span className="text-muted-foreground line-clamp-1">{r.description ?? "—"}</span> },
          { key: "display_order", header: "Order", render: (r: any) => r.display_order ?? 0 },
          {
            key: "is_active",
            header: "Active",
            render: (r: any) => me?.isAdmin
              ? <Switch checked={!!r.is_active} onCheckedChange={(v) => toggle.mutate({ id: r.id, active: v })} />
              : <Badge variant={r.is_active ? "default" : "secondary"}>{r.is_active ? "Active" : "Hidden"}</Badge>,
          },
        ]}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New category</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="flex items-center justify-between rounded-md border border-border/60 p-3">
              <Label>Visible to shoppers</Label>
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button disabled={!form.name || create.isPending} onClick={() => create.mutate()}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}