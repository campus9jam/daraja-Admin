import { createFileRoute } from "@tanstack/react-router";
import { SimpleTablePage } from "@/components/admin/simple-table-page";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/admin/moderation")({
  component: () => (
    <SimpleTablePage
      title="Moderation"
      description="Reports, content flags, and resolution queue."
      table="moderation_reports"
      select="id, reason, status, target_type, target_id, reporter_id, created_at"
      columns={[
        { key: "target_type", header: "Target" },
        { key: "reason", header: "Reason" },
        { key: "status", header: "Status", render: (r: any) => <Badge variant="secondary" className="capitalize">{r.status}</Badge> },
        { key: "reporter_id", header: "Reporter", render: (r: any) => <span className="font-mono text-xs">{(r.reporter_id ?? "").slice(0,8)}</span> },
        { key: "created_at", header: "Filed", render: (r: any) => new Date(r.created_at).toLocaleDateString() },
      ]}
    />
  ),
});