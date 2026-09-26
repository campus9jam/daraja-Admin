import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/admin/page-header";
import { DataTable } from "@/components/admin/data-table";
import { StatusSelect } from "@/components/admin/status-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ModerationDrawer } from "@/components/admin/moderation-drawer";
import { useState } from "react";

const MOD_STATUSES = ["open","reviewing","action_taken","dismissed","escalated"] as const;
const KEY = ["admin-moderation"];

export const Route = createFileRoute("/_authenticated/admin/moderation")({ component: ModerationPage });

function ModerationPage() {
  const [openId, setOpenId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("active");
  const { data, isLoading } = useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("moderation_reports")
        .select("id, reason, status, target_type, target_id, reporter_id, assigned_to, description, created_at")
        .order("created_at", { ascending: false }).limit(200);
      if (error) throw error;
      return data;
    },
  });
  const rows = (data ?? []).filter((r: any) =>
    filter === "all" ? true : filter === "active" ? ["open", "reviewing", "escalated"].includes(r.status) : r.status === filter);
  return (
    <div>
      <PageHeader title="Moderation" description="Reports, content flags, and resolution queue." />
      <div className="mb-3 flex flex-wrap gap-2">
        {["active", "all", ...MOD_STATUSES].map((f) => (
          <Button key={f} size="sm" variant={filter === f ? "default" : "outline"} className="capitalize" onClick={() => setFilter(f)}>
            {f.replace(/_/g, " ")}
          </Button>
        ))}
      </div>
      <DataTable
        loading={isLoading}
        rows={rows}
        columns={[
          { key: "target_type", header: "Target", render: (r: any) => <Badge variant="outline" className="capitalize">{r.target_type}</Badge> },
          { key: "reason", header: "Reason", render: (r: any) => <span className="text-xs">{r.reason}</span> },
          { key: "description", header: "Notes", render: (r: any) => <span className="text-xs line-clamp-1 max-w-[260px] text-muted-foreground">{r.description ?? "—"}</span> },
          { key: "status", header: "Status", render: (r: any) => <StatusSelect table="moderation_reports" id={r.id} value={r.status} options={MOD_STATUSES} queryKey={KEY} /> },
          { key: "assigned_to", header: "Assignee", render: (r: any) => <span className="font-mono text-xs">{(r.assigned_to ?? "—").slice(0,8)}</span> },
          { key: "created_at", header: "Filed", render: (r: any) => new Date(r.created_at).toLocaleDateString() },
          { key: "actions", header: "", render: (r: any) => <Button size="sm" variant="ghost" onClick={() => setOpenId(r.id)}>Open</Button> },
        ]}
      />
      <ModerationDrawer id={openId} onClose={() => setOpenId(null)} />
    </div>
  );
}