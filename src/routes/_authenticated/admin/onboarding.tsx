import { createFileRoute } from "@tanstack/react-router";
import { ModuleStatus } from "@/components/admin/module-status";

export const Route = createFileRoute("/_authenticated/admin/onboarding")({
  component: () => <ModuleStatus title="Staff onboarding" description="The staff onboarding screen expects staff application records and approval RPCs that are not present in the connected schema." requiredBackend="staff_applications, approval/rejection RPCs, and audited role provisioning" />,
});
