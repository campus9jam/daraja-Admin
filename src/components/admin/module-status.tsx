import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type ModuleStatusProps = {
  title: string;
  description: string;
  requiredBackend: string;
};

export function ModuleStatus({ title, description, requiredBackend }: ModuleStatusProps) {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <Badge variant="secondary">Not configured</Badge>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Backend setup required</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>This section is intentionally unavailable until its database schema, access policies, and server-side operations are implemented and verified.</p>
          <p><span className="font-medium text-foreground">Required backend:</span> {requiredBackend}</p>
          <p>No placeholder records are shown, and no writes are attempted from this screen.</p>
        </CardContent>
      </Card>
    </div>
  );
}
