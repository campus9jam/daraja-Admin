import { createFileRoute } from "@tanstack/react-router";
import { SimpleTablePage } from "@/components/admin/simple-table-page";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/admin/ai")({
  component: () => (
    <SimpleTablePage
      title="AI Workflows"
      description="Automation runs, model conversations, and recommendation pipelines."
      table="ai_workflows"
      select="id, name, status, trigger_type, last_run_at, created_at"
      columns={[
        { key: "name", header: "Workflow" },
        { key: "trigger_type", header: "Trigger" },
        { key: "status", header: "Status", render: (r: any) => <Badge variant="secondary" className="capitalize">{r.status ?? "idle"}</Badge> },
        { key: "last_run_at", header: "Last run", render: (r: any) => r.last_run_at ? new Date(r.last_run_at).toLocaleString() : "—" },
      ]}
    />
  ),
});