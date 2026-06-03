import { createFileRoute } from "@tanstack/react-router";
import { SimpleTablePage } from "@/components/admin/simple-table-page";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/admin/tailoring")({
  component: () => (
    <SimpleTablePage
      title="Bespoke Tailoring"
      description="Made-to-measure orders, fittings, and revisions."
      table="tailoring_orders"
      select="id, order_number, status, garment_type, total_price, currency, created_at"
      columns={[
        { key: "order_number", header: "Order", render: (r: any) => <span className="font-mono text-xs">{r.order_number ?? r.id.slice(0,8)}</span> },
        { key: "garment_type", header: "Garment" },
        { key: "status", header: "Status", render: (r: any) => <Badge variant="secondary" className="capitalize">{r.status}</Badge> },
        { key: "total_price", header: "Price", render: (r: any) => `${r.currency ?? "KES"} ${Number(r.total_price ?? 0).toLocaleString()}` },
        { key: "created_at", header: "Date", render: (r: any) => new Date(r.created_at).toLocaleDateString() },
      ]}
    />
  ),
});