import { createFileRoute } from "@tanstack/react-router";
import { SimpleTablePage } from "@/components/admin/simple-table-page";

export const Route = createFileRoute("/_authenticated/admin/analytics")({
  component: () => (
    <SimpleTablePage
      title="Analytics"
      description="Business metrics & conversion tracking."
      table="business_metrics"
      select="id, metric_name, metric_value, period, recorded_at"
      orderBy="recorded_at"
      columns={[
        { key: "metric_name", header: "Metric" },
        { key: "metric_value", header: "Value", render: (r: any) => Number(r.metric_value ?? 0).toLocaleString() },
        { key: "period", header: "Period" },
        { key: "recorded_at", header: "Recorded", render: (r: any) => new Date(r.recorded_at).toLocaleString() },
      ]}
    />
  ),
});