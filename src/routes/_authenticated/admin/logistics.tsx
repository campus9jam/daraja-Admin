import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/admin/page-header";
import { DataTable } from "@/components/admin/data-table";
import { StatusSelect } from "@/components/admin/status-select";
import { LogisticsDrawer } from "@/components/admin/logistics-drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMemo, useState } from "react";

const DELIVERY_STATUSES = ["pending","assigned","picked_up","in_transit","out_for_delivery","delivered","failed","returned"] as const;
const KEY = ["admin-logistics"];

export const Route = createFileRoute("/_authenticated/admin/logistics")({ component: LogisticsPage });

function LogisticsPage() {
  const [openId, setOpenId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("delivery_tasks")
        .select("id, status, pickup_address, drop_address, scheduled_pickup, cost, created_at, order:orders(order_number), agent:delivery_agents(full_name)")
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
      return (r.pickup_address ?? "").toLowerCase().includes(q)
        || (r.drop_address ?? "").toLowerCase().includes(q)
        || (r.order?.order_number ?? "").toLowerCase().includes(q)
        || r.id.toLowerCase().includes(q);
    });
  }, [data, statusFilter, search]);

  return (
    <div>
      <PageHeader title="Logistics" description="Live delivery tasks & courier coordination." />
      <div className="flex gap-2 mb-3">
        <Input placeholder="Search order, address, id…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48 capitalize"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {DELIVERY_STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, " ")}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <DataTable
        loading={isLoading}
        rows={rows}
        columns={[
          { key: "id", header: "Task", render: (r: any) => <span className="font-mono text-xs">{r.order?.order_number ?? r.id.slice(0,8)}</span> },
          { key: "status", header: "Status", render: (r: any) => <StatusSelect table="delivery_tasks" id={r.id} value={r.status} options={DELIVERY_STATUSES} queryKey={KEY} /> },
          { key: "agent", header: "Agent", render: (r: any) => <span className="text-xs">{r.agent?.full_name ?? "—"}</span> },
          { key: "pickup_address", header: "Pickup", render: (r: any) => <span className="text-xs line-clamp-1 max-w-[200px]">{r.pickup_address ?? "—"}</span> },
          { key: "drop_address", header: "Drop-off", render: (r: any) => <span className="text-xs line-clamp-1 max-w-[200px]">{r.drop_address ?? "—"}</span> },
          { key: "scheduled_pickup", header: "Pickup at", render: (r: any) => r.scheduled_pickup ? new Date(r.scheduled_pickup).toLocaleString() : "—" },
          { key: "cost", header: "Cost", render: (r: any) => r.cost ? `KES ${Number(r.cost).toLocaleString()}` : "—" },
          { key: "actions", header: "", render: (r: any) => <Button size="sm" variant="ghost" onClick={() => setOpenId(r.id)}>Open</Button> },
        ]}
      />
      <LogisticsDrawer taskId={openId} onClose={() => setOpenId(null)} />
    </div>
  );
}