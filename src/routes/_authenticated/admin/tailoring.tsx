import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/admin/page-header";
import { DataTable } from "@/components/admin/data-table";
import { StatusSelect } from "@/components/admin/status-select";
import { TailoringDrawer } from "@/components/admin/tailoring-drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMemo, useState } from "react";

const TAILORING_STATUSES = ["requested","measurements_pending","in_review","approved","in_production","quality_check","ready","delivered","cancelled","revision_requested"] as const;
const KEY = ["admin-tailoring"];

export const Route = createFileRoute("/_authenticated/admin/tailoring")({ component: TailoringPage });

function TailoringPage() {
  const [openId, setOpenId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tailoring_orders")
        .select("id, status, style_brief, quoted_price, agreed_price, currency, delivery_date, created_at, customer:profiles!tailoring_orders_customer_id_fkey(display_name, email)")
        .order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return data;
    },
  });

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data ?? []).filter((r: any) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (!q) return true;
      return (r.style_brief ?? "").toLowerCase().includes(q)
        || (r.customer?.display_name ?? "").toLowerCase().includes(q)
        || (r.customer?.email ?? "").toLowerCase().includes(q)
        || r.id.toLowerCase().includes(q);
    });
  }, [data, statusFilter, search]);

  return (
    <div>
      <PageHeader title="Bespoke Tailoring" description="Made-to-measure orders, fittings, and revisions." />
      <div className="flex gap-2 mb-3">
        <Input placeholder="Search brief, customer, id…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48 capitalize"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {TAILORING_STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, " ")}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <DataTable
        loading={isLoading}
        rows={rows}
        columns={[
          { key: "id", header: "Order", render: (r: any) => <span className="font-mono text-xs">{r.id.slice(0,8)}</span> },
          { key: "customer", header: "Customer", render: (r: any) => <span className="text-xs">{r.customer?.display_name || r.customer?.email || "—"}</span> },
          { key: "style_brief", header: "Brief", render: (r: any) => <span className="text-xs line-clamp-1 max-w-[260px]">{r.style_brief ?? "—"}</span> },
          { key: "status", header: "Status", render: (r: any) => <StatusSelect table="tailoring_orders" id={r.id} value={r.status} options={TAILORING_STATUSES} queryKey={KEY} /> },
          { key: "agreed_price", header: "Price", render: (r: any) => `${r.currency ?? "KES"} ${Number(r.agreed_price ?? r.quoted_price ?? 0).toLocaleString()}` },
          { key: "delivery_date", header: "Due", render: (r: any) => r.delivery_date ? new Date(r.delivery_date).toLocaleDateString() : "—" },
          { key: "created_at", header: "Created", render: (r: any) => new Date(r.created_at).toLocaleDateString() },
          { key: "actions", header: "", render: (r: any) => <Button size="sm" variant="ghost" onClick={() => setOpenId(r.id)}>Open</Button> },
        ]}
      />
      <TailoringDrawer orderId={openId} onClose={() => setOpenId(null)} />
    </div>
  );
}