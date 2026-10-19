import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/admin/page-header";
import { DataTable } from "@/components/admin/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/admin/vendors")({component:VendorsPage});
const KEY=["hd-vendor-applications"];
function VendorsPage(){
 const qc=useQueryClient();
 const [notes,setNotes]=useState<Record<string,string>>({});
 const {data,isLoading,error}=useQuery({queryKey:KEY,queryFn:async()=>{
  const {data,error}=await supabase.from("vendor_applications").select("id,user_id,business_name,slug,bio,specialization,location,phone,website,social_links,portfolio_urls,status,review_notes,created_at,updated_at").order("created_at",{ascending:false}).limit(200);
  if(error) throw error; return data??[];
 }});
 const moderate=useMutation({mutationFn:async({id,action}:{id:string;action:"approve"|"reject"})=>{
  const {data,error}=await supabase.rpc("moderate_vendor_application",{p_application_id:id,p_action:action,p_note:notes[id]?.trim()||null});
  if(error) throw error; return data;
 },onSuccess:(_data,vars)=>{toast.success(vars.action==="approve"?"Vendor approved and store activated":"Application rejected");qc.invalidateQueries({queryKey:KEY});qc.invalidateQueries({queryKey:["hd-count","vendor_applications","id"]});},onError:(e:any)=>toast.error(e.message||"Could not review application.")});
 return <div className="space-y-5">
  <PageHeader title="Vendor approvals" description="Review applications and approve legitimate sellers into the production marketplace. Approval is handled by the protected Supabase moderation function."/>
  {error&&<p className="text-sm text-destructive">{(error as Error).message}</p>}
  <DataTable loading={isLoading} rows={data??[]} columns={[
   {key:"business_name",header:"Business",render:(r:any)=><div><div className="font-medium">{r.business_name}</div><div className="text-xs text-muted-foreground">{r.slug}</div></div>},
   {key:"user_id",header:"Applicant",render:(r:any)=><span className="font-mono text-xs">{r.user_id.slice(0,8)}</span>},
   {key:"specialization",header:"Speciality",render:(r:any)=>Array.isArray(r.specialization)?r.specialization.join(", "):"—"},
   {key:"location",header:"Location",render:(r:any)=>r.location||"—"},
   {key:"created_at",header:"Applied",render:(r:any)=>new Date(r.created_at).toLocaleDateString()},
   {key:"status",header:"Status",render:(r:any)=><Badge variant={r.status==="approved"?"default":r.status==="rejected"?"destructive":"secondary"}>{r.status}</Badge>},
   {key:"review",header:"Review / decision",render:(r:any)=><div className="min-w-56 space-y-2"><Input value={notes[r.id]??r.review_notes??""} onChange={e=>setNotes(p=>({...p,[r.id]:e.target.value}))} placeholder="Optional review note" className="h-8 text-xs"/>{r.status==="pending"||r.status==="approved"?<div className="flex gap-2"><Button size="sm" disabled={moderate.isPending} onClick={()=>moderate.mutate({id:r.id,action:"approve"})}>Approve</Button><Button size="sm" variant="outline" disabled={moderate.isPending} onClick={()=>moderate.mutate({id:r.id,action:"reject"})}>Reject</Button></div>:<span className="text-xs text-muted-foreground">Reviewed</span>}</div>},
  ]}/>
 </div>;
}
