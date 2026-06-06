import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const path = useRouterState({ select: (r) => r.location.pathname });
  const crumb = path.replace(/^\/admin\/?/, "") || "Dashboard";
  const { data: me, isLoading } = useCurrentUser();
  const navigate = useNavigate();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">Loading workspace…</div>;
  }
  if (!me?.isStaff) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md border-border/60">
          <CardHeader><CardTitle>Access denied</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>This account does not have staff permissions for the Admin OS.</p>
            <p className="text-xs font-mono">{me?.email}</p>
            <Button
              variant="outline" size="sm"
              onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/auth" }); }}
            >Sign out</Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center gap-3 border-b border-border/60 px-4 sticky top-0 bg-background/80 backdrop-blur z-10">
            <SidebarTrigger />
            <div className="text-xs text-muted-foreground uppercase tracking-wider">
              Admin <span className="opacity-50">/</span> <span className="text-foreground capitalize">{crumb.split("/")[0]}</span>
            </div>
          </header>
          <main className="flex-1 p-6 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}