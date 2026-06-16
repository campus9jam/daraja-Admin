import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/admin/page-header";
import { DataTable } from "@/components/admin/data-table";
import { StatCard } from "@/components/admin/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Coins, Wallet, Trophy } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/rewards")({ component: RewardsPage });

function RewardsPage() {
  const { data: txs, isLoading } = useQuery({
    queryKey: ["admin-wallet-tx"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wallet_transactions")
        .select("id, user_id, tx_type, amount, token_amount, balance_after, description, reference, created_at")
        .order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return data;
    },
  });

  const { data: totals } = useQuery({
    queryKey: ["admin-wallet-totals"],
    queryFn: async () => {
      const [w, lv, re] = await Promise.all([
        supabase.from("wallets").select("balance, lee_tokens"),
        supabase.from("loyalty_levels").select("id, name, min_points, perks").order("min_points"),
        supabase.from("reward_events").select("id", { count: "exact", head: true }),
      ]);
      const balance = (w.data ?? []).reduce((s, r: any) => s + Number(r.balance ?? 0), 0);
      const tokens = (w.data ?? []).reduce((s, r: any) => s + Number(r.lee_tokens ?? 0), 0);
      return { balance, tokens, wallets: w.data?.length ?? 0, levels: lv.data ?? [], events: re.count ?? 0 };
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader title="Rewards & Tokens" description="Wallets, Lee tokens, loyalty tiers, and reward events." />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Wallet} label="Active wallets" value={totals?.wallets ?? 0} />
        <StatCard icon={Coins} label="Total balance" value={`KES ${(totals?.balance ?? 0).toLocaleString()}`} />
        <StatCard icon={Coins} label="Lee tokens in circulation" value={(totals?.tokens ?? 0).toLocaleString()} />
        <StatCard icon={Trophy} label="Reward events" value={(totals?.events ?? 0).toLocaleString()} />
      </div>

      <Card className="border-border/60">
        <CardHeader><CardTitle className="text-sm font-medium tracking-wide uppercase text-muted-foreground">Loyalty tiers</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {(totals?.levels ?? []).length === 0 ? (
            <span className="text-sm text-muted-foreground">No tiers configured.</span>
          ) : totals!.levels.map((l: any) => (
            <Badge key={l.id} variant="outline" className="px-3 py-1">
              <span className="font-medium">{l.name}</span>
              <span className="ml-2 text-muted-foreground">≥ {l.min_points} pts</span>
            </Badge>
          ))}
        </CardContent>
      </Card>

      <div>
        <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Recent transactions</h3>
        <DataTable
          loading={isLoading}
          rows={txs ?? []}
          columns={[
            { key: "created_at", header: "When", render: (r: any) => <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</span> },
            { key: "user_id", header: "User", render: (r: any) => <span className="font-mono text-xs">{(r.user_id ?? "").slice(0, 8)}</span> },
            { key: "tx_type", header: "Type", render: (r: any) => <Badge variant="outline" className="capitalize">{r.tx_type}</Badge> },
            { key: "amount", header: "Amount (KES)", render: (r: any) => <span className={Number(r.amount) < 0 ? "text-red-400" : "text-emerald-400"}>{Number(r.amount ?? 0).toLocaleString()}</span> },
            { key: "token_amount", header: "Tokens", render: (r: any) => Number(r.token_amount ?? 0).toLocaleString() },
            { key: "balance_after", header: "Balance", render: (r: any) => r.balance_after != null ? Number(r.balance_after).toLocaleString() : "—" },
            { key: "description", header: "Note", render: (r: any) => <span className="text-xs text-muted-foreground line-clamp-1 max-w-[240px]">{r.description ?? r.reference ?? "—"}</span> },
          ]}
        />
      </div>
    </div>
  );
}