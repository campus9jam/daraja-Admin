import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/use-current-user";

export function UserDrawer({ id, onClose }: { id: string | null; onClose: () => void }) {
  const { data: me } = useCurrentUser();

  const { data, isLoading, isError, error, refetch } = useQuery({
    enabled: !!id,
    queryKey: ["admin-user", id],
    queryFn: async () => {
      const [profile, wallet, transactions, orders, applications] = await Promise.all([
        supabase.from("profiles")
          .select("id, username, display_name, avatar_url, bio, role, created_at, lee_balance, lee_lifetime_earned, lee_lifetime_spent")
          .eq("id", id!)
          .maybeSingle(),
        supabase.from("user_wallets").select("lee_balance").eq("user_id", id!).maybeSingle(),
        supabase.from("lee_transactions")
          .select("id, type, amount, balance_before, balance_after, event_type, description, created_at")
          .eq("user_id", id!)
          .order("created_at", { ascending: false })
          .limit(30),
        supabase.from("orders")
          .select("id, status, total_amount, currency, created_at")
          .eq("user_id", id!)
          .order("created_at", { ascending: false })
          .limit(20),
        supabase.from("vendor_applications")
          .select("id, business_name, status, created_at")
          .eq("user_id", id!)
          .order("created_at", { ascending: false }),
      ]);

      for (const result of [profile, wallet, transactions, orders, applications]) {
        if (result.error) throw result.error;
      }
      if (!profile.data) throw new Error("User profile not found");

      return {
        profile: profile.data,
        wallet: wallet.data,
        transactions: transactions.data ?? [],
        orders: orders.data ?? [],
        applications: applications.data ?? [],
      };
    },
  });

  const p = data?.profile;
  const isAdmin = me?.isAdmin === true;
  const balance = Number(data?.wallet?.lee_balance ?? p?.lee_balance ?? 0);

  return (
    <Sheet open={!!id} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>{p?.display_name || p?.username || "User profile"}</SheetTitle>
          <SheetDescription>
            {p ? `Member since ${new Date(p.created_at).toLocaleDateString()}` : "Loading profile…"}
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="py-8 text-sm text-muted-foreground">Loading user…</div>
        ) : isError ? (
          <div className="space-y-3 py-8">
            <p className="text-sm text-destructive">Failed to load: {(error as Error)?.message}</p>
            <Button size="sm" variant="outline" onClick={() => void refetch()}>Retry</Button>
          </div>
        ) : !p ? (
          <div className="py-8 text-sm text-muted-foreground">User not found.</div>
        ) : (
          <Tabs defaultValue="profile" className="mt-4">
            <TabsList>
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="roles">Access</TabsTrigger>
              <TabsTrigger value="wallet">LEE wallet</TabsTrigger>
              <TabsTrigger value="orders">Orders</TabsTrigger>
              <TabsTrigger value="activity">Applications</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="mt-4 space-y-4">
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                <dt className="text-muted-foreground">Username</dt><dd>{p.username ?? "—"}</dd>
                <dt className="text-muted-foreground">Display name</dt><dd>{p.display_name ?? "—"}</dd>
                <dt className="text-muted-foreground">Profile ID</dt><dd className="break-all font-mono text-xs">{p.id}</dd>
                <dt className="text-muted-foreground">Created</dt><dd>{new Date(p.created_at).toLocaleString()}</dd>
              </dl>
              {p.bio && <p className="border-t border-border/60 pt-3 text-sm text-muted-foreground">{p.bio}</p>}
            </TabsContent>

            <TabsContent value="roles" className="mt-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Application role</span>
                <Badge variant={p.role === "admin" ? "default" : "secondary"}>{p.role || "user"}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {isAdmin
                  ? "Role changes are intentionally not performed from this profile drawer. Use the approved staff-provisioning workflow so every privilege change is authorized and audited."
                  : "Only authorized administrators can manage staff access."}
              </p>
            </TabsContent>

            <TabsContent value="wallet" className="mt-4 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded border border-border/60 p-3">
                  <div className="text-[10px] uppercase text-muted-foreground">LEE balance</div>
                  <div className="font-mono text-lg">{balance.toLocaleString()}</div>
                </div>
                <div className="rounded border border-border/60 p-3">
                  <div className="text-[10px] uppercase text-muted-foreground">Lifetime earned</div>
                  <div className="font-mono text-lg">{Number(p.lee_lifetime_earned).toLocaleString()}</div>
                </div>
                <div className="rounded border border-border/60 p-3">
                  <div className="text-[10px] uppercase text-muted-foreground">Lifetime spent</div>
                  <div className="font-mono text-lg">{Number(p.lee_lifetime_spent).toLocaleString()}</div>
                </div>
              </div>
              <div className="divide-y divide-border/60 rounded border border-border/60">
                {data!.transactions.length === 0 && <div className="p-3 text-xs text-muted-foreground">No LEE transactions.</div>}
                {data!.transactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between gap-3 p-3 text-xs">
                    <div>
                      <div className="font-medium capitalize">{transaction.event_type.replaceAll("_", " ")}</div>
                      <div className="text-muted-foreground">{transaction.description ?? transaction.type} · {new Date(transaction.created_at).toLocaleString()}</div>
                    </div>
                    <div className="text-right font-mono">
                      <div>{Number(transaction.amount).toLocaleString()} LEE</div>
                      <div className="text-muted-foreground">Balance: {Number(transaction.balance_after).toLocaleString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="orders" className="mt-4">
              <div className="divide-y divide-border/60 rounded border border-border/60">
                {data!.orders.length === 0 && <div className="p-3 text-xs text-muted-foreground">No orders.</div>}
                {data!.orders.map((order) => (
                  <div key={order.id} className="flex flex-wrap justify-between gap-2 p-3 text-xs">
                    <span className="font-mono">{order.id.slice(0, 8)}</span>
                    <span className="capitalize text-muted-foreground">{order.status}</span>
                    <span className="font-mono">{order.currency} {Number(order.total_amount).toLocaleString()}</span>
                    <span className="text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="activity" className="mt-4">
              <div className="divide-y divide-border/60 rounded border border-border/60">
                {data!.applications.length === 0 && <div className="p-3 text-xs text-muted-foreground">No vendor applications.</div>}
                {data!.applications.map((application) => (
                  <div key={application.id} className="flex items-center justify-between gap-3 p-3 text-xs">
                    <div><div className="font-medium">{application.business_name}</div><div className="text-muted-foreground">{new Date(application.created_at).toLocaleDateString()}</div></div>
                    <Badge variant="outline" className="capitalize">{application.status}</Badge>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </SheetContent>
    </Sheet>
  );
}
