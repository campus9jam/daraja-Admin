import { createFileRoute } from "@tanstack/react-router";
import { ModuleStatus } from "@/components/admin/module-status";

export const Route = createFileRoute("/_authenticated/admin/ai")({
  component: () => <ModuleStatus title="AI workflows" description="The automation UI previously depended on workflow and scheduler tables that are not present in the connected Supabase schema." requiredBackend="ai_workflows, ai_workflow_runs, ai_scheduler_state, ai_logs and secured scheduler RPCs" />,
});
