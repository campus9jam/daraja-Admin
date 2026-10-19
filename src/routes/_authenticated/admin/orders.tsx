import {createFileRoute} from "@tanstack/react-router";
import {useMutation,useQuery,useQueryClient} from "@tanstack/react-query";
import {supabase} from "@/integrations/supabase/client";
import {PageHeader} from "@/components/admin/page-header";
import {DataTable} from "@/components/admin/data-table";
import {Badge} from "@/components/ui/badge";
import {Select,SelectContent,SelectItem,SelectTrigger,SelectValue} from "@/components/ui/select";
import {toast} from "sonner";

export const Route=createFileRoute("/_authenticated/admin/orders")({component:OrdersPage});
const KEY=["hd-orders"];
const STATUSES=["pending","confirmed","processing","shipped","delivered","cancelled","disputed"] as const;
function OrdersPage(){
 const qc=useQueryClient();
 const {data,isLoading,error}=useQuery({queryKey:KEY,queryFn:async()=>{
  const {data,error}=await supabase.from("orders").select("id,user_id,subtotal,delivery_fee,total_amount,currency,status,payment_status,payment_method,tracking_number,created_at,reservation_expires_at").order("created_at",{ascending:false}).limit(200);
  if(error)throw error;return data??[];
 }});
 const update=useMutation({mutationFn:async({id,status}:{id:string;status:string})=>{
  const {error}=await supabase.from("orders").update({status}).eq("id",id);if(error)throw error;
 },onSuccess:()=>{toast.success("Order status updated");qc.invalidateQueries({queryKey:KEY});},onError:(e:any)=>toast.error(e.message||"Update failed")});
 const money=(n:any,c:string)=>c==="NGN"||!c?`₦${Number(n??0).toLocaleString("en-NG")}`:`${c} ${Number(n??0).toLocaleString()}`;
 return <div className="space-y-4">
  <PageHeader title="Orders & payments" description="Monitor marketplace orders and payment status. Refunds and settlement must go through trusted payment workflows, not direct table inserts."/>
  {error&&<p className="text-sm text-destructive">{(error as Error).message}</p>}
  <DataTable loading={isLoading} rows={data??[]} columns={[
   {key:"id",header:"Order",render:(r:any)=><span className="font-mono text-xs">{r.id.slice(0,8)}</span>},
   {key:"user_id",header:"Customer",render:(r:any)=><span className="font-mono text-xs">{r.user_id?.slice(0,8)??"—"}</span>},
   {key:"status",header:"Fulfilment",render:(r:any)=><Select value={r.status} onValueChange={status=>update.mutate({id:r.id,status})}><SelectTrigger className="h-8 w-36 text-xs"><SelectValue/></SelectTrigger><SelectContent>{STATUSES.map(s=><SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>},
   {key:"payment_status",header:"Payment",render:(r:any)=><Badge variant={r.payment_status==="paid"?"default":"outline"}>{r.payment_status??"unknown"}</Badge>},
   {key:"payment_method",header:"Method",render:(r:any)=>r.payment_method??"—"},
   {key:"total_amount",header:"Total",render:(r:any)=>money(r.total_amount,r.currency)},
   {key:"tracking_number",header:"Tracking",render:(r:any)=>r.tracking_number??"—"},
   {key:"created_at",header:"Created",render:(r:any)=>new Date(r.created_at).toLocaleString()},
   {key:"reservation_expires_at",header:"Reservation",render:(r:any)=>r.reservation_expires_at?new Date(r.reservation_expires_at).toLocaleString():"—"},
  ]}/>
 </div>;
}
