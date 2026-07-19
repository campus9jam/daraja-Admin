import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCurrentUser, type AppRole } from "@/hooks/use-current-user";
import { toast } from "sonner";
import { X } from "lucide-react";
import { useState } from "react";

const ALL_ROLES: AppRole[] = ["super_admin","admin","moderator","support","tailor","logistics","designer","vendor","customer"];
const ACCOUNT_STATUSES = ["active","suspended","banned","pending_verification","deleted"] as const;

export function UserDrawer({ id, onClose }: { id: string | null; onClose: () => void }) {
  const qc = useQueryClient();
  const { data: me } = useCurrentUser();
  const [addRole, setAddRole] = useState<AppRole>("moderator");
  const [adjAmount, setAdjAmount] = useState("");
  const [adjTokens, setAdjTokens] = useState("");
  const [adjNote, setAdjNote] = useState("");

  const { data, isLoading, isError, error, refetch } = useQuery({
    enabled: !!id,
    queryKey: ["admin-user", id],
    queryFn: async () => {
      const [profile, roles, wallet, txs, orders, activity, apps] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", id!).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", id!),
        supabase.from("wallets").select("*").eq("user_id", id!).maybeSingle(),
        supabase.from("wallet_transactions").select("*").eq("user_id", id!).order("created_at",{ascending:false}).limit(30),
        supabase.from("orders").select("id, order_number, status, grand_total, currency, created_at").eq("user_id", id!).order("created_at",{ascending:false}).limit(20),
        supabase.from("user_activity_logs").select("*").eq("user_id", id!).order("created_at",{ascending:false}).limit(30),
        supabase.from("staff_applications").select("id, requested_role, status, created_at").eq("user_id", id!).order("created_at",{ascending:false}),
      ]);
      if (profile.error) throw profile.error;
      if (!profile.data) throw new Error("User not found");
      return {
        profile: profile.data,
        roles: (roles.data ?? []).map((r: any) => r.role as AppRole),
        wallet: wallet.data, txs: txs.data ?? [], orders: orders.data ?? [],
        activity: activity.data ?? [], applications: apps.data ?? [],
      };
    },
  });

  const grant = useMutation({
    mutationFn: async (role: AppRole) => {
      const { error } = await supabase.from("user_roles").insert({ user_id: id!, role });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-user", id] }); qc.invalidateQueries({ queryKey: ["admin-users"] }); toast.success("Role granted"); },
    onError: (e: any) => toast.error(e.message),
  });
  const revoke = useMutation({
    mutationFn: async (role: AppRole) => {
      const { error } = await supabase.from("user_roles").delete().eq("user_id", id!).eq("role", role);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-user", id] }); qc.invalidateQueries({ queryKey: ["admin-users"] }); toast.success("Role revoked"); },
    onError: (e: any) => toast.error(e.message),
  });

  const adjust = useMutation({
    mutationFn: async () => {
      const amt = Number(adjAmount || 0);
      const tok = Number(adjTokens || 0);
      if (!amt && !tok) throw new Error("Enter a KES amount or token amount.");
      const { error } = await supabase.rpc("admin_adjust_wallet", {
        _user_id: id!, _amount: amt, _token_amount: tok,
        _description: adjNote.trim() || null, _tx_type: "adjustment",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setAdjAmount(""); setAdjTokens(""); setAdjNote("");
      qc.invalidateQueries({ queryKey: ["admin-user", id] });
      toast.success("Wallet adjusted");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const setStatus = useMutation({
    mutationFn: async (status: string) => {
      const { error } = await supabase.rpc("admin_set_account_status", { _user_id: id!, _status: status, _reason: null });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-user", id] }); toast.success("Status updated"); },
    onError: (e: any) => toast.error(e.message),
  });

  const p = data?.profile;
  const canManage = me?.isAdmin;

  return (
    <Sheet open={!!id} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{p?.display_name || p?.username || p?.email || "User"}</SheetTitle>
          <SheetDescription>{p ? `${p.email} · joined ${new Date(p.created_at).toLocaleDateString()}` : "Loading…"}</SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="py-8 text-sm text-muted-foreground">Loading user…</div>
        ) : isError ? (
          <div className="py-8 space-y-3">
            <div className="text-sm text-destructive">Failed to load: {(error as any)?.message}</div>
            <Button size="sm" variant="outline" onClick={() => refetch()}>Retry</Button>
          </div>
        ) : !p ? (
          <div className="py-8 text-sm text-muted-foreground">User not found.</div>
        ) : (
          <Tabs defaultValue="profile" className="mt-4">
            <TabsList>
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="roles">Roles</TabsTrigger>
              <TabsTrigger value="wallet">Wallet</TabsTrigger>
              <TabsTrigger value="orders">Orders</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-4 mt-4">
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <dt className="text-muted-foreground">Username</dt><dd>{p.username ?? "—"}</dd>
                <dt className="text-muted-foreground">Phone</dt><dd>{p.phone ?? "—"}</dd>
                <dt className="text-muted-foreground">Country</dt><dd>{p.country ?? "—"}</dd>
                <dt className="text-muted-foreground">City</dt><dd>{p.city ?? "—"}</dd>
                <dt className="text-muted-foreground">Email verified</dt><dd>{p.email_verified ? "Yes" : "No"}</dd>
                <dt className="text-muted-foreground">Status</dt>
                <dd>
                  {canManage ? (
                    <Select value={p.account_status ?? "active"} onValueChange={(v) => setStatus.mutate(v)}>
                      <SelectTrigger className="h-7 w-44 text-xs capitalize"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ACCOUNT_STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s.replace("_"," ")}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ) : <Badge variant="outline" className="capitalize">{p.account_status ?? "active"}</Badge>}
                </dd>
              </dl>
              {p.bio && <p className="text-sm text-muted-foreground border-t border-border/60 pt-3">{p.bio}</p>}
              {(data?.applications ?? []).length > 0 && (
                <div>
                  <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Staff applications</h4>
                  <div className="space-y-1">
                    {data!.applications.map((a: any) => (
                      <div key={a.id} className="flex items-center justify-between text-xs border border-border/60 rounded p-2">
                        <span className="capitalize">{a.requested_role}</span>
                        <Badge variant="outline" className="capitalize">{a.status}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="roles" className="space-y-3 mt-4">
              <div className="flex flex-wrap gap-2">
                {data!.roles.length === 0 && <span className="text-xs text-muted-foreground">No roles.</span>}
                {data!.roles.map((r) => (
                  <Badge key={r} variant="secondary" className="gap-1">
                    {r}
                    {canManage && (
                      <button className="hover:text-destructive" onClick={() => revoke.mutate(r)}>
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </Badge>
                ))}
              </div>
              {canManage && (
                <div className="flex gap-2">
                  <Select value={addRole} onValueChange={(v) => setAddRole(v as AppRole)}>
                    <SelectTrigger className="h-9 flex-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ALL_ROLES.filter((r) => !data!.roles.includes(r)).map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button onClick={() => grant.mutate(addRole)} disabled={grant.isPending}>Grant</Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="wallet" className="space-y-4 mt-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="border border-border/60 rounded p-3"><div className="text-[10px] uppercase text-muted-foreground">Balance</div><div className="font-mono text-lg">{(data!.wallet?.currency ?? "KES")} {Number(data!.wallet?.balance ?? 0).toLocaleString()}</div></div>
                <div className="border border-border/60 rounded p-3"><div className="text-[10px] uppercase text-muted-foreground">Lee tokens</div><div className="font-mono text-lg">{Number(data!.wallet?.lee_tokens ?? 0).toLocaleString()}</div></div>
                <div className="border border-border/60 rounded p-3"><div className="text-[10px] uppercase text-muted-foreground">Locked</div><div className="font-mono text-lg">{data!.wallet?.is_locked ? "Yes" : "No"}</div></div>
              </div>
              {canManage && (
                <div className="border border-border/60 rounded p-3 space-y-2">
                  <div className="text-xs font-medium">Adjust wallet</div>
                  <div className="grid grid-cols-3 gap-2">
                    <div><Label className="text-xs">KES ±</Label><Input type="number" step="0.01" value={adjAmount} onChange={(e) => setAdjAmount(e.target.value)} /></div>
                    <div><Label className="text-xs">Tokens ±</Label><Input type="number" step="1" value={adjTokens} onChange={(e) => setAdjTokens(e.target.value)} /></div>
                    <div><Label className="text-xs">Note</Label><Input value={adjNote} onChange={(e) => setAdjNote(e.target.value)} /></div>
                  </div>
                  <Button size="sm" disabled={adjust.isPending} onClick={() => adjust.mutate()}>{adjust.isPending ? "Applying…" : "Apply adjustment"}</Button>
                </div>
              )}
              <div className="border border-border/60 rounded divide-y divide-border/60">
                {data!.txs.length === 0 && <div className="p-3 text-xs text-muted-foreground">No transactions.</div>}
                {data!.txs.map((t: any) => (
                  <div key={t.id} className="p-2 flex justify-between text-xs">
                    <div><div className="capitalize">{t.tx_type}</div><div className="text-muted-foreground">{new Date(t.created_at).toLocaleString()}</div></div>
                    <div className={"font-mono " + (Number(t.amount)<0 ? "text-red-400" : "text-emerald-400")}>{Number(t.amount).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="orders" className="mt-4">
              <div className="border border-border/60 rounded divide-y divide-border/60">
                {data!.orders.length === 0 && <div className="p-3 text-xs text-muted-foreground">No orders.</div>}
                {data!.orders.map((o: any) => (
                  <div key={o.id} className="p-2 flex justify-between text-xs">
                    <div className="font-mono">{o.order_number ?? o.id.slice(0,8)}</div>
                    <div className="capitalize text-muted-foreground">{o.status}</div>
                    <div className="font-mono">{o.currency} {Number(o.grand_total ?? 0).toLocaleString()}</div>
                    <div className="text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="activity" className="mt-4">
              <div className="border border-border/60 rounded divide-y divide-border/60">
                {data!.activity.length === 0 && <div className="p-3 text-xs text-muted-foreground">No activity.</div>}
                {data!.activity.map((a: any) => (
                  <div key={a.id} className="p-2 text-xs flex justify-between">
                    <span>{a.activity}</span>
                    <span className="text-muted-foreground">{new Date(a.created_at).toLocaleString()}</span>
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