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
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { runAiWorkflow } from "@/lib/ai.functions";
import { RunsTab, DiagnoseTab } from "@/components/admin/workflow-runs";
import { WorkflowTriggersDialog } from "@/components/admin/workflow-triggers-dialog";

export const Route = createFileRoute("/_authenticated/admin/ai")({ component: AIPage });

function AIPage() {
  return (
    <div>
      <PageHeader title="AI Workflows" description="Automation pipelines, schedules, run history, and failure diagnosis." />
      <Tabs defaultValue="workflows">
        <TabsList>
          <TabsTrigger value="workflows">Workflows</TabsTrigger>
          <TabsTrigger value="runs">Run history</TabsTrigger>
          <TabsTrigger value="diagnose">Diagnose</TabsTrigger>
          <TabsTrigger value="conversations">Conversations</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
        </TabsList>
        <TabsContent value="workflows" className="mt-4"><WorkflowsTab /></TabsContent>
        <TabsContent value="runs" className="mt-4"><RunsTab /></TabsContent>
        <TabsContent value="diagnose" className="mt-4"><DiagnoseTab /></TabsContent>
        <TabsContent value="conversations" className="mt-4"><ConversationsTab /></TabsContent>
        <TabsContent value="feedback" className="mt-4"><FeedbackTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function WorkflowsTab() {
  const { data: me } = useCurrentUser();
  const qc = useQueryClient();
  const [runFor, setRunFor] = useState<any>(null);
  const [trigFor, setTrigFor] = useState<any>(null);
  const [creating, setCreating] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-ai-workflows"],
    queryFn: async () => {
      const { data, error } = await supabase.from("ai_workflows")
        .select("id, name, description, trigger_type, is_active, total_runs, last_run_at, created_at, schedule_interval_minutes, schedule_enabled, next_run_at, event_trigger, event_enabled")
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
    <div>
      {me?.isAdmin && <div className="mb-3"><Button size="sm" onClick={() => setCreating(true)}>New workflow</Button></div>}
      <DataTable
        loading={isLoading}
        rows={data ?? []}
        columns={[
          { key: "name", header: "Workflow", render: (r: any) => (
            <div><div className="font-medium">{r.name}</div>{r.description && <div className="text-xs text-muted-foreground line-clamp-1 max-w-[300px]">{r.description}</div>}</div>
          ) },
          { key: "triggers", header: "Triggers", render: (r: any) => (
            <div className="flex flex-wrap gap-1">
              <Badge variant="outline" className="text-[10px]">manual</Badge>
              {r.schedule_enabled && <Badge className="text-[10px]">every {r.schedule_interval_minutes}m</Badge>}
              {r.event_enabled && <Badge variant="secondary" className="text-[10px] font-mono">{r.event_trigger}</Badge>}
            </div>
          ) },
          { key: "total_runs", header: "Runs", render: (r: any) => Number(r.total_runs ?? 0).toLocaleString() },
          { key: "last_run_at", header: "Last run", render: (r: any) => r.last_run_at ? new Date(r.last_run_at).toLocaleString() : "—" },
          { key: "is_active", header: "Active", render: (r: any) => (
            <Switch checked={!!r.is_active} disabled={!me?.isStaff || toggle.isPending} onCheckedChange={(v) => toggle.mutate({ id: r.id, is_active: v })} />
          ) },
          { key: "run", header: "", render: (r: any) => (
            <div className="flex gap-1 justify-end">
              {me?.isAdmin && <Button size="sm" variant="ghost" onClick={() => setTrigFor(r)}>Triggers</Button>}
              {me?.isStaff && <Button size="sm" variant="ghost" disabled={!r.is_active} onClick={() => setRunFor(r)}>Run</Button>}
            </div>
          ) },
        ]}
      />
      <RunDialog wf={runFor} onClose={() => setRunFor(null)} />
      <WorkflowTriggersDialog wf={trigFor} onClose={() => setTrigFor(null)} />
      <CreateDialog open={creating} onClose={() => setCreating(false)} />
    </div>
  );
}

function RunDialog({ wf, onClose }: { wf: any; onClose: () => void }) {
  const qc = useQueryClient();
  const run = useServerFn(runAiWorkflow);
  const [input, setInput] = useState("");
  const [out, setOut] = useState<string | null>(null);
  const mut = useMutation({
    mutationFn: () => run({ data: { workflowId: wf.id, input: input.trim(), idempotencyKey: crypto.randomUUID() } }),
    onSuccess: (r) => {
      setOut(r.output);
      qc.invalidateQueries({ queryKey: ["admin-ai-workflows"] });
      qc.invalidateQueries({ queryKey: ["admin-ai-runs"] });
    },
    onError: (e: any) => { toast.error(e.message); qc.invalidateQueries({ queryKey: ["admin-ai-runs"] }); },
  });
  return (
    <Dialog open={!!wf} onOpenChange={(o) => { if (!o) { onClose(); setOut(null); setInput(""); } }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Run: {wf?.name}</DialogTitle></DialogHeader>
        <Textarea rows={5} maxLength={8000} placeholder="Input for this run (e.g. a product description to enrich, a ticket to triage)…"
          value={input} onChange={(e) => setInput(e.target.value)} />
        <Button disabled={!input.trim() || mut.isPending} onClick={() => mut.mutate()}>
          {mut.isPending ? "Running…" : "Run workflow"}
        </Button>
        {out && <div className="max-h-80 overflow-auto rounded-md border border-border/60 p-3 text-sm whitespace-pre-wrap">{out}</div>}
      </DialogContent>
    </Dialog>
  );
}

function CreateDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const [f, setF] = useState({ name: "", description: "", trigger_type: "manual", prompt: "" });
  const mut = useMutation({
    mutationFn: async () => {
      if (!f.name.trim() || f.name.length > 120) throw new Error("Name is required (max 120 chars)");
      const { error } = await supabase.from("ai_workflows").insert({
        name: f.name.trim(), description: f.description.trim() || null, trigger_type: f.trigger_type,
        is_active: true, config: f.prompt.trim() ? { prompt: f.prompt.trim() } : {},
      });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-ai-workflows"] }); toast.success("Workflow created"); onClose(); setF({ name: "", description: "", trigger_type: "manual", prompt: "" }); },
    onError: (e: any) => toast.error(e.message),
  });
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>New AI workflow</DialogTitle></DialogHeader>
        <Input placeholder="Name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <Input placeholder="Description" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
        <Textarea rows={4} placeholder="Instructions for the AI (optional)" value={f.prompt} onChange={(e) => setF({ ...f, prompt: e.target.value })} />
        <Button disabled={mut.isPending} onClick={() => mut.mutate()}>Create</Button>
      </DialogContent>
    </Dialog>
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