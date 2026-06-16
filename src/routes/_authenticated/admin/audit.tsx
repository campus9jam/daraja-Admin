import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/admin/page-header";
import { DataTable } from "@/components/admin/data-table";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/admin/audit")({ component: AuditPage });

function AuditPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-audit"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("id, action, entity_type, entity_id, actor_id, user_agent, created_at")
        .order("created_at", { ascending: false }).limit(200);
      if (error) throw error;
      return data;
    },
  });
  return (
    <div>
      <PageHeader title="Audit Log" description="Immutable record of administrative actions across the system." />
      <DataTable
        loading={isLoading}
        rows={data ?? []}
        columns={[
          { key: "created_at", header: "When", render: (r: any) => <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</span> },
          { key: "actor_id", header: "Actor", render: (r: any) => <span className="font-mono text-xs">{(r.actor_id ?? "system").slice(0, 8)}</span> },
          { key: "action", header: "Action", render: (r: any) => <Badge variant="outline" className="font-mono text-[10px]">{r.action}</Badge> },
          { key: "entity_type", header: "Entity", render: (r: any) => <span className="capitalize">{r.entity_type}</span> },
          { key: "entity_id", header: "ID", render: (r: any) => <span className="font-mono text-xs">{(r.entity_id ?? "—").slice(0, 12)}</span> },
          { key: "user_agent", header: "Source", render: (r: any) => <span className="text-xs text-muted-foreground line-clamp-1 max-w-[200px]">{r.user_agent ?? "—"}</span> },
        ]}
      />
    </div>
  );
}