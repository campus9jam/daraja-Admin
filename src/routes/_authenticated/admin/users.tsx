import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/admin/page-header";
import { DataTable } from "@/components/admin/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { UserDrawer } from "@/components/admin/user-drawer";

export const Route = createFileRoute("/_authenticated/admin/users")({ component: UsersPage });

function UsersPage() {
  const { data: me } = useCurrentUser();
  const [openId, setOpenId] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, display_name, username, account_status, created_at, user_roles(role)")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return data ?? [];
    return (data ?? []).filter((r: any) =>
      (r.email ?? "").toLowerCase().includes(s) ||
      (r.display_name ?? "").toLowerCase().includes(s) ||
      (r.username ?? "").toLowerCase().includes(s)
    );
  }, [data, q]);

  return (
    <div>
      <PageHeader title="Users" description="All members and staff across the platform." />
      <div className="mb-3 max-w-sm">
        <Input placeholder="Search by name or email…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <DataTable
        loading={isLoading}
        rows={rows}
        columns={[
          { key: "display_name", header: "Name", render: (r: any) => (
            <button className="hover:text-primary underline-offset-2 hover:underline text-left" onClick={() => setOpenId(r.id)}>
              {r.display_name || r.username || "—"}
            </button>
          ) },
          { key: "email", header: "Email" },
          { key: "account_status", header: "Status", render: (r: any) => <Badge variant="outline" className="capitalize">{(r.account_status ?? "active").replace("_"," ")}</Badge> },
          { key: "roles", header: "Roles", render: (r: any) => (
            <div className="flex flex-wrap gap-1">
              {(r.user_roles ?? []).map((x: any) => <Badge key={x.role} variant="secondary">{x.role}</Badge>)}
            </div>
          )},
          { key: "created_at", header: "Joined", render: (r: any) => new Date(r.created_at).toLocaleDateString() },
          { key: "actions", header: "", render: (r: any) => (
            <Button size="sm" variant="ghost" onClick={() => setOpenId(r.id)}>{me?.isAdmin ? "Manage" : "View"}</Button>
          ) },
        ]}
      />
      <UserDrawer id={openId} onClose={() => setOpenId(null)} />
    </div>
  );
}