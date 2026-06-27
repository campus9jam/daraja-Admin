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
    name: "", composition: "", color: "", supplier: "",
    price_per_meter: "", currency: "KES", stock_meters: "", is_available: true,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["admin-fabrics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fabric_catalog")
        .select("id, name, composition, color, supplier, price_per_meter, currency, stock_meters, is_available, created_at")
        .order("created_at", { ascending: false }).limit(200);
      if (error) throw error;
      return data;
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("fabric_catalog").insert({
        name: form.name, composition: form.composition || null, color: form.color || null,
        supplier: form.supplier || null, currency: form.currency,
        price_per_meter: Number(form.price_per_meter) || 0,
        stock_meters: Number(form.stock_meters) || 0,
        is_available: form.is_available,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-fabrics"] });
      setOpen(false);
      setForm({ name: "", composition: "", color: "", supplier: "", price_per_meter: "", currency: "KES", stock_meters: "", is_available: true });
      toast.success("Fabric added");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggle = useMutation({
    mutationFn: async ({ id, avail }: { id: string; avail: boolean }) => {
      const { error } = await supabase.from("fabric_catalog").update({ is_available: avail }).eq("id", id);
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
          { key: "color", header: "Color" },
          { key: "supplier", header: "Supplier", render: (r: any) => r.supplier ?? "—" },
          { key: "price_per_meter", header: "Price / m", render: (r: any) => `${r.currency ?? "KES"} ${Number(r.price_per_meter ?? 0).toLocaleString()}` },
          { key: "stock_meters", header: "Stock (m)", render: (r: any) => {
            const s = Number(r.stock_meters ?? 0);
            const tone = s <= 0 ? "text-red-400" : s < 20 ? "text-amber-400" : "text-emerald-400";
            return <span className={`font-mono text-xs ${tone}`}>{s.toFixed(1)}</span>;
          }},
          {
            key: "is_available", header: "Available", render: (r: any) => me?.isStaff
              ? <Switch checked={!!r.is_available} onCheckedChange={(v) => toggle.mutate({ id: r.id, avail: v })} />
              : <Badge variant={r.is_available ? "default" : "secondary"}>{r.is_available ? "Yes" : "No"}</Badge>,
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
            <div><Label>Supplier</Label><Input value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} /></div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Price / m</Label><Input type="number" value={form.price_per_meter} onChange={(e) => setForm({ ...form, price_per_meter: e.target.value })} /></div>
              <div><Label>Currency</Label><Input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })} /></div>
              <div><Label>Stock (m)</Label><Input type="number" value={form.stock_meters} onChange={(e) => setForm({ ...form, stock_meters: e.target.value })} /></div>
            </div>
            <div className="flex items-center justify-between rounded-md border border-border/60 p-3">
              <Label>Available for orders</Label>
              <Switch checked={form.is_available} onCheckedChange={(v) => setForm({ ...form, is_available: v })} />
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