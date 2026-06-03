import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/admin/page-header";
import { DataTable } from "@/components/admin/data-table";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/admin/orders")({ component: OrdersPage });

function OrdersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, order_number, status, payment_status, total_amount, currency, created_at")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div>
      <PageHeader title="Orders" description="All marketplace orders & payments." />
      <DataTable
        loading={isLoading}
        rows={data ?? []}
        columns={[
          { key: "order_number", header: "Order", render: (r: any) => <span className="font-mono text-xs">{r.order_number ?? r.id.slice(0,8)}</span> },
          { key: "status", header: "Status", render: (r: any) => <Badge variant="secondary" className="capitalize">{r.status}</Badge> },
          { key: "payment_status", header: "Payment", render: (r: any) => <Badge variant="outline" className="capitalize">{r.payment_status ?? "—"}</Badge> },
          { key: "total_amount", header: "Total", render: (r: any) => `${r.currency ?? "KES"} ${Number(r.total_amount ?? 0).toLocaleString()}` },
          { key: "created_at", header: "Date", render: (r: any) => new Date(r.created_at).toLocaleDateString() },
        ]}
      />
    </div>
  );
}