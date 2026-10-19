import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/admin/page-header";
import { DataTable } from "@/components/admin/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card,CardContent,CardHeader,CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export const Route=createFileRoute("/_authenticated/admin/auctions")({component:AuctionsPage});
const KEY=["hd-auctions"];
function AuctionsPage(){
 const qc=useQueryClient();
 const [title,setTitle]=useState("");
 const [description,setDescription]=useState("");
 const [category,setCategory]=useState("Heritage");
 const [startingBid,setStartingBid]=useState("1000");
 const [reserve,setReserve]=useState("");
 const [startTime,setStartTime]=useState("");
 const [endTime,setEndTime]=useState("");
 const [imageUrl,setImageUrl]=useState("");
 const {data,isLoading,error}=useQuery({queryKey:KEY,queryFn:async()=>{
  const {data,error}=await supabase.from("auctions").select("id,title,description,seller_id,image_url,starting_bid,current_bid,bid_count,reserve_price,status,start_time,end_time,category,winner_id,final_price,created_at").order("created_at",{ascending:false}).limit(200);
  if(error) throw error; return data??[];
 }});
 const create=useMutation({mutationFn:async()=>{
  const {data:{user},error:authError}=await supabase.auth.getUser();
  if(authError||!user) throw new Error("Please sign in again.");
  const start=new Date(startTime),end=new Date(endTime),bid=Number(startingBid),res=reserve===""?null:Number(reserve);
  if(title.trim().length<3) throw new Error("Auction title must have at least 3 characters.");
  if(!startTime||!endTime||Number.isNaN(start.getTime())||Number.isNaN(end.getTime())||end<=start) throw new Error("Choose a valid start and end time.");
  if(!Number.isFinite(bid)||bid<=0|| (res!==null&&(!Number.isFinite(res)||res<bid))) throw new Error("Starting bid must be positive; reserve must be at least the starting bid.");
  const {error}=await supabase.from("auctions").insert({title:title.trim(),description:description.trim()||null,category:category.trim()||"General",starting_bid:bid,current_bid:bid,bid_count:0,reserve_price:res,status:"scheduled",start_time:start.toISOString(),end_time:end.toISOString(),seller_id:user.id,image_url:imageUrl.trim()||null});
  if(error) throw error;
 },onSuccess:()=>{toast.success("Auction scheduled");setTitle("");setDescription("");setReserve("");setImageUrl("");qc.invalidateQueries({queryKey:KEY});},onError:(e:any)=>toast.error(e.message||"Could not create auction.")});
 const update=useMutation({mutationFn:async({id,status}:{id:string;status:string})=>{
  const {error}=await supabase.from("auctions").update({status}).eq("id",id);if(error)throw error;
 },onSuccess:()=>qc.invalidateQueries({queryKey:KEY}),onError:(e:any)=>toast.error(e.message)});
 const currency=(n:any)=>`₦${Number(n??0).toLocaleString("en-NG")}`;
 return <div className="space-y-6">
  <PageHeader title="Auction control" description="Schedule heritage and fashion auctions, monitor bids, and control listing status against the production auction table."/>
  <Card><CardHeader><CardTitle className="text-base">Schedule an auction</CardTitle></CardHeader><CardContent className="space-y-4">
   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div className="space-y-2"><Label>Title</Label><Input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Auction title"/></div>
    <div className="space-y-2"><Label>Category</Label><Input value={category} onChange={e=>setCategory(e.target.value)} placeholder="Heritage, couture…"/></div>
    <div className="space-y-2"><Label>Description</Label><Input value={description} onChange={e=>setDescription(e.target.value)} placeholder="Item provenance and condition"/></div>
    <div className="space-y-2"><Label>Image URL (optional)</Label><Input value={imageUrl} onChange={e=>setImageUrl(e.target.value)} placeholder="https://…"/></div>
    <div className="space-y-2"><Label>Starting bid (NGN)</Label><Input type="number" min="1" value={startingBid} onChange={e=>setStartingBid(e.target.value)}/></div>
    <div className="space-y-2"><Label>Reserve price (optional)</Label><Input type="number" min="1" value={reserve} onChange={e=>setReserve(e.target.value)}/></div>
    <div className="space-y-2"><Label>Starts</Label><Input type="datetime-local" value={startTime} onChange={e=>setStartTime(e.target.value)}/></div>
    <div className="space-y-2"><Label>Ends</Label><Input type="datetime-local" value={endTime} onChange={e=>setEndTime(e.target.value)}/></div>
   </div>
   <p className="text-xs text-muted-foreground">The authenticated admin is recorded as the listing seller. If your auction policy requires a vendor-owned item, create it under that vendor identity through the approved backend workflow instead.</p>
   <Button onClick={()=>create.mutate()} disabled={create.isPending||title.trim().length<3}>{create.isPending?"Scheduling…":"Schedule auction"}</Button>
  </CardContent></Card>
  {error&&<p className="text-sm text-destructive">{(error as Error).message}</p>}
  <DataTable loading={isLoading} rows={data??[]} columns={[
   {key:"title",header:"Auction",render:(r:any)=><div><div className="font-medium">{r.title}</div><div className="text-xs text-muted-foreground">{r.category||"General"} · {r.id.slice(0,8)}</div></div>},
   {key:"status",header:"Status",render:(r:any)=><Badge variant={r.status==="live"?"default":"secondary"}>{r.status}</Badge>},
   {key:"starting_bid",header:"Starting",render:(r:any)=>currency(r.starting_bid)},
   {key:"current_bid",header:"Current bid",render:(r:any)=>currency(r.current_bid)},
   {key:"bid_count",header:"Bids",render:(r:any)=>r.bid_count??0},
   {key:"start_time",header:"Starts",render:(r:any)=>new Date(r.start_time).toLocaleString()},
   {key:"end_time",header:"Ends",render:(r:any)=>new Date(r.end_time).toLocaleString()},
   {key:"actions",header:"Control",render:(r:any)=>r.status==="cancelled"||r.status==="ended"?<span className="text-xs text-muted-foreground">Closed</span>:<div className="flex gap-1">{r.status!=="live"&&<Button size="sm" variant="outline" onClick={()=>update.mutate({id:r.id,status:"live"})}>Go live</Button>}<Button size="sm" variant="outline" onClick={()=>update.mutate({id:r.id,status:"cancelled"})}>Cancel</Button></div>},
  ]}/>
 </div>;
}
