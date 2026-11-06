import { createFileRoute } from "@tanstack/react-router";
import { ModuleStatus } from "@/components/admin/module-status";

export const Route = createFileRoute("/_authenticated/admin/moderation")({
  component: () => <ModuleStatus title="Moderation" description="The moderation screen expects moderation queues and account-control RPCs that are not present in the connected schema." requiredBackend="moderation_reports, moderation actions, audited account-control RPCs, and RLS" />,
});
