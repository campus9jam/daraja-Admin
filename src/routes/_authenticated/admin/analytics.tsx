import { createFileRoute } from "@tanstack/react-router";
import { ModuleStatus } from "@/components/admin/module-status";

export const Route = createFileRoute("/_authenticated/admin/analytics")({
  component: () => <ModuleStatus title="Analytics" description="The current analytics queries depend on aggregate views and reporting sources that have not been confirmed in the connected schema." requiredBackend="Verified reporting views, aggregation functions, and staff-scoped read policies" />,
});
