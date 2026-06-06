import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/admin/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentUser } from "@/hooks/use-current-user";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/settings")({ component: SettingsPage });

function SettingsPage() {
  const { data: me } = useCurrentUser();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["feature-flags"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feature_flags").select("id, key, enabled, description").order("key");
      if (error) throw error;
      return data;
    },
  });
  const toggle = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase.from("feature_flags").update({ enabled }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["feature-flags"] }); toast.success("Flag updated"); },
    onError: (e: any) => toast.error(e.message),
  });
  return (
    <div>
      <PageHeader title="System Settings" description="Feature flags & system configuration." />
      <Card className="border-border/60">
        <CardContent className="p-0 divide-y divide-border/60">
          {isLoading ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="p-4"><Skeleton className="h-6" /></div>) :
            (data ?? []).length === 0 ? (
              <div className="p-6 text-sm text-muted-foreground text-center">No feature flags defined.</div>
            ) : data!.map((f: any) => (
              <div key={f.id} className="p-4 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium font-mono">{f.key}</div>
                  {f.description && <div className="text-xs text-muted-foreground mt-0.5">{f.description}</div>}
                </div>
                <Switch
                  checked={!!f.enabled}
                  disabled={!me?.isSuperAdmin || toggle.isPending}
                  onCheckedChange={(v) => toggle.mutate({ id: f.id, enabled: v })}
                />
              </div>
            ))}
        </CardContent>
      </Card>
      {!me?.isSuperAdmin && (
        <p className="text-xs text-muted-foreground mt-3">Only super admins can change feature flags.</p>
      )}
    </div>
  );
}