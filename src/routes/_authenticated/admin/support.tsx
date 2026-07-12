import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-current-user";
import { PageHeader } from "@/components/admin/page-header";
import { DataTable } from "@/components/admin/data-table";
import { StatusSelect } from "@/components/admin/status-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { toast } from "sonner";

const TICKET_STATUSES = ["open", "pending", "resolved", "closed", "escalated"] as const;
const TRANSITIONS: Record<string, string[]> = {
  open:      ["pending", "escalated", "resolved", "closed"],
  pending:   ["open", "escalated", "resolved", "closed"],
  escalated: ["pending", "resolved", "closed"],
  resolved:  ["open", "closed"],
  closed:    ["open"],
};
const PRIORITIES = ["low", "normal", "high", "urgent"] as const;
const PRIORITY_COLOR: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  normal: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  high: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  urgent: "bg-red-500/10 text-red-400 border-red-500/30",
};
const KEY = ["admin-support"];

export const Route = createFileRoute("/_authenticated/admin/support")({ component: SupportPage });

function SupportPage() {
  const [openId, setOpenId] = useState<string | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("id, ticket_number, subject, status, priority, category, user_id, assigned_to, created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div>
      <PageHeader title="Customer Support" description="Cases, assignment, messaging, and audit trail." />
      <DataTable
        loading={isLoading}
        rows={data ?? []}
        columns={[
          {
            key: "ticket_number", header: "#", render: (r: any) => (
              <button className="font-mono text-xs text-primary hover:underline" onClick={() => setOpenId(r.id)}>
                {r.ticket_number ?? r.id.slice(0, 8)}
              </button>
            ),
          },
          {
            key: "subject", header: "Subject", render: (r: any) => (
              <button className="text-left font-medium hover:underline" onClick={() => setOpenId(r.id)}>{r.subject}</button>
            ),
          },
          { key: "priority", header: "Priority", render: (r: any) => <Badge variant="outline" className={`capitalize ${PRIORITY_COLOR[r.priority ?? "normal"] ?? ""}`}>{r.priority ?? "normal"}</Badge> },
            { key: "status", header: "Status", render: (r: any) => <Badge variant="outline" className="capitalize">{r.status}</Badge> },
          { key: "assigned_to", header: "Assignee", render: (r: any) => <span className="font-mono text-xs text-muted-foreground">{r.assigned_to ? r.assigned_to.slice(0, 8) : "Unassigned"}</span> },
          { key: "category", header: "Category", render: (r: any) => <span className="text-xs capitalize">{r.category ?? "—"}</span> },
          { key: "created_at", header: "Opened", render: (r: any) => new Date(r.created_at).toLocaleDateString() },
        ]}
      />
      <Sheet open={!!openId} onOpenChange={(o) => !o && setOpenId(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {openId ? <TicketDrawer id={openId} /> : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function TicketDrawer({ id }: { id: string }) {
  const { data: me } = useCurrentUser();
  const qc = useQueryClient();
  const { data: ticket, isLoading, error, refetch } = useQuery({
    queryKey: ["admin-ticket", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("support_tickets").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const { data: messages } = useQuery({
    queryKey: ["admin-ticket-messages", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_messages")
        .select("id, body, sender_id, is_internal, created_at")
        .eq("ticket_id", id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
  const { data: staff } = useQuery({
    queryKey: ["staff-list"],
    queryFn: async () => {
      const { data: roles } = await supabase.from("user_roles").select("user_id, role")
        .in("role", ["super_admin", "admin", "moderator", "support"]);
      const ids = Array.from(new Set((roles ?? []).map((r: any) => r.user_id)));
      if (ids.length === 0) return [] as { id: string; display_name: string | null; email: string | null }[];
      const { data: profiles } = await supabase.from("profiles").select("id, display_name, email").in("id", ids);
      return profiles ?? [];
    },
    staleTime: 60_000,
  });

  const writeAudit = async (action: string, before: any, after: any) => {
    await supabase.from("audit_logs").insert({
      action, entity_type: "support_ticket", entity_id: id,
      actor_id: me?.id ?? null, before, after,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
    });
  };

  const assign = useMutation({
    mutationFn: async (assignee: string | null) => {
      const before = { assigned_to: ticket?.assigned_to };
      const { error } = await supabase.from("support_tickets").update({ assigned_to: assignee }).eq("id", id);
      if (error) throw error;
      await writeAudit("ticket.assign", before, { assigned_to: assignee });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-ticket", id] });
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: ["admin-audit"] });
      toast.success("Assignment updated");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const setPriority = useMutation({
    mutationFn: async (priority: "low" | "normal" | "high" | "urgent") => {
      const before = { priority: ticket?.priority };
      const { error } = await supabase.from("support_tickets").update({ priority }).eq("id", id);
      if (error) throw error;
      await writeAudit("ticket.priority", before, { priority });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-ticket", id] });
      qc.invalidateQueries({ queryKey: KEY });
      toast.success("Priority updated");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const [body, setBody] = useState("");
  const [isInternal, setIsInternal] = useState(true);
  const sendMessage = useMutation({
    mutationFn: async () => {
      const trimmed = body.trim();
      if (!trimmed) throw new Error("Message cannot be empty");
      if (trimmed.length > 8000) throw new Error("Message too long (8000 char limit)");
      if (!me?.id) throw new Error("Not signed in");
      const { error } = await supabase.from("support_messages").insert({
        ticket_id: id, sender_id: me.id, body: trimmed, is_internal: isInternal,
      });
      if (error) throw error;
      await writeAudit(isInternal ? "ticket.note" : "ticket.reply", null, { length: trimmed.length });
    },
    onSuccess: () => {
      setBody("");
      qc.invalidateQueries({ queryKey: ["admin-ticket-messages", id] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (isLoading) {
    return <div className="space-y-3 py-4"><Skeleton className="h-6 w-1/2" /><Skeleton className="h-24" /><Skeleton className="h-32" /></div>;
  }
  if (error || !ticket) {
    return (
      <div className="py-6 space-y-3">
        <p className="text-sm text-destructive">{error ? String((error as any).message) : "Ticket not found"}</p>
        <Button size="sm" variant="outline" onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  return (
    <>
      <SheetHeader>
        <SheetTitle className="font-mono text-xs text-muted-foreground">{ticket.ticket_number ?? ticket.id.slice(0, 8)}</SheetTitle>
        <SheetDescription className="text-foreground text-base font-semibold">{ticket.subject}</SheetDescription>
      </SheetHeader>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <Label className="text-xs text-muted-foreground">Assignee</Label>
          <Select value={ticket.assigned_to ?? "unassigned"} onValueChange={(v) => assign.mutate(v === "unassigned" ? null : v)}>
            <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Unassigned</SelectItem>
              {(staff ?? []).map((s: any) => (
                <SelectItem key={s.id} value={s.id}>{s.display_name || s.email || s.id.slice(0, 8)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-xs text-muted-foreground">Priority</Label>
          <Select value={ticket.priority ?? "normal"} onValueChange={(v) => setPriority.mutate(v as any)}>
            <SelectTrigger className="h-9 capitalize"><SelectValue /></SelectTrigger>
            <SelectContent>
              {PRIORITIES.map((p) => <SelectItem key={p} value={p} className="capitalize">{p}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2">
          <Label className="text-xs text-muted-foreground">Status</Label>
          <div className="mt-1">
            <StatusSelect table="support_tickets" id={ticket.id} value={ticket.status} options={TICKET_STATUSES} queryKey={KEY} width="w-full" />
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Conversation</h4>
        <ScrollArea className="h-72 rounded border border-border/60 p-3">
          <div className="space-y-3">
            {(messages ?? []).length === 0 && <p className="text-xs text-muted-foreground text-center py-6">No messages yet.</p>}
            {(messages ?? []).map((m: any) => (
              <div key={m.id} className={`rounded p-2 text-sm ${m.is_internal ? "bg-amber-500/5 border border-amber-500/20" : "bg-muted/40"}`}>
                <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                  <span className="font-mono">{(m.sender_id ?? "").slice(0, 8)} {m.is_internal && <Badge variant="outline" className="ml-1 text-[9px] py-0">internal</Badge>}</span>
                  <span>{new Date(m.created_at).toLocaleString()}</span>
                </div>
                <p className="whitespace-pre-wrap">{m.body}</p>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      <div className="mt-4 space-y-2">
        <Textarea placeholder="Type a reply or internal note…" value={body} onChange={(e) => setBody(e.target.value)} rows={4} maxLength={8000} />
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-xs text-muted-foreground">
            <Switch checked={isInternal} onCheckedChange={setIsInternal} />
            Internal note (hidden from customer)
          </label>
          <Button size="sm" onClick={() => sendMessage.mutate()} disabled={sendMessage.isPending || !body.trim()}>
            {sendMessage.isPending ? "Sending…" : isInternal ? "Add note" : "Send reply"}
          </Button>
        </div>
      </div>
    </>
  );
}