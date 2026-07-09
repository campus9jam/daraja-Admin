import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/admin/page-header";
import { DataTable } from "@/components/admin/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { toast } from "sonner";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/products")({ component: ProductsPage });

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
}

function ProductsPage() {
  const { data: me } = useCurrentUser();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", description: "", base_price: "", currency: "KES" });

  const { data, isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, title, slug, base_price, currency, status, sales_count, created_at")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const slug = `${slugify(form.title)}-${Math.random().toString(36).slice(2, 6)}`;
      const { error } = await supabase.from("products").insert({
        title: form.title, slug, description: form.description || null,
        base_price: Number(form.base_price) || 0, currency: form.currency, status: "draft",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      setOpen(false); setForm({ title: "", description: "", base_price: "", currency: "KES" });
      toast.success("Product created");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div>
      <PageHeader
        title="Products"
        description="Marketplace catalog management."
        actions={me?.isStaff ? (
          <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> New product</Button>
        ) : null}
      />
      <DataTable
        loading={isLoading}
        rows={data ?? []}
        columns={[
          { key: "title", header: "Title", render: (r: any) => (
            <button className="text-left hover:text-primary" onClick={() => setEditId(r.id)}>{r.title}</button>
          ) },
          { key: "slug", header: "Slug", render: (r: any) => <span className="font-mono text-xs text-muted-foreground">{r.slug}</span> },
          { key: "base_price", header: "Price", render: (r: any) => `${r.currency ?? "KES"} ${Number(r.base_price ?? 0).toLocaleString()}` },
          { key: "sales_count", header: "Sold", render: (r: any) => r.sales_count ?? 0 },
          { key: "status", header: "Status", render: (r: any) => <Badge variant="secondary" className="capitalize">{r.status ?? "draft"}</Badge> },
        ]}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New product</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Base price</Label><Input type="number" value={form.base_price} onChange={(e) => setForm({ ...form, base_price: e.target.value })} /></div>
              <div><Label>Currency</Label><Input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button disabled={!form.title || create.isPending} onClick={() => create.mutate()}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ProductDrawer id={editId} onClose={() => setEditId(null)} canEdit={!!me?.isStaff} />
    </div>
  );
}

// Must match public.product_status enum in the database.
const PRODUCT_STATUSES = ["draft","pending_review","active","rejected","archived","out_of_stock"] as const;

function ProductDrawer({ id, onClose, canEdit }: { id: string | null; onClose: () => void; canEdit: boolean }) {
  const qc = useQueryClient();
  const { data, isLoading, isError, error, refetch } = useQuery({
    enabled: !!id,
    queryKey: ["admin-product", id],
    queryFn: async () => {
      const [p, m] = await Promise.all([
        supabase.from("products").select("*").eq("id", id!).maybeSingle(),
        supabase.from("product_media").select("*").eq("product_id", id!).order("display_order"),
      ]);
      if (p.error) throw p.error;
      if (m.error) throw m.error;
      if (!p.data) throw new Error("Product not found");
      return { product: p.data, media: m.data ?? [] };
    },
  });

  const update = useMutation({
    mutationFn: async (patch: any) => {
      const { error } = await (supabase.from("products") as any).update(patch).eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-product", id] });
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      toast.success("Saved");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const upload = useMutation({
    mutationFn: async (file: File) => {
      const path = `${id}/${Date.now()}-${file.name.replace(/[^a-z0-9.]/gi, "_")}`;
      const { error: upErr } = await supabase.storage.from("products").upload(path, file, { upsert: false });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("products").getPublicUrl(path);
      const { error } = await supabase.from("product_media").insert({
        product_id: id!, url: pub.publicUrl, media_type: "image",
        display_order: (data?.media.length ?? 0),
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-product", id] }); toast.success("Uploaded"); },
    onError: (e: any) => toast.error(e.message),
  });

  const removeMedia = useMutation({
    mutationFn: async (mid: string) => {
      const { error } = await supabase.from("product_media").delete().eq("id", mid);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-product", id] }),
  });

  const p = data?.product;
  const [local, setLocal] = useState<{ title?: string; base_price?: string; description?: string }>({});
  const titleVal = local.title ?? p?.title ?? "";
  const priceVal = local.base_price ?? (p?.base_price?.toString() ?? "");
  const descVal = local.description ?? p?.description ?? "";
  const titleTrimmed = titleVal.trim();
  const priceNum = Number(priceVal);
  const priceValid = priceVal !== "" && Number.isFinite(priceNum) && priceNum >= 0;
  const titleValid = titleTrimmed.length > 0 && titleTrimmed.length <= 200;
  const hasEdits = Object.keys(local).length > 0;
  const canSave = canEdit && hasEdits && titleValid && priceValid && !update.isPending;

  return (
    <Sheet open={!!id} onOpenChange={(o) => !o && (setLocal({}), onClose())}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{p?.title ?? "Product"}</SheetTitle>
          <SheetDescription className="font-mono text-xs">{p?.slug}</SheetDescription>
        </SheetHeader>
        {isLoading ? (
          <div className="py-8 text-sm text-muted-foreground">Loading product…</div>
        ) : isError ? (
          <div className="py-8 space-y-3">
            <div className="text-sm text-destructive">Failed to load product: {(error as any)?.message ?? "Unknown error"}</div>
            <Button size="sm" variant="outline" onClick={() => refetch()}>Retry</Button>
          </div>
        ) : !p ? (
          <div className="py-8 text-sm text-muted-foreground">Product not found.</div>
        ) : (
          <div className="mt-6 space-y-6">
            <section className="space-y-3">
              <div>
                <Label>Title</Label>
                <Input disabled={!canEdit} value={titleVal} onChange={(e) => setLocal({ ...local, title: e.target.value })} />
                {!titleValid && local.title !== undefined && (
                  <p className="text-xs text-destructive mt-1">Title must be 1–200 characters.</p>
                )}
              </div>
              <div><Label>Description</Label><Textarea disabled={!canEdit} rows={4} value={descVal} onChange={(e) => setLocal({ ...local, description: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Base price ({p.currency})</Label>
                  <Input disabled={!canEdit} type="number" min="0" step="0.01" value={priceVal} onChange={(e) => setLocal({ ...local, base_price: e.target.value })} />
                  {!priceValid && local.base_price !== undefined && (
                    <p className="text-xs text-destructive mt-1">Price must be a non-negative number.</p>
                  )}
                </div>
                <div>
                  <Label>Status</Label>
                  <Select disabled={!canEdit} value={p.status} onValueChange={(v) => update.mutate({ status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{PRODUCT_STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              {canEdit && (
                <Button size="sm" disabled={!canSave} onClick={() => {
                  const patch: any = {};
                  if (local.title !== undefined) patch.title = titleTrimmed;
                  if (local.description !== undefined) patch.description = local.description;
                  if (local.base_price !== undefined) patch.base_price = priceNum;
                  update.mutate(patch, { onSuccess: () => setLocal({}) });
                }}>Save changes</Button>
              )}
            </section>

            <section>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs uppercase tracking-wider text-muted-foreground">Media</h3>
                {canEdit && (
                  <label className="inline-flex items-center gap-1.5 text-xs cursor-pointer text-primary hover:underline">
                    <Upload className="h-3.5 w-3.5" /> Upload image
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                      const f = e.target.files?.[0]; if (f) upload.mutate(f); e.currentTarget.value = "";
                    }} />
                  </label>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {data?.media.length === 0 && <div className="col-span-3 text-xs text-muted-foreground border border-dashed border-border/60 rounded-md p-6 text-center">No media yet.</div>}
                {data?.media.map((m: any) => (
                  <div key={m.id} className="relative group rounded-md overflow-hidden border border-border/60 aspect-square bg-muted">
                    <img src={m.url} alt={m.alt_text ?? ""} className="w-full h-full object-cover" />
                    {canEdit && (
                      <button onClick={() => removeMedia.mutate(m.id)} className="absolute top-1 right-1 p-1 rounded bg-background/80 opacity-0 group-hover:opacity-100 transition">
                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}