import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export function AuctionDrawer({ id, onClose }: { id: string | null; onClose: () => void }) {
  const qc = useQueryClient();
  const open = !!id;

  const { data: auction, isLoading, error, refetch } = useQuery({
    queryKey: ["auction", id],
    enabled: open,
    queryFn: async () => {
      const { data, error } = await supabase.from("auctions").select("*").eq("id", id!).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: bids } = useQuery({
    queryKey: ["auction-bids", id],
    enabled: open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bids").select("id, amount, bidder_id, created_at")
        .eq("auction_id", id!).order("amount", { ascending: false }).limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

  useEffect(() => {
    if (!open) return;
    const ch = supabase.channel(`auction-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "bids", filter: `auction_id=eq.${id}` }, () => {
        qc.invalidateQueries({ queryKey: ["auction-bids", id] });
        qc.invalidateQueries({ queryKey: ["auction", id] });
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "auctions", filter: `id=eq.${id}` }, () => refetch())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id, open, qc, refetch]);

  const close = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("close_auction", { _auction_id: id! });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success("Auction closed");
      qc.invalidateQueries({ queryKey: ["admin-auctions"] });
      refetch();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const setStatus = useMutation({
    mutationFn: async (status: string) => {
      const patch: any = { status, updated_at: new Date().toISOString() };
      if (status === "live" && !auction?.starts_at) patch.starts_at = new Date().toISOString();
      const { error } = await supabase.from("auctions").update(patch).eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Status updated"); refetch(); qc.invalidateQueries({ queryKey: ["admin-auctions"] }); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader><SheetTitle>Auction</SheetTitle></SheetHeader>
        {isLoading && <div className="mt-6 text-sm text-muted-foreground">Loading…</div>}
        {error && <div className="mt-6 text-sm text-destructive">Failed to load: {(error as any).message} <Button size="sm" variant="ghost" onClick={() => refetch()}>Retry</Button></div>}
        {auction && (
          <div className="mt-6 space-y-6 text-sm">
            <div className="flex items-center justify-between">
              <div className="font-mono text-xs text-muted-foreground">{auction.id.slice(0, 8)}</div>
              <Badge variant="secondary" className="capitalize">{auction.status}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Metric label="Starting" value={`KES ${Number(auction.starting_price ?? 0).toLocaleString()}`} />
              <Metric label="Current bid" value={`KES ${Number(auction.current_bid ?? 0).toLocaleString()}`} />
              <Metric label="Reserve" value={auction.reserve_price ? `KES ${Number(auction.reserve_price).toLocaleString()}` : "—"} />
              <Metric label="Total bids" value={String(auction.total_bids ?? 0)} />
              <Metric label="Starts" value={auction.starts_at ? new Date(auction.starts_at).toLocaleString() : "—"} />
              <Metric label="Ends" value={auction.ends_at ? new Date(auction.ends_at).toLocaleString() : "—"} />
            </div>

            <div className="flex flex-wrap gap-2">
              {auction.status === "scheduled" && <Button size="sm" onClick={() => setStatus.mutate("live")} disabled={setStatus.isPending}>Go live</Button>}
              {auction.status === "live" && <Button size="sm" onClick={() => close.mutate()} disabled={close.isPending}>Close & settle</Button>}
              {(auction.status === "scheduled" || auction.status === "live") && (
                <Button size="sm" variant="outline" onClick={() => setStatus.mutate("cancelled")} disabled={setStatus.isPending}>Cancel</Button>
              )}
            </div>

            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Bid feed (live)</div>
              <div className="rounded-md border border-border/60 divide-y divide-border/60 max-h-80 overflow-y-auto">
                {(bids ?? []).length === 0 && <div className="p-3 text-xs text-muted-foreground">No bids yet.</div>}
                {(bids ?? []).map((b: any) => (
                  <div key={b.id} className="p-2 flex items-center justify-between text-xs">
                    <span className="font-mono opacity-70">{b.bidder_id?.slice(0, 8)}</span>
                    <span className="font-medium">KES {Number(b.amount).toLocaleString()}</span>
                    <span className="text-muted-foreground">{new Date(b.created_at).toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border/60 p-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}