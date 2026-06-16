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
        .select("*")
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
          { key: "title", header: "Title", render: (r: any) => <span className="font-medium">{r.title ?? r.id.slice(0,8)}</span> },
          { key: "status", header: "Status", render: (r: any) => <StatusSelect table="auctions" id={r.id} value={r.status} options={AUCTION_STATUSES} queryKey={KEY} /> },
          { key: "starting_price", header: "Start", render: (r: any) => `${r.currency ?? "KES"} ${Number(r.starting_price ?? r.start_price ?? 0).toLocaleString()}` },
          { key: "current_bid", header: "Current", render: (r: any) => `${r.currency ?? "KES"} ${Number(r.current_bid ?? r.highest_bid ?? 0).toLocaleString()}` },
          { key: "end_time", header: "Ends", render: (r: any) => r.end_time ? new Date(r.end_time).toLocaleString() : (r.ends_at ? new Date(r.ends_at).toLocaleString() : "—") },
        ]}
      />
    </div>
  );
}