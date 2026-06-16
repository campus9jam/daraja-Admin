import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/admin/page-header";
import { DataTable } from "@/components/admin/data-table";
import { StatusSelect } from "@/components/admin/status-select";

const DELIVERY_STATUSES = ["pending","assigned","picked_up","in_transit","out_for_delivery","delivered","failed","returned"] as const;
const KEY = ["admin-logistics"];

export const Route = createFileRoute("/_authenticated/admin/logistics")({ component: LogisticsPage });

function LogisticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("delivery_tasks")
        .select("id, status, pickup_address, drop_address, scheduled_pickup, cost, created_at")
        .order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return data;
    },
  });
  return (
    <div>
      <PageHeader title="Logistics" description="Live delivery tasks & courier coordination." />
      <DataTable
        loading={isLoading}
        rows={data ?? []}
        columns={[
          { key: "id", header: "Task", render: (r: any) => <span className="font-mono text-xs">{r.id.slice(0,8)}</span> },
          { key: "status", header: "Status", render: (r: any) => <StatusSelect table="delivery_tasks" id={r.id} value={r.status} options={DELIVERY_STATUSES} queryKey={KEY} /> },
          { key: "pickup_address", header: "Pickup", render: (r: any) => <span className="text-xs line-clamp-1 max-w-[200px]">{r.pickup_address ?? "—"}</span> },
          { key: "drop_address", header: "Drop-off", render: (r: any) => <span className="text-xs line-clamp-1 max-w-[200px]">{r.drop_address ?? "—"}</span> },
          { key: "scheduled_pickup", header: "Pickup at", render: (r: any) => r.scheduled_pickup ? new Date(r.scheduled_pickup).toLocaleString() : "—" },
          { key: "cost", header: "Cost", render: (r: any) => r.cost ? `KES ${Number(r.cost).toLocaleString()}` : "—" },
        ]}
      />
    </div>
  );
}