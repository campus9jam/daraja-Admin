import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/admin/page-header";
import { DataTable } from "@/components/admin/data-table";
import { StatusSelect } from "@/components/admin/status-select";

const AUCTION_STATUSES = ["scheduled","live","ended","cancelled","sold","unsold"] as const;
const KEY = ["admin-auctions"];

export const Route = createFileRoute("/_authenticated/admin/auctions")({ component: AuctionsPage });

function AuctionsPage() {
  const { data, isLoading } = useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("auctions")
        .select("id, status, starting_price, current_bid, reserve_price, total_bids, starts_at, ends_at, product_id")
        .order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return data;
    },
  });
  return (
    <div>
      <PageHeader title="Auctions" description="Live and scheduled auctions, watchers, and winners." />
      <DataTable
        loading={isLoading}
        rows={data ?? []}
        columns={[
          { key: "id", header: "Auction", render: (r: any) => <span className="font-mono text-xs">{r.id.slice(0,8)}</span> },
          { key: "product_id", header: "Product", render: (r: any) => <span className="font-mono text-xs">{(r.product_id ?? "—").slice(0,8)}</span> },
          { key: "status", header: "Status", render: (r: any) => <StatusSelect table="auctions" id={r.id} value={r.status} options={AUCTION_STATUSES} queryKey={KEY} /> },
          { key: "starting_price", header: "Start", render: (r: any) => `KES ${Number(r.starting_price ?? 0).toLocaleString()}` },
          { key: "current_bid", header: "Current", render: (r: any) => `KES ${Number(r.current_bid ?? 0).toLocaleString()}` },
          { key: "total_bids", header: "Bids", render: (r: any) => r.total_bids ?? 0 },
          { key: "ends_at", header: "Ends", render: (r: any) => r.ends_at ? new Date(r.ends_at).toLocaleString() : "—" },
        ]}
      />
    </div>
  );
}