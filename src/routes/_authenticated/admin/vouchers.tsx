import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Copy, Plus, TicketCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/admin/page-header";
import { DataTable } from "@/components/admin/data-table";
import { StatCard } from "@/components/admin/stat-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/admin/vouchers")({ component: VouchersPage });
const KEY = ["admin-lee-vouchers"];

function randomCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  const body = Array.from(bytes, b => alphabet[b % alphabet.length]).join("");
  return `HD-${body.slice(0,4)}-${body.slice(4,8)}-${body.slice(8,12)}-${body.slice(12)}`;
}
async function sha256(code: string) {
  const bytes = new TextEncoder().encode(code.trim().toUpperCase());
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), b => b.toString(16).padStart(2,"0")).join("");
}

function VouchersPage() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("100");
  const [quantity, setQuantity] = useState("1");
  const [expiry, setExpiry] = useState("");
  const [issuedCodes, setIssuedCodes] = useState<string[]>([]);

  const { data, isLoading, error } = useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const [campaigns, vouchers, redemptions] = await Promise.all([
        (supabase as any).from("lee_voucher_campaigns").select("*").order("created_at",{ascending:false}).limit(100),
        (supabase as any).from("lee_vouchers").select("id,campaign_id,code_hint,lee_amount,status,max_redemptions,redemption_count,starts_at,expires_at,created_at").order("created_at",{ascending:false}).limit(200),
        (supabase as any).from("lee_voucher_redemptions").select("id",{count:"exact",head:true}),
      ]);
      for (const result of [campaigns,vouchers,redemptions]) if (result.error) throw result.error;
      return { campaigns: campaigns.data ?? [], vouchers: vouchers.data ?? [], redemptionCount: redemptions.count ?? 0 };
    },
  });

  const createCampaign = useMutation({
    mutationFn: async () => {
      const n = name.trim();
      const lee = Number(amount);
      const qty = Number(quantity);
      if (n.length < 2) throw new Error("Campaign name must have at least 2 characters.");
      if (!Number.isInteger(lee) || lee < 1 || lee > 1000000) throw new Error("LEE amount must be a whole number from 1 to 1,000,000.");
      if (!Number.isInteger(qty) || qty < 1 || qty > 500) throw new Error("Quantity must be between 1 and 500 vouchers.");
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("Please sign in again.");
      const { data: campaign, error: campaignError } = await (supabase as any).from("lee_voucher_campaigns").insert({
        name:n, description:description.trim() || null, status:"active", starts_at:new Date().toISOString(),
        expires_at: expiry ? new Date(expiry).toISOString() : null, created_by:user.id,
      }).select("id").single();
      if (campaignError) throw campaignError;
      const codes = Array.from({length:qty}, randomCode);
      const rows = await Promise.all(codes.map(async code => ({
        campaign_id:campaign.id, code_hash:await sha256(code), code_hint:code.slice(-4),
        lee_amount:lee, status:"active", max_redemptions:1, redemption_count:0,
        starts_at:new Date().toISOString(), expires_at:expiry ? new Date(expiry).toISOString() : null,
        created_by:user.id,
      })));
      const { error: voucherError } = await (supabase as any).from("lee_vouchers").insert(rows);
      if (voucherError) {
        await (supabase as any).from("lee_voucher_campaigns").update({status:"cancelled"}).eq("id",campaign.id);
        throw voucherError;
      }
      return codes;
    },
    onSuccess: codes => {
      setIssuedCodes(codes);
      setName(""); setDescription(""); setAmount("100"); setQuantity("1"); setExpiry("");
      qc.invalidateQueries({queryKey:KEY});
      toast.success(`Created ${codes.length} voucher${codes.length===1?"":"s"}.`);
    },
    onError: (e:any) => toast.error(e.message || "Could not create voucher campaign."),
  });

  const setVoucherStatus = useMutation({
    mutationFn: async ({id,status}:{id:string;status:"active"|"paused"|"revoked"}) => {
      const {error} = await (supabase as any).from("lee_vouchers").update({status}).eq("id",id);
      if(error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({queryKey:KEY}),
    onError: (e:any) => toast.error(e.message),
  });

  const campaigns = data?.campaigns ?? [];
  const vouchers = data?.vouchers ?? [];
  return <div className="space-y-6">
    <PageHeader title="LEE Vouchers" description="Create secure voucher campaigns, issue codes, pause compromised vouchers, and monitor redemption." />
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <StatCard icon={TicketCheck} label="Campaigns" value={campaigns.length} />
      <StatCard icon={TicketCheck} label="Issued vouchers" value={vouchers.length} />
      <StatCard icon={TicketCheck} label="Redemptions" value={data?.redemptionCount ?? 0} />
    </div>

    <Card>
      <CardHeader><CardTitle className="text-base">Create a voucher campaign</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2"><Label>Campaign name</Label><Input value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. In-store launch rewards" maxLength={120}/></div>
          <div className="space-y-2"><Label>Description (optional)</Label><Input value={description} onChange={e=>setDescription(e.target.value)} placeholder="Campaign purpose" maxLength={500}/></div>
          <div className="space-y-2"><Label>LEE per voucher</Label><Input type="number" min="1" max="1000000" step="1" value={amount} onChange={e=>setAmount(e.target.value)}/></div>
          <div className="space-y-2"><Label>Number of unique vouchers (max 500)</Label><Input type="number" min="1" max="500" step="1" value={quantity} onChange={e=>setQuantity(e.target.value)}/></div>
          <div className="space-y-2"><Label>Expiry (optional)</Label><Input type="datetime-local" value={expiry} onChange={e=>setExpiry(e.target.value)}/></div>
        </div>
        <Button onClick={()=>createCampaign.mutate()} disabled={createCampaign.isPending || name.trim().length<2}><Plus className="h-4 w-4 mr-2"/>{createCampaign.isPending?"Creating secure codes…":"Create campaign and codes"}</Button>
        {issuedCodes.length>0 && <div className="rounded-lg border p-4 space-y-3">
          <div><p className="font-medium">Save these voucher codes now</p><p className="text-sm text-muted-foreground">For security, only the hash is stored. These full codes will not be shown again after leaving this page.</p></div>
          <div className="space-y-2">{issuedCodes.map(code=><div key={code} className="flex items-center justify-between gap-2 rounded bg-muted p-2"><code className="text-sm break-all">{code}</code><Button size="sm" variant="outline" onClick={()=>{void navigator.clipboard.writeText(code);toast.success("Code copied");}}><Copy className="h-3 w-3 mr-1"/>Copy</Button></div>)}</div>
          <Button variant="outline" onClick={()=>{void navigator.clipboard.writeText(issuedCodes.join("\n"));toast.success("All codes copied");}}>Copy all codes</Button>
        </div>}
      </CardContent>
    </Card>

    <Card><CardHeader><CardTitle className="text-base">Campaigns</CardTitle></CardHeader><CardContent>
      {campaigns.length===0?<p className="text-sm text-muted-foreground">No campaigns yet.</p>:<div className="space-y-2">{campaigns.map((c:any)=><div key={c.id} className="flex flex-wrap items-center justify-between gap-3 border-b last:border-0 py-3"><div><p className="font-medium">{c.name}</p><p className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleString()} · {vouchers.filter((v:any)=>v.campaign_id===c.id).length} vouchers</p></div><Badge variant="outline">{c.status}</Badge></div>)}</div>}
    </CardContent></Card>

    <div className="space-y-2"><h2 className="text-sm font-semibold">Voucher inventory</h2>{error&&<p className="text-sm text-destructive">{(error as Error).message}</p>}
      <DataTable loading={isLoading} rows={vouchers} columns={[
        {key:"code_hint",header:"Code ending",render:(r:any)=><span className="font-mono">•••• {r.code_hint}</span>},
        {key:"campaign_id",header:"Campaign",render:(r:any)=>campaigns.find((c:any)=>c.id===r.campaign_id)?.name ?? r.campaign_id.slice(0,8)},
        {key:"lee_amount",header:"LEE value",render:(r:any)=>Number(r.lee_amount).toLocaleString()},
        {key:"redemption_count",header:"Used",render:(r:any)=>`${r.redemption_count}/${r.max_redemptions}`},
        {key:"expires_at",header:"Expiry",render:(r:any)=>r.expires_at?new Date(r.expires_at).toLocaleString():"No expiry"},
        {key:"status",header:"Status",render:(r:any)=><Badge variant={r.status==="active"?"default":"secondary"}>{r.status}</Badge>},
        {key:"actions",header:"Actions",render:(r:any)=>r.status==="active"?<Button size="sm" variant="outline" onClick={()=>setVoucherStatus.mutate({id:r.id,status:"paused"})}>Pause</Button>:r.status==="paused"?<Button size="sm" variant="outline" onClick={()=>setVoucherStatus.mutate({id:r.id,status:"active"})}>Resume</Button>:null},
      ]}/>
    </div>
  </div>;
}
