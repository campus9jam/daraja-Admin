import { createFileRoute } from "@tanstack/react-router";
import { ModuleStatus } from "@/components/admin/module-status";

export const Route = createFileRoute("/_authenticated/admin/support")({
  component: () => <ModuleStatus title="Customer support" description="The support screen expects ticket and reply tables that are not present in the connected schema." requiredBackend="support_tickets, support_replies, status workflow, and staff/customer RLS" />,
});
