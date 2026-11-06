import { createFileRoute } from "@tanstack/react-router";
import { ModuleStatus } from "@/components/admin/module-status";

export const Route = createFileRoute("/_authenticated/admin/settings")({
  component: () => <ModuleStatus title="Platform settings" description="The settings screen expects feature-flag and emergency-control records that are not present in the connected schema." requiredBackend="platform_settings, feature flags, emergency controls, and admin-only policies" />,
});
