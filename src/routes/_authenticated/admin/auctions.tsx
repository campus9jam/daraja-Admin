import { createFileRoute } from "@tanstack/react-router";
import { SimpleTablePage } from "@/components/admin/simple-table-page";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/admin/auctions")({
  component: () => (
    <SimpleTablePage
      title="Auctions"
      description="Live and scheduled auctions, watchers, and winners."
      table="auctions"
      select="id, title, status, starting_price, current_bid, currency, end_time, created_at"
      columns={[
        { key: "title", header: "Title" },
        { key: "status", header: "Status", render: (r: any) => <Badge variant="secondary" className="capitalize">{r.status}</Badge> },
        { key: "starting_price", header: "Start", render: (r: any) => `${r.currency ?? "KES"} ${Number(r.starting_price ?? 0).toLocaleString()}` },
        { key: "current_bid", header: "Current", render: (r: any) => `${r.currency ?? "KES"} ${Number(r.current_bid ?? 0).toLocaleString()}` },
        { key: "end_time", header: "Ends", render: (r: any) => r.end_time ? new Date(r.end_time).toLocaleString() : "—" },
      ]}
    />
  ),
});