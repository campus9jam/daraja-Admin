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
import { Switch } from "@/components/ui/switch";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useCurrentUser } from "@/hooks/use-current-user";

export const Route = createFileRoute("/_authenticated/admin/fabrics")({ component: FabricsPage });

function FabricsPage() {
  const { data: me } = useCurrentUser();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: "", composition: "", color: "", pattern: "", origin: "",
    price_per_meter: "", in_stock: true,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["admin-fabrics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fabric_catalog")
        .select("id, name, composition, color, pattern, origin, price_per_meter, in_stock, created_at")
        .order("created_at", { ascending: false }).limit(200);
      if (error) throw error;
      return data;
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("fabric_catalog").insert({
        name: form.name,
        composition: form.composition || null,
        color: form.color || null,
        pattern: form.pattern || null,
        origin: form.origin || null,
        price_per_meter: form.price_per_meter ? Number(form.price_per_meter) : null,
        in_stock: form.in_stock,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-fabrics"] });
      setOpen(false);
      setForm({ name: "", composition: "", color: "", pattern: "", origin: "", price_per_meter: "", in_stock: true });
      toast.success("Fabric added");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: async ({ id, val }: { id: string; val: boolean }) => {
      const { error } = await supabase.from("fabric_catalog").update({ in_stock: val }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-fabrics"] }),
  });

  return (
    <div>
      <PageHeader
        title="Fabric Catalog"
        description="Materials available to the tailoring atelier."
        actions={me?.isStaff ? <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Add fabric</Button> : null}
      />
      <DataTable
        loading={isLoading}
        rows={data ?? []}
        columns={[
          { key: "name", header: "Fabric" },
          { key: "composition", header: "Composition", render: (r: any) => <span className="text-xs text-muted-foreground">{r.composition ?? "—"}</span> },
          { key: "color", header: "Color", render: (r: any) => r.color ?? "—" },
          { key: "pattern", header: "Pattern", render: (r: any) => r.pattern ?? "—" },
          { key: "origin", header: "Origin", render: (r: any) => r.origin ?? "—" },
          { key: "price_per_meter", header: "Price / m", render: (r: any) => r.price_per_meter != null ? `KES ${Number(r.price_per_meter).toLocaleString()}` : "—" },
          {
            key: "in_stock", header: "In stock", render: (r: any) => me?.isStaff
              ? <Switch checked={!!r.in_stock} onCheckedChange={(v) => toggle.mutate({ id: r.id, val: v })} />
              : <Badge variant={r.in_stock ? "default" : "secondary"}>{r.in_stock ? "Yes" : "No"}</Badge>,
          },
        ]}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add fabric</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>Color</Label><Input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} /></div>
            </div>
            <div><Label>Composition</Label><Input placeholder="e.g. 100% cotton" value={form.composition} onChange={(e) => setForm({ ...form, composition: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Pattern</Label><Input value={form.pattern} onChange={(e) => setForm({ ...form, pattern: e.target.value })} /></div>
              <div><Label>Origin</Label><Input value={form.origin} onChange={(e) => setForm({ ...form, origin: e.target.value })} /></div>
            </div>
            <div><Label>Price per meter (KES)</Label><Input type="number" value={form.price_per_meter} onChange={(e) => setForm({ ...form, price_per_meter: e.target.value })} /></div>
            <div className="flex items-center justify-between rounded-md border border-border/60 p-3">
              <Label>In stock</Label>
              <Switch checked={form.in_stock} onCheckedChange={(v) => setForm({ ...form, in_stock: v })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button disabled={!form.name || create.isPending} onClick={() => create.mutate()}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}