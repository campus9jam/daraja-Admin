import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { updateWorkflowTriggers, WORKFLOW_EVENTS } from "@/lib/ai.functions";

const EVENT_LABELS: Record<string, string> = {
  "orders.insert": "New order placed",
  "support_tickets.insert": "New support ticket",
  "moderation_reports.insert": "New moderation report",
  "products.insert": "New product listed",
  "tailoring_orders.insert": "New tailoring request",
};

export function WorkflowTriggersDialog({ wf, onClose }: { wf: any; onClose: () => void }) {
  const qc = useQueryClient();
  const save = useServerFn(updateWorkflowTriggers);
  const [interval, setIntervalMin] = useState("");
  const [schedOn, setSchedOn] = useState(false);
  const [evt, setEvt] = useState<string>("none");
  const [evtOn, setEvtOn] = useState(false);
  useEffect(() => {
    if (!wf) return;
    setIntervalMin(wf.schedule_interval_minutes ? String(wf.schedule_interval_minutes) : "");
    setSchedOn(!!wf.schedule_enabled);
    setEvt(wf.event_trigger ?? "none");
    setEvtOn(!!wf.event_enabled);
  }, [wf]);
  const mut = useMutation({
    mutationFn: () => {
      const n = interval.trim() ? Number(interval) : null;
      if (n !== null && (!Number.isInteger(n) || n < 5 || n > 43200)) throw new Error("Interval must be 5–43200 minutes");
      return save({ data: {
        workflowId: wf.id, scheduleIntervalMinutes: n, scheduleEnabled: schedOn,
        eventTrigger: evt === "none" ? null : (evt as any), eventEnabled: evtOn,
      } });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-ai-workflows"] }); toast.success("Triggers saved"); onClose(); },
    onError: (e: any) => toast.error(e.message),
  });
  return (
    <Dialog open={!!wf} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Triggers: {wf?.name}</DialogTitle></DialogHeader>
        <div className="space-y-2">
          <div className="flex items-center justify-between"><span className="text-sm font-medium">Repeat on a schedule</span><Switch checked={schedOn} onCheckedChange={setSchedOn} /></div>
          <div className="flex items-center gap-2 text-sm">
            Every <Input className="w-24 h-8" inputMode="numeric" value={interval} onChange={(e) => setIntervalMin(e.target.value)} placeholder="60" /> minutes
          </div>
          {wf?.next_run_at && wf?.schedule_enabled && <p className="text-xs text-muted-foreground">Next run: {new Date(wf.next_run_at).toLocaleString()}</p>}
        </div>
        <div className="space-y-2 border-t border-border/60 pt-4">
          <div className="flex items-center justify-between"><span className="text-sm font-medium">Run when something happens</span><Switch checked={evtOn} onCheckedChange={setEvtOn} /></div>
          <Select value={evt} onValueChange={setEvt}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No event</SelectItem>
              {WORKFLOW_EVENTS.map((e) => <SelectItem key={e} value={e}>{EVENT_LABELS[e]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button disabled={mut.isPending} onClick={() => mut.mutate()}>Save</Button>
      </DialogContent>
    </Dialog>
  );
}
