import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/admin/page-header";
import { DataTable } from "@/components/admin/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import { useCurrentUser, type AppRole } from "@/hooks/use-current-user";
import { toast } from "sonner";
import { X } from "lucide-react";

const ALL_ROLES: AppRole[] = ["super_admin","admin","moderator","support","tailor","logistics","designer","vendor","customer"];

export const Route = createFileRoute("/_authenticated/admin/users")({ component: UsersPage });

function UsersPage() {
  const { data: me } = useCurrentUser();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<any | null>(null);
  const [addRole, setAddRole] = useState<AppRole>("moderator");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, display_name, username, created_at, user_roles(role)")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  const grant = useMutation({
    mutationFn: async ({ user_id, role }: { user_id: string; role: AppRole }) => {
      const { error } = await supabase.from("user_roles").insert({ user_id, role });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-users"] }); toast.success("Role granted"); },
    onError: (e: any) => toast.error(e.message),
  });
  const revoke = useMutation({
    mutationFn: async ({ user_id, role }: { user_id: string; role: AppRole }) => {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", user_id).eq("role", role);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-users"] }); toast.success("Role revoked"); },
    onError: (e: any) => toast.error(e.message),
  });

  const canManage = me?.isAdmin;

  return (
    <div>
      <PageHeader title="Users" description="All members and staff across the platform." />
      <DataTable
        loading={isLoading}
        rows={data ?? []}
        columns={[
          { key: "display_name", header: "Name", render: (r: any) => r.display_name || r.username || "—" },
          { key: "email", header: "Email" },
          { key: "roles", header: "Roles", render: (r: any) => (
            <div className="flex flex-wrap gap-1">
              {(r.user_roles ?? []).map((x: any) => <Badge key={x.role} variant="secondary">{x.role}</Badge>)}
            </div>
          )},
          { key: "created_at", header: "Joined", render: (r: any) => new Date(r.created_at).toLocaleDateString() },
          { key: "actions", header: "", render: (r: any) => canManage ? (
            <Button size="sm" variant="ghost" onClick={() => setEditing(r)}>Manage</Button>
          ) : null },
        ]}
      />

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Manage roles — {editing?.display_name || editing?.email}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {(editing?.user_roles ?? []).map((x: any) => (
                <Badge key={x.role} variant="secondary" className="gap-1">
                  {x.role}
                  <button
                    className="hover:text-destructive"
                    onClick={() => revoke.mutate({ user_id: editing.id, role: x.role })}
                  ><X className="h-3 w-3" /></button>
                </Badge>
              ))}
              {(!editing?.user_roles || editing.user_roles.length === 0) && (
                <span className="text-xs text-muted-foreground">No roles.</span>
              )}
            </div>
            <div className="flex gap-2">
              <select
                className="flex-1 h-9 rounded-md bg-background border border-border px-2 text-sm"
                value={addRole}
                onChange={(e) => setAddRole(e.target.value as AppRole)}
              >
                {ALL_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <Button
                onClick={() => grant.mutate({ user_id: editing.id, role: addRole })}
                disabled={grant.isPending}
              >Grant</Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}