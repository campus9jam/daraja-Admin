import {createFileRoute} from "@tanstack/react-router";
import {useQuery} from "@tanstack/react-query";
import {supabase} from "@/integrations/supabase/client";
import {PageHeader} from "@/components/admin/page-header";
import {DataTable} from "@/components/admin/data-table";
import {StatCard} from "@/components/admin/stat-card";
import {Badge} from "@/components/ui/badge";
import {Coins,Wallet,Activity} from "lucide-react";

export const Route=createFileRoute("/_authenticated/admin/rewards")({component:RewardsPage});
function RewardsPage(){
 const {data:txs,isLoading,error}=useQuery({queryKey:["hd-lee-transactions"],queryFn:async()=>{
  const {data,error}=await supabase.from("lee_transactions").select("id,user_id,type,amount,balance_before,balance_after,event_type,reference_id,description,created_at").order("created_at",{ascending:false}).limit(200);
  if(error)throw error;return data??[];
 }});
 const {data:totals}=useQuery({queryKey:["hd-lee-totals"],queryFn:async()=>{
  const [profiles,transactions]=await Promise.all([
   supabase.from("profiles").select("lee_balance,lee_lifetime_earned,lee_lifetime_spent"),
   supabase.from("lee_transactions").select("id",{count:"exact",head:true}),
  ]);
  if(profiles.error)throw profiles.error;if(transactions.error)throw transactions.error;
  return {users:profiles.data?.length??0,balance:(profiles.data??[]).reduce((s:any,p:any)=>s+Number(p.lee_balance??0),0),earned:(profiles.data??[]).reduce((s:any,p:any)=>s+Number(p.lee_lifetime_earned??0),0),spent:(profiles.data??[]).reduce((s:any,p:any)=>s+Number(p.lee_lifetime_spent??0),0),transactions:transactions.count??0};
 }});
 return <div className="space-y-6">
  <PageHeader title="LEE Rewards" description="Production LEE balances and immutable transaction history. Voucher issuance is managed in LEE Vouchers; balance adjustments must use the trusted award workflow."/>
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
   <StatCard icon={Wallet} label="Profiles" value={totals?.users??"—"}/>
   <StatCard icon={Coins} label="LEE in circulation" value={(totals?.balance??0).toLocaleString()}/>
   <StatCard icon={Coins} label="Lifetime earned" value={(totals?.earned??0).toLocaleString()}/>
   <StatCard icon={Activity} label="Transactions" value={(totals?.transactions??0).toLocaleString()}/>
  </div>
  {error&&<p className="text-sm text-destructive">{(error as Error).message}</p>}
  <DataTable loading={isLoading} rows={txs??[]} columns={[
   {key:"created_at",header:"When",render:(r:any)=><span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</span>},
   {key:"user_id",header:"User",render:(r:any)=><span className="font-mono text-xs">{r.user_id?.slice(0,8)??"—"}</span>},
   {key:"event_type",header:"Event",render:(r:any)=><Badge variant="outline">{r.event_type??r.type??"—"}</Badge>},
   {key:"amount",header:"LEE change",render:(r:any)=><span className={Number(r.amount)<0?"text-red-400":"text-emerald-400"}>{Number(r.amount??0).toLocaleString()}</span>},
   {key:"balance_after",header:"Balance after",render:(r:any)=>r.balance_after==null?"—":Number(r.balance_after).toLocaleString()},
   {key:"description",header:"Description",render:(r:any)=><span className="text-xs text-muted-foreground">{r.description??"—"}</span>},
   {key:"reference_id",header:"Reference",render:(r:any)=><span className="font-mono text-xs">{r.reference_id?.slice(0,8)??"—"}</span>},
  ]}/>
 </div>;
}
