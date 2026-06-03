import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/admin/page-header";
import { DataTable } from "@/components/admin/data-table";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/admin/users")({ component: UsersPage });

function UsersPage() {
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
        ]}
      />
    </div>
  );
}