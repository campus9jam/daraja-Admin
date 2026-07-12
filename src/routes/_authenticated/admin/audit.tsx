import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/admin/page-header";
import { DataTable } from "@/components/admin/data-table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect, useMemo, useState } from "react";

export const Route = createFileRoute("/_authenticated/admin/audit")({ component: AuditPage });

const TICKET_ACTIONS = ["ticket.assign", "ticket.reply", "ticket.note", "ticket.priority", "ticket.status"] as const;

function AuditPage() {
  const qc = useQueryClient();
  const [action, setAction] = useState<string>("all");
  const [entity, setEntity] = useState<string>("");
  const [actor, setActor] = useState<string>("");

  const queryKey = useMemo(() => ["admin-audit", { action, entity, actor }], [action, entity, actor]);

  const { data, isLoading, refetch } = useQuery({
    queryKey,
    queryFn: async () => {
      let q = supabase
        .from("audit_logs")
        .select("id, action, entity_type, entity_id, actor_id, user_agent, created_at")
        .order("created_at", { ascending: false }).limit(200);
      if (action === "tickets") q = q.in("action", TICKET_ACTIONS as unknown as string[]);
      else if (action !== "all") q = q.eq("action", action);
      if (entity.trim()) q = q.ilike("entity_type", `%${entity.trim()}%`);
      if (actor.trim()) q = q.eq("actor_id", actor.trim());
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  // Realtime: fresh audit rows land immediately.
  useEffect(() => {
    const ch = supabase.channel("audit-live")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "audit_logs" }, () => {
        qc.invalidateQueries({ queryKey: ["admin-audit"] });
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);

  return (
    <div>
      <PageHeader title="Audit Log" description="Immutable record of administrative actions across the system." />
      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <Select value={action} onValueChange={setAction}>
          <SelectTrigger className="h-9 w-56"><SelectValue placeholder="Action" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All actions</SelectItem>
            <SelectItem value="tickets">All ticket events</SelectItem>
            <SelectItem value="ticket.assign">ticket.assign</SelectItem>
            <SelectItem value="ticket.reply">ticket.reply</SelectItem>
            <SelectItem value="ticket.note">ticket.note</SelectItem>
            <SelectItem value="ticket.priority">ticket.priority</SelectItem>
            <SelectItem value="ticket.status">ticket.status</SelectItem>
          </SelectContent>
        </Select>
        <Input placeholder="entity type…" value={entity} onChange={(e) => setEntity(e.target.value)} className="h-9 w-48" />
        <Input placeholder="actor id (uuid)…" value={actor} onChange={(e) => setActor(e.target.value)} className="h-9 w-72 font-mono text-xs" />
        <Button size="sm" variant="outline" onClick={() => refetch()}>Refresh</Button>
        <Button size="sm" variant="ghost" onClick={() => { setAction("all"); setEntity(""); setActor(""); }}>Reset</Button>
        <span className="text-xs text-muted-foreground ml-auto">{data?.length ?? 0} events · live</span>
      </div>
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