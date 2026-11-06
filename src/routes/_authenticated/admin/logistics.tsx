import { createFileRoute } from "@tanstack/react-router";
import { ModuleStatus } from "@/components/admin/module-status";

export const Route = createFileRoute("/_authenticated/admin/logistics")({
  component: () => <ModuleStatus title="Logistics" description="The logistics screen expects dispatch and task tables that are not present in the connected schema." requiredBackend="dispatch_tasks, delivery_assignments, status history, and role-scoped policies" />,
});
