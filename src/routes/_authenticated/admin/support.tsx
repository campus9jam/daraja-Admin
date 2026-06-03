import { createFileRoute } from "@tanstack/react-router";
import { SimpleTablePage } from "@/components/admin/simple-table-page";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/admin/support")({
  component: () => (
    <SimpleTablePage
      title="Customer Support"
      description="Tickets, conversations, and SLA tracking."
      table="support_tickets"
      select="id, subject, status, priority, user_id, created_at"
      columns={[
        { key: "subject", header: "Subject" },
        { key: "priority", header: "Priority", render: (r: any) => <Badge variant="outline" className="capitalize">{r.priority ?? "normal"}</Badge> },
        { key: "status", header: "Status", render: (r: any) => <Badge variant="secondary" className="capitalize">{r.status}</Badge> },
        { key: "user_id", header: "User", render: (r: any) => <span className="font-mono text-xs">{(r.user_id ?? "").slice(0,8)}</span> },
        { key: "created_at", header: "Opened", render: (r: any) => new Date(r.created_at).toLocaleDateString() },
      ]}
    />
  ),
});