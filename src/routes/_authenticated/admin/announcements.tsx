import { createFileRoute } from "@tanstack/react-router";
import { ModuleStatus } from "@/components/admin/module-status";

export const Route = createFileRoute("/_authenticated/admin/announcements")({
  component: () => <ModuleStatus title="Announcements" description="The announcements manager expects a dedicated publishing table that is not present in the connected schema." requiredBackend="announcements table, publishing status fields, and staff write policies" />,
});
