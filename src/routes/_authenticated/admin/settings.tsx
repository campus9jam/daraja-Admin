import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/admin/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useCurrentUser } from "@/hooks/use-current-user";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/settings")({ component: SettingsPage });

function SettingsPage() {
  const { data: me } = useCurrentUser();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["feature-flags"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feature_flags").select("id, key, is_enabled, description").order("key");
      if (error) throw error;
      return data;
    },
  });
  const toggle = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase.from("feature_flags").update({ is_enabled: enabled }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["feature-flags"] }); toast.success("Flag updated"); },
    onError: (e: any) => toast.error(e.message),
  });
  return (
    <div className="space-y-6">
      <PageHeader title="System Settings" description="Feature flags & system configuration." />
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Feature flags</CardTitle>
          <CardDescription>Roll capabilities on or off without redeploying.</CardDescription>
        </CardHeader>
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
                  checked={!!f.is_enabled}
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
      <EmergencyControlsCard canEdit={!!me?.isSuperAdmin} />
    </div>
  );
}

function EmergencyControlsCard({ canEdit }: { canEdit: boolean }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["emergency-controls"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("emergency_controls")
        .select("id, key, description, is_engaged, engaged_at, engaged_by")
        .order("key");
      if (error) throw error;
      return data;
    },
  });
  const toggle = useMutation({
    mutationFn: async ({ id, engaged }: { id: string; engaged: boolean }) => {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase.from("emergency_controls").update({
        is_engaged: engaged,
        engaged_at: engaged ? new Date().toISOString() : null,
        engaged_by: engaged ? u.user?.id ?? null : null,
      }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["emergency-controls"] }); toast.success("Control updated"); },
    onError: (e: any) => toast.error(e.message),
  });
  return (
    <Card className="border-red-500/30">
      <CardHeader>
        <CardTitle className="text-sm font-medium uppercase tracking-wide text-red-400 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" /> Emergency controls
        </CardTitle>
        <CardDescription>Kill-switches that immediately freeze high-risk surfaces.</CardDescription>
      </CardHeader>
      <CardContent className="p-0 divide-y divide-border/60">
        {isLoading ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="p-4"><Skeleton className="h-6" /></div>) :
          (data ?? []).length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground text-center">No emergency controls defined.</div>
          ) : data!.map((c: any) => (
            <div key={c.id} className="p-4 flex items-center justify-between">
              <div>
                <div className="text-sm font-medium font-mono">{c.key}</div>
                {c.description && <div className="text-xs text-muted-foreground mt-0.5">{c.description}</div>}
                {c.is_engaged && c.engaged_at && (
                  <div className="text-[10px] uppercase tracking-wider text-red-400 mt-1">
                    Engaged · {new Date(c.engaged_at).toLocaleString()}
                  </div>
                )}
              </div>
              <Switch
                checked={!!c.is_engaged}
                disabled={!canEdit || toggle.isPending}
                onCheckedChange={(v) => toggle.mutate({ id: c.id, engaged: v })}
              />
            </div>
          ))}
      </CardContent>
    </Card>
  );
}