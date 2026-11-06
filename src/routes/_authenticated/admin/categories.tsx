import { createFileRoute } from "@tanstack/react-router";
import { ModuleStatus } from "@/components/admin/module-status";

export const Route = createFileRoute("/_authenticated/admin/categories")({
  component: () => <ModuleStatus title="Product categories" description="The category manager expects a category table that is not present in the connected schema." requiredBackend="product_categories table, constraints, and staff write policies" />,
});
