import { createFileRoute } from "@tanstack/react-router";
import { SimpleTablePage } from "@/components/admin/simple-table-page";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/admin/logistics")({
  component: () => (
    <SimpleTablePage
      title="Logistics"
      description="Live delivery tasks & courier coordination."
      table="delivery_tasks"
      select="id, status, pickup_address, dropoff_address, agent_id, created_at"
      columns={[
        { key: "id", header: "Task", render: (r: any) => <span className="font-mono text-xs">{r.id.slice(0,8)}</span> },
        { key: "status", header: "Status", render: (r: any) => <Badge variant="secondary" className="capitalize">{r.status}</Badge> },
        { key: "pickup_address", header: "Pickup", render: (r: any) => <span className="text-xs">{r.pickup_address ?? "—"}</span> },
        { key: "dropoff_address", header: "Dropoff", render: (r: any) => <span className="text-xs">{r.dropoff_address ?? "—"}</span> },
        { key: "created_at", header: "Created", render: (r: any) => new Date(r.created_at).toLocaleDateString() },
      ]}
    />
  ),
});