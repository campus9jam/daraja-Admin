import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/admin/page-header";
import { StatCard } from "@/components/admin/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Package, ShoppingCart, Scissors, Truck, ShieldAlert, Gavel, Coins } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/admin/")({
  component: Overview,
});

function useCount(table: string) {
  return useQuery({
    queryKey: ["count", table],
    queryFn: async () => {
      const { count, error } = await supabase.from(table as any).select("*", { count: "exact", head: true });
      if (error) throw error;
      return count ?? 0;
    },
  });
}

function Overview() {
  const users = useCount("profiles");
  const products = useCount("products");
  const orders = useCount("orders");
  const tailoring = useCount("tailoring_orders");
  const deliveries = useCount("delivery_tasks");
  const auctions = useCount("auctions");
  const reports = useCount("moderation_reports");
  const wallets = useCount("wallets");

  const { data: recentOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ["recent-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders").select("id, order_number, status, grand_total, currency, created_at")
        .order("created_at", { ascending: false }).limit(8);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div>
      <PageHeader title="Executive Overview" description="Real-time pulse of the House of Daraja ecosystem." />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Members" value={users.data ?? "—"} icon={Users} />
        <StatCard label="Products" value={products.data ?? "—"} icon={Package} />
        <StatCard label="Orders" value={orders.data ?? "—"} icon={ShoppingCart} />
        <StatCard label="Tailoring jobs" value={tailoring.data ?? "—"} icon={Scissors} />
        <StatCard label="Deliveries" value={deliveries.data ?? "—"} icon={Truck} />
        <StatCard label="Auctions" value={auctions.data ?? "—"} icon={Gavel} />
        <StatCard label="Open reports" value={reports.data ?? "—"} icon={ShieldAlert} />
        <StatCard label="Wallets" value={wallets.data ?? "—"} icon={Coins} />
      </div>

      <Card className="mt-6 border-border/60">
        <CardHeader><CardTitle className="text-base">Recent orders</CardTitle></CardHeader>
        <CardContent>
          {ordersLoading ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
          ) : recentOrders && recentOrders.length > 0 ? (
            <div className="divide-y divide-border/60 -mx-2">
              {recentOrders.map((o: any) => (
                <div key={o.id} className="flex items-center justify-between px-2 py-2.5 text-sm">
                  <div className="font-mono text-xs text-muted-foreground">{o.order_number ?? o.id.slice(0, 8)}</div>
                  <div className="capitalize text-muted-foreground">{o.status}</div>
                  <div className="font-medium">{o.currency ?? "KES"} {Number(o.grand_total ?? 0).toLocaleString()}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-muted-foreground py-6 text-center">No orders yet.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}