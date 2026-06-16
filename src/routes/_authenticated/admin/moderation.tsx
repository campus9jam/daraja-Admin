import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/admin/page-header";
import { DataTable } from "@/components/admin/data-table";
import { StatusSelect } from "@/components/admin/status-select";
import { Badge } from "@/components/ui/badge";

const MOD_STATUSES = ["open","reviewing","action_taken","dismissed","escalated"] as const;
const KEY = ["admin-moderation"];

export const Route = createFileRoute("/_authenticated/admin/moderation")({ component: ModerationPage });

function ModerationPage() {
  const { data, isLoading } = useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("moderation_reports")
        .select("id, reason, status, target_type, target_id, reporter_id, description, created_at")
        .order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return data;
    },
  });
  return (
    <div>
      <PageHeader title="Moderation" description="Reports, content flags, and resolution queue." />
      <DataTable
        loading={isLoading}
        rows={data ?? []}
        columns={[
          { key: "target_type", header: "Target", render: (r: any) => <Badge variant="outline" className="capitalize">{r.target_type}</Badge> },
          { key: "reason", header: "Reason", render: (r: any) => <span className="text-xs">{r.reason}</span> },
          { key: "description", header: "Notes", render: (r: any) => <span className="text-xs line-clamp-1 max-w-[260px] text-muted-foreground">{r.description ?? "—"}</span> },
          { key: "status", header: "Status", render: (r: any) => <StatusSelect table="moderation_reports" id={r.id} value={r.status} options={MOD_STATUSES} queryKey={KEY} /> },
          { key: "reporter_id", header: "Reporter", render: (r: any) => <span className="font-mono text-xs">{(r.reporter_id ?? "").slice(0,8)}</span> },
          { key: "created_at", header: "Filed", render: (r: any) => new Date(r.created_at).toLocaleDateString() },
        ]}
      />
    </div>
  );
}