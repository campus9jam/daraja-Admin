import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { DataTable } from "@/components/admin/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCurrentUser } from "@/hooks/use-current-user";
import { toast } from "sonner";
import {
  diagnoseWorkflowFailure, getSchedulerStatus, resumeScheduler, retryWorkflowRun,
} from "@/lib/ai.functions";

const RUNS_KEY = ["admin-ai-runs"];

function statusVariant(s: string): "default" | "secondary" | "destructive" | "outline" {
  return s === "failed" ? "destructive" : s === "succeeded" ? "default" : s === "running" ? "secondary" : "outline";
}

export function RunsTab() {
  const qc = useQueryClient();
  const { data: me } = useCurrentUser();
  const [status, setStatus] = useState("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const fetchStatus = useServerFn(getSchedulerStatus);
  const resume = useServerFn(resumeScheduler);
  const sched = useQuery({ queryKey: ["admin-ai-scheduler"], queryFn: () => fetchStatus() });
  const { data, isLoading } = useQuery({
    queryKey: [...RUNS_KEY, status],
    queryFn: async () => {
      let q = supabase.from("ai_workflow_runs")
        .select("id, status, trigger_source, attempt, retry_of, error, error_status, duration_ms, created_at, ai_workflows(name)")
        .order("created_at", { ascending: false }).limit(150);
      if (status !== "all") q = q.eq("status", status);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });
  useEffect(() => {
    const ch = supabase.channel("ai-runs")
      .on("postgres_changes", { event: "*", schema: "public", table: "ai_workflow_runs" }, () => {
        qc.invalidateQueries({ queryKey: RUNS_KEY });
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [qc]);
  const resumeMut = useMutation({
    mutationFn: () => resume(),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-ai-scheduler"] }); toast.success("Automation resumed"); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-3">
      {sched.data?.pausedReason && (
        <Card className="border-destructive/50 p-3 text-sm flex items-center justify-between gap-3">
          <span><b>Automatic runs paused:</b> {sched.data.pausedReason}</span>
          {me?.isAdmin && <Button size="sm" variant="outline" disabled={resumeMut.isPending} onClick={() => resumeMut.mutate()}>Resume</Button>}
        </Card>
      )}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="h-8 w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            {["all", "queued", "running", "succeeded", "failed"].map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
          </SelectContent>
        </Select>
        {sched.data?.lastTickAt && <span>Scheduler last ran {new Date(sched.data.lastTickAt).toLocaleString()}</span>}
      </div>
      <DataTable
        loading={isLoading}
        rows={data ?? []}
        empty="No runs yet."
        columns={[
          { key: "created_at", header: "When", render: (r: any) => <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</span> },
          { key: "wf", header: "Workflow", render: (r: any) => r.ai_workflows?.name ?? "—" },
          { key: "trigger_source", header: "Source", render: (r: any) => <Badge variant="outline" className="capitalize">{r.trigger_source}</Badge> },
          { key: "status", header: "Status", render: (r: any) => <Badge variant={statusVariant(r.status)} className="capitalize">{r.status}</Badge> },
          { key: "attempt", header: "Attempt", render: (r: any) => `#${r.attempt}` },
          { key: "error", header: "Error", render: (r: any) => <span className="text-xs line-clamp-1 max-w-[260px] text-muted-foreground">{r.error ?? "—"}</span> },
          { key: "duration_ms", header: "ms", render: (r: any) => r.duration_ms ?? "—" },
          { key: "open", header: "", render: (r: any) => <Button size="sm" variant="ghost" onClick={() => setOpenId(r.id)}>Open</Button> },
        ]}
      />
      <RunDrawer id={openId} onClose={() => setOpenId(null)} onOpen={setOpenId} />
    </div>
  );
}

function RunDrawer({ id, onClose, onOpen }: { id: string | null; onClose: () => void; onOpen: (id: string) => void }) {
  const qc = useQueryClient();
  const { data: me } = useCurrentUser();
  const retry = useServerFn(retryWorkflowRun);
  const diagnose = useServerFn(diagnoseWorkflowFailure);
  const [extraLogs, setExtraLogs] = useState("");
  const q = useQuery({
    queryKey: ["admin-ai-run", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from("ai_workflow_runs").select("*, ai_workflows(name)").eq("id", id!).maybeSingle();
      if (error) throw error;
      const { data: retries } = await supabase.from("ai_workflow_runs").select("id, status, attempt, created_at")
        .eq("retry_of", id!).order("created_at");
      return { run: data, retries: retries ?? [] };
    },
  });
  const refresh = () => { qc.invalidateQueries({ queryKey: RUNS_KEY }); qc.invalidateQueries({ queryKey: ["admin-ai-run", id] }); };
  const retryMut = useMutation({
    mutationFn: () => retry({ data: { runId: id! } }),
    onSuccess: (r) => { refresh(); r.status === "succeeded" ? toast.success("Retry succeeded") : toast.error(`Retry ${r.status}: ${r.error ?? ""}`); onOpen(r.runId); },
    onError: (e: any) => toast.error(e.message),
  });
  const diagMut = useMutation({
    mutationFn: () => diagnose({ data: { runId: id!, logs: extraLogs.trim() || undefined } }),
    onSuccess: () => { refresh(); toast.success("Diagnosis ready"); },
    onError: (e: any) => toast.error(e.message),
  });
  const run: any = q.data?.run;
  const hasLiveRetry = (q.data?.retries ?? []).some((r: any) => ["queued", "running", "succeeded"].includes(r.status));

  return (
    <Sheet open={!!id} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader><SheetTitle>Workflow run</SheetTitle></SheetHeader>
        {q.isLoading && <p className="mt-6 text-sm text-muted-foreground">Loading…</p>}
        {q.isError && <p className="mt-6 text-sm text-destructive">Couldn't load this run.</p>}
        {run && (
          <div className="mt-6 space-y-4 text-sm">
            <div className="flex flex-wrap gap-2">
              <Badge variant={statusVariant(run.status)} className="capitalize">{run.status}</Badge>
              <Badge variant="outline" className="capitalize">{run.trigger_source}</Badge>
              <Badge variant="outline">Attempt #{run.attempt}</Badge>
              <span className="text-xs text-muted-foreground">{run.ai_workflows?.name}</span>
            </div>
            {run.retry_of && <Button size="sm" variant="link" className="px-0" onClick={() => onOpen(run.retry_of)}>← View original run</Button>}
            <Section title="Input"><pre className="whitespace-pre-wrap text-xs">{run.input}</pre></Section>
            {run.output && <Section title="Output"><div className="whitespace-pre-wrap text-xs">{run.output}</div></Section>}
            {run.error && <Section title={`Error${run.error_status ? ` (${run.error_status})` : ""}`}><p className="text-xs text-destructive">{run.error}</p></Section>}

            {run.status === "failed" && me?.isStaff && (
              <div className="space-y-2">
                <Button size="sm" disabled={retryMut.isPending || hasLiveRetry} onClick={() => retryMut.mutate()}>
                  {retryMut.isPending ? "Retrying…" : hasLiveRetry ? "Already retried" : "Retry with same input"}
                </Button>
                <p className="text-xs text-muted-foreground">Retries reuse the original input and can only happen once per failed run, so nothing runs twice.</p>
              </div>
            )}

            {me?.isStaff && (
              <div className="space-y-2 border-t border-border/60 pt-4">
                <h4 className="text-xs uppercase tracking-wider text-muted-foreground">AI diagnosis</h4>
                <Textarea rows={3} maxLength={20000} placeholder="Optional: paste extra logs or context"
                  value={extraLogs} onChange={(e) => setExtraLogs(e.target.value)} />
                <Button size="sm" variant="secondary" disabled={diagMut.isPending} onClick={() => diagMut.mutate()}>
                  {diagMut.isPending ? "Diagnosing…" : run.diagnosis ? "Diagnose again" : "Diagnose this run"}
                </Button>
                {run.diagnosis && <div className="rounded-md border border-border/60 p-3 text-xs whitespace-pre-wrap">{run.diagnosis}</div>}
              </div>
            )}

            {(q.data?.retries ?? []).length > 0 && (
              <Section title="Retries">
                <ul className="space-y-1">
                  {q.data!.retries.map((r: any) => (
                    <li key={r.id} className="flex justify-between text-xs">
                      <button className="underline" onClick={() => onOpen(r.id)}>Attempt #{r.attempt}</button>
                      <span className="capitalize">{r.status}</span>
                    </li>
                  ))}
                </ul>
              </Section>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{title}</h4>
      <div className="max-h-64 overflow-auto rounded-md border border-border/60 p-3">{children}</div>
    </div>
  );
}

export function DiagnoseTab() {
  const diagnose = useServerFn(diagnoseWorkflowFailure);
  const [logs, setLogs] = useState("");
  const mut = useMutation({
    mutationFn: () => diagnose({ data: { logs: logs.trim() } }),
    onError: (e: any) => toast.error(e.message),
  });
  return (
    <div className="space-y-3 max-w-3xl">
      <p className="text-sm text-muted-foreground">Paste workflow run logs or error output. The AI will explain what went wrong and how to fix it.</p>
      <Textarea rows={10} maxLength={20000} placeholder="Paste logs here…" value={logs} onChange={(e) => setLogs(e.target.value)} />
      <Button disabled={!logs.trim() || mut.isPending} onClick={() => mut.mutate()}>{mut.isPending ? "Diagnosing…" : "Diagnose"}</Button>
      {mut.data && <Card className="p-4 text-sm whitespace-pre-wrap">{mut.data.diagnosis}</Card>}
    </div>
  );
}
