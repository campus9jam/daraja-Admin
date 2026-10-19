import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/admin/page-header";
import { StatCard } from "@/components/admin/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Package, ShoppingCart, Scissors, Store, Gavel, Coins, Clock3 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/admin/")({ component: Overview });

function useCount(table: string, column = "id", filters?: (query: any) => any) {
  return useQuery({
    queryKey: ["hd-count", table, column],
    queryFn: async () => {
      let query: any = supabase.from(table as any).select(column, {count:"exact",head:true});
      if (filters) query = filters(query);
      const {count,error}=await query;
      if(error) throw error;
      return count ?? 0;
    },
  });
}

function Overview() {
  const users=useCount("profiles");
  const products=useCount("products");
  const orders=useCount("orders");
  const atelier=useCount("atelier_orders");
  const auctions=useCount("auctions");
  const applications=useCount("vendor_applications","id",q=>q.eq("status","pending"));
  const lee=useCount("lee_transactions");
  const {data:recentOrders,isLoading:ordersLoading,error:ordersError}=useQuery({
    queryKey:["hd-recent-orders"],
    queryFn:async()=>{
      const {data,error}=await supabase.from("orders").select("id,status,total_amount,currency,created_at,payment_status").order("created_at",{ascending:false}).limit(8);
      if(error) throw error;
      return data ?? [];
    },
  });
  const money=(value:number)=>new Intl.NumberFormat("en-NG",{style:"currency",currency:"NGN",maximumFractionDigits:0}).format(value);
  return <div className="space-y-6">
    <PageHeader title="House of Daraja Command Center" description="Live operational overview from the production House of Daraja backend."/>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard label="Members" value={users.data ?? "—"} icon={Users}/>
      <StatCard label="Products" value={products.data ?? "—"} icon={Package}/>
      <StatCard label="Orders" value={orders.data ?? "—"} icon={ShoppingCart}/>
      <StatCard label="Atelier orders" value={atelier.data ?? "—"} icon={Scissors}/>
      <StatCard label="Auctions" value={auctions.data ?? "—"} icon={Gavel}/>
      <StatCard label="Pending vendors" value={applications.data ?? "—"} icon={Store}/>
      <StatCard label="LEE transactions" value={lee.data ?? "—"} icon={Coins}/>
      <StatCard label="Needs review" value={applications.data ?? "—"} icon={Clock3}/>
    </div>
    <Card className="border-border/60">
      <CardHeader><CardTitle className="text-base">Recent marketplace orders</CardTitle></CardHeader>
      <CardContent>
        {ordersLoading?<div className="space-y-2">{Array.from({length:5}).map((_,i)=><Skeleton key={i} className="h-10"/>)}</div>
        :ordersError?<p className="text-sm text-destructive">{(ordersError as Error).message}</p>
        :recentOrders?.length?<div className="divide-y divide-border/60">{recentOrders.map((o:any)=><div key={o.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
          <span className="font-mono text-xs text-muted-foreground">{o.id.slice(0,8)}</span>
          <span className="capitalize text-muted-foreground">{o.status} · payment {o.payment_status ?? "unknown"}</span>
          <span className="font-medium">{o.currency==="NGN"||!o.currency?money(Number(o.total_amount??0)):`${o.currency} ${Number(o.total_amount??0).toLocaleString()}`}</span>
          <span className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</span>
        </div>)}</div>:<div className="py-6 text-center text-sm text-muted-foreground">No orders yet.</div>}
      </CardContent>
    </Card>
  </div>;
}
