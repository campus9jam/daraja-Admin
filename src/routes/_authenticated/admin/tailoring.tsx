import {createFileRoute} from "@tanstack/react-router";
import {useMutation,useQuery,useQueryClient} from "@tanstack/react-query";
import {supabase} from "@/integrations/supabase/client";
import {PageHeader} from "@/components/admin/page-header";
import {DataTable} from "@/components/admin/data-table";
import {Badge} from "@/components/ui/badge";
import {Select,SelectContent,SelectItem,SelectTrigger,SelectValue} from "@/components/ui/select";
import {toast} from "sonner";

export const Route=createFileRoute("/_authenticated/admin/tailoring")({component:TailoringPage});
const KEY=["hd-atelier-orders"];
const STATUSES=["submitted","quoted","deposit_paid","cutting","sewing","finishing","quality_check","ready","shipped","delivered","cancelled"] as const;
function TailoringPage(){
 const qc=useQueryClient();
 const {data,isLoading,error}=useQuery({queryKey:KEY,queryFn:async()=>{
  const {data,error}=await supabase.from("atelier_orders").select("id,user_id,artisan_id,gender,garment_type,occasion,fabric,color,status,estimated_delivery,price_quote,deposit_paid,serial_number,created_at,updated_at,measurement_unit,fit_preference,special_instructions").order("created_at",{ascending:false}).limit(200);
  if(error)throw error;return data??[];
 }});
 const update=useMutation({mutationFn:async({id,status}:{id:string;status:string})=>{
  const {error}=await supabase.from("atelier_orders").update({status}).eq("id",id);if(error)throw error;
 },onSuccess:()=>{toast.success("Atelier status updated");qc.invalidateQueries({queryKey:KEY});},onError:(e:any)=>toast.error(e.message||"Status update failed")});
 const currency=(n:any)=>n==null?"Not quoted":`₦${Number(n).toLocaleString("en-NG")}`;
 return <div className="space-y-4">
  <PageHeader title="Atelier & bespoke production" description="Manage bespoke orders from submission through quality control and delivery. Female Skate and male Trouser are supported by the production schema."/>
  {error&&<p className="text-sm text-destructive">{(error as Error).message}</p>}
  <DataTable loading={isLoading} rows={data??[]} columns={[
   {key:"serial_number",header:"Job",render:(r:any)=><div><div className="font-mono text-xs">{r.serial_number??r.id.slice(0,8)}</div><div className="text-xs text-muted-foreground">{r.id.slice(0,8)}</div></div>},
   {key:"garment_type",header:"Garment",render:(r:any)=><div className="capitalize font-medium">{String(r.garment_type).replaceAll("_"," ")}<div className="text-xs text-muted-foreground capitalize">{r.gender}</div></div>},
   {key:"occasion",header:"Occasion / fabric",render:(r:any)=><div>{r.occasion||"—"}<div className="text-xs text-muted-foreground">{[r.fabric,r.color].filter(Boolean).join(" · ")||"Fabric not specified"}</div></div>},
   {key:"user_id",header:"Customer",render:(r:any)=><span className="font-mono text-xs">{r.user_id?.slice(0,8)??"—"}</span>},
   {key:"status",header:"Production stage",render:(r:any)=><Select value={r.status} onValueChange={status=>update.mutate({id:r.id,status})}><SelectTrigger className="h-8 w-40 text-xs"><SelectValue/></SelectTrigger><SelectContent>{STATUSES.map(s=><SelectItem key={s} value={s}>{s.replaceAll("_"," ")}</SelectItem>)}</SelectContent></Select>},
   {key:"price_quote",header:"Quote",render:(r:any)=><div>{currency(r.price_quote)}<div className="text-xs text-muted-foreground">Deposit: {currency(r.deposit_paid)}</div></div>},
   {key:"estimated_delivery",header:"Due date",render:(r:any)=>r.estimated_delivery?new Date(r.estimated_delivery).toLocaleDateString():"Not set"},
   {key:"measurement_unit",header:"Measurements",render:(r:any)=><Badge variant="outline">{r.measurement_unit??"cm"}</Badge>},
  ]}/>
 </div>;
}
