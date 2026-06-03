import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({ label, value, delta, icon: Icon, className }: {
  label: string; value: string | number; delta?: string;
  icon?: React.ComponentType<{ className?: string }>; className?: string;
}) {
  return (
    <Card className={cn("border-border/60", className)}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
          {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
        </div>
        <div className="mt-2 text-2xl font-semibold tracking-tight">{value}</div>
        {delta && <div className="mt-1 text-xs text-muted-foreground">{delta}</div>}
      </CardContent>
    </Card>
  );
}