import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/admin/page-header";
import { DataTable } from "@/components/admin/data-table";

function pct(n: number | null | undefined) {
  if (n == null) return "—";
  return `${(Number(n) * 100).toFixed(1)}%`;
}
function color(rate: number | null | undefined, good = 0.9, ok = 0.75) {
  if (rate == null) return "text-muted-foreground";
  if (rate >= good) return "text-emerald-400";
  if (rate >= ok) return "text-amber-400";
  return "text-red-400";
}

export const Route = createFileRoute("/_authenticated/admin/vendors")({ component: VendorsPage });

function VendorsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-vendor-perf"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vendor_performance")
        .select("id, vendor_id, orders_count, on_time_rate, cancellation_rate, avg_rating, total_sales, period_start, period_end")
        .order("period_end", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });
  return (
    <div>
      <PageHeader title="Vendor Performance" description="Vendor scorecards, fulfilment health, and ratings." />
      <DataTable
        loading={isLoading}
        rows={data ?? []}
        columns={[
          { key: "vendor_id", header: "Vendor", render: (r: any) => <span className="font-mono text-xs">{(r.vendor_id ?? "").slice(0, 8)}</span> },
          { key: "orders_count", header: "Orders", render: (r: any) => Number(r.orders_count ?? 0).toLocaleString() },
          { key: "total_sales", header: "Sales", render: (r: any) => `KES ${Number(r.total_sales ?? 0).toLocaleString()}` },
          { key: "on_time_rate", header: "On-time", render: (r: any) => <span className={color(r.on_time_rate)}>{pct(r.on_time_rate)}</span> },
          { key: "cancellation_rate", header: "Cancel rate", render: (r: any) => <span className={color(r.cancellation_rate == null ? null : 1 - r.cancellation_rate)}>{pct(r.cancellation_rate)}</span> },
          { key: "avg_rating", header: "Rating", render: (r: any) => r.avg_rating != null ? `★ ${Number(r.avg_rating).toFixed(2)}` : "—" },
          { key: "period_end", header: "Period", render: (r: any) => `${r.period_start ? new Date(r.period_start).toLocaleDateString() : "—"} → ${r.period_end ? new Date(r.period_end).toLocaleDateString() : "—"}` },
        ]}
      />
    </div>
  );
}