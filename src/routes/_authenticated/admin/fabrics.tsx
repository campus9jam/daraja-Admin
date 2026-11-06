import { createFileRoute } from "@tanstack/react-router";
import { ModuleStatus } from "@/components/admin/module-status";

export const Route = createFileRoute("/_authenticated/admin/fabrics")({
  component: () => <ModuleStatus title="Fabric catalogue" description="The fabric manager expects a fabrics table with fields that do not exist in the connected schema." requiredBackend="fabrics table, inventory fields, and staff write policies" />,
});
