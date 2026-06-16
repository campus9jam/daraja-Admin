import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/admin/page-header";
import { DataTable } from "@/components/admin/data-table";
import { StatusSelect } from "@/components/admin/status-select";
import { Badge } from "@/components/ui/badge";

const TICKET_STATUSES = ["open","pending","resolved","closed","escalated"] as const;
const PRIORITY_COLOR: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  normal: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  high: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  urgent: "bg-red-500/10 text-red-400 border-red-500/30",
};
const KEY = ["admin-support"];

export const Route = createFileRoute("/_authenticated/admin/support")({ component: SupportPage });

function SupportPage() {
  const { data, isLoading } = useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("id, ticket_number, subject, status, priority, category, user_id, created_at")
        .order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return data;
    },
  });
  return (
    <div>
      <PageHeader title="Customer Support" description="Tickets, conversations, and SLA tracking." />
      <DataTable
        loading={isLoading}
        rows={data ?? []}
        columns={[
          { key: "ticket_number", header: "#", render: (r: any) => <span className="font-mono text-xs">{r.ticket_number ?? r.id.slice(0,8)}</span> },
          { key: "subject", header: "Subject", render: (r: any) => <span className="font-medium">{r.subject}</span> },
          { key: "priority", header: "Priority", render: (r: any) => <Badge variant="outline" className={`capitalize ${PRIORITY_COLOR[r.priority ?? "normal"] ?? ""}`}>{r.priority ?? "normal"}</Badge> },
          { key: "status", header: "Status", render: (r: any) => <StatusSelect table="support_tickets" id={r.id} value={r.status} options={TICKET_STATUSES} queryKey={KEY} /> },
          { key: "category", header: "Category", render: (r: any) => <span className="text-xs capitalize">{r.category ?? "—"}</span> },
          { key: "created_at", header: "Opened", render: (r: any) => new Date(r.created_at).toLocaleDateString() },
        ]}
      />
    </div>
  );
}