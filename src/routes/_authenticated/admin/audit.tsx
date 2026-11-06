import { createFileRoute } from "@tanstack/react-router";
import { ModuleStatus } from "@/components/admin/module-status";

export const Route = createFileRoute("/_authenticated/admin/audit")({
  component: () => <ModuleStatus title="Audit log" description="The current screen expects an audit_logs table with a specific event structure; that contract is not present in the generated live schema." requiredBackend="audited event table, append-only policies, and server-side event writer" />,
});
