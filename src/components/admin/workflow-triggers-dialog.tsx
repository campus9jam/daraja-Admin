import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export function WorkflowTriggersDialog({ wf, onClose }: { wf: unknown; onClose: () => void }) {
  return (
    <Dialog open={!!wf} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Workflow triggers</DialogTitle>
        </DialogHeader>
        <Badge variant="secondary">Not configured</Badge>
        <p className="text-sm text-muted-foreground">
          Workflow scheduling is unavailable until its database tables, protected scheduler, and server-side trigger operations are deployed.
        </p>
      </DialogContent>
    </Dialog>
  );
}
