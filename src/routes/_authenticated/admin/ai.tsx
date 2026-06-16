import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/admin/page-header";
import { DataTable } from "@/components/admin/data-table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useCurrentUser } from "@/hooks/use-current-user";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/ai")({ component: AIPage });

function AIPage() {
  return (
    <div>
      <PageHeader title="AI Workflows" description="Automation pipelines, agent conversations, and feedback loops." />
      <Tabs defaultValue="workflows">
        <TabsList>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="conversations">Conversations</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
        </TabsList>
        <TabsContent value="workflows" className="mt-4"><WorkflowsTab /></TabsContent>
        <TabsContent value="conversations" className="mt-4"><ConversationsTab /></TabsContent>
        <TabsContent value="feedback" className="mt-4"><FeedbackTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function WorkflowsTab() {
  const { data: me } = useCurrentUser();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-ai-workflows"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ai_workflows")
        .select("id, name, description, trigger_type, is_active, total_runs, last_run_at, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const toggle = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("ai_workflows").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-ai-workflows"] }); toast.success("Workflow updated"); },
    onError: (e: any) => toast.error(e.message),
  });
  return (
    <DataTable
      loading={isLoading}
      rows={data ?? []}
      columns={[
        { key: "name", header: "Workflow", render: (r: any) => (
          <div><div className="font-medium">{r.name}</div>{r.description && <div className="text-xs text-muted-foreground line-clamp-1 max-w-[300px]">{r.description}</div>}</div>
        ) },
        { key: "trigger_type", header: "Trigger", render: (r: any) => <Badge variant="outline" className="font-mono text-[10px]">{r.trigger_type ?? "manual"}</Badge> },
        { key: "total_runs", header: "Runs", render: (r: any) => Number(r.total_runs ?? 0).toLocaleString() },
        { key: "last_run_at", header: "Last run", render: (r: any) => r.last_run_at ? new Date(r.last_run_at).toLocaleString() : "—" },
        { key: "is_active", header: "Active", render: (r: any) => (
          <Switch checked={!!r.is_active} disabled={!me?.isStaff || toggle.isPending} onCheckedChange={(v) => toggle.mutate({ id: r.id, is_active: v })} />
        ) },
      ]}
    />
  );
}

function ConversationsTab() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-ai-conversations"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ai_conversations")
        .select("id, title, agent, user_id, is_archived, created_at, updated_at")
        .order("updated_at", { ascending: false }).limit(100);
      if (error) throw error;
      return data;
    },
  });
  return (
    <DataTable
      loading={isLoading}
      rows={data ?? []}
      columns={[
        { key: "title", header: "Conversation", render: (r: any) => <span className="font-medium">{r.title ?? "Untitled"}</span> },
        { key: "agent", header: "Agent", render: (r: any) => <Badge variant="outline" className="font-mono text-[10px]">{r.agent ?? "—"}</Badge> },
        { key: "user_id", header: "User", render: (r: any) => <span className="font-mono text-xs">{(r.user_id ?? "").slice(0, 8)}</span> },
        { key: "is_archived", header: "State", render: (r: any) => r.is_archived ? <Badge variant="secondary">archived</Badge> : <Badge>active</Badge> },
        { key: "updated_at", header: "Updated", render: (r: any) => new Date(r.updated_at).toLocaleString() },
      ]}
    />
  );
}

function FeedbackTab() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-ai-feedback"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ai_feedback")
        .select("*").order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return data;
    },
  });
  return (
    <DataTable
      loading={isLoading}
      rows={data ?? []}
      columns={[
        { key: "created_at", header: "When", render: (r: any) => <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</span> },
        { key: "rating", header: "Rating", render: (r: any) => r.rating != null ? `★ ${r.rating}` : "—" },
        { key: "feedback_type", header: "Type", render: (r: any) => <Badge variant="outline">{r.feedback_type ?? r.type ?? "—"}</Badge> },
        { key: "comment", header: "Comment", render: (r: any) => <span className="text-xs line-clamp-2 max-w-[420px]">{r.comment ?? r.notes ?? "—"}</span> },
      ]}
    />
  );
}