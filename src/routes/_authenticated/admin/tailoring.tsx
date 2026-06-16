import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/admin/page-header";
import { DataTable } from "@/components/admin/data-table";
import { StatusSelect } from "@/components/admin/status-select";

const TAILORING_STATUSES = ["requested","measurements_pending","in_review","approved","in_production","quality_check","ready","delivered","cancelled","revision_requested"] as const;
const KEY = ["admin-tailoring"];

export const Route = createFileRoute("/_authenticated/admin/tailoring")({ component: TailoringPage });

function TailoringPage() {
  const { data, isLoading } = useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tailoring_orders")
        .select("id, status, style_brief, quoted_price, agreed_price, currency, delivery_date, created_at")
        .order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return data;
    },
  });
  return (
    <div>
      <PageHeader title="Bespoke Tailoring" description="Made-to-measure orders, fittings, and revisions." />
      <DataTable
        loading={isLoading}
        rows={data ?? []}
        columns={[
          { key: "id", header: "Order", render: (r: any) => <span className="font-mono text-xs">{r.id.slice(0,8)}</span> },
          { key: "style_brief", header: "Brief", render: (r: any) => <span className="text-xs line-clamp-1 max-w-[260px]">{r.style_brief ?? "—"}</span> },
          { key: "status", header: "Status", render: (r: any) => <StatusSelect table="tailoring_orders" id={r.id} value={r.status} options={TAILORING_STATUSES} queryKey={KEY} /> },
          { key: "agreed_price", header: "Price", render: (r: any) => `${r.currency ?? "KES"} ${Number(r.agreed_price ?? r.quoted_price ?? 0).toLocaleString()}` },
          { key: "delivery_date", header: "Due", render: (r: any) => r.delivery_date ? new Date(r.delivery_date).toLocaleDateString() : "—" },
          { key: "created_at", header: "Created", render: (r: any) => new Date(r.created_at).toLocaleDateString() },
        ]}
      />
    </div>
  );
}