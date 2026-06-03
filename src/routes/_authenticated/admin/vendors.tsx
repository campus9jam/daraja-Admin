import { createFileRoute } from "@tanstack/react-router";
import { SimpleTablePage } from "@/components/admin/simple-table-page";

export const Route = createFileRoute("/_authenticated/admin/vendors")({
  component: () => (
    <SimpleTablePage
      title="Vendor Performance"
      description="Vendor scorecards, fulfilment health, and ratings."
      table="vendor_performance"
      select="id, vendor_id, orders_count, fulfilment_rate, avg_rating, period, recorded_at"
      orderBy="recorded_at"
      columns={[
        { key: "vendor_id", header: "Vendor", render: (r: any) => <span className="font-mono text-xs">{(r.vendor_id ?? "").slice(0,8)}</span> },
        { key: "orders_count", header: "Orders" },
        { key: "fulfilment_rate", header: "Fulfilment", render: (r: any) => r.fulfilment_rate != null ? `${(Number(r.fulfilment_rate) * 100).toFixed(1)}%` : "—" },
        { key: "avg_rating", header: "Rating", render: (r: any) => Number(r.avg_rating ?? 0).toFixed(2) },
        { key: "period", header: "Period" },
      ]}
    />
  ),
});