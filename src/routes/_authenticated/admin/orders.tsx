import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/admin/page-header";
import { DataTable } from "@/components/admin/data-table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCurrentUser } from "@/hooks/use-current-user";
import { toast } from "sonner";

const ORDER_STATUSES = ["pending","confirmed","processing","shipped","delivered","cancelled","refunded","disputed"] as const;
type OrderStatus = typeof ORDER_STATUSES[number];

export const Route = createFileRoute("/_authenticated/admin/orders")({ component: OrdersPage });

function OrdersPage() {
  const { data: me } = useCurrentUser();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, order_number, status, payment_status, grand_total, currency, created_at")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrderStatus }) => {
      const { error } = await supabase.from("orders").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-orders"] }); toast.success("Order updated"); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div>
      <PageHeader title="Orders" description="All marketplace orders & payments." />
      <DataTable
        loading={isLoading}
        rows={data ?? []}
        columns={[
          { key: "order_number", header: "Order", render: (r: any) => <span className="font-mono text-xs">{r.order_number ?? r.id.slice(0,8)}</span> },
          { key: "status", header: "Status", render: (r: any) => me?.isStaff ? (
              <Select value={r.status} onValueChange={(v) => updateStatus.mutate({ id: r.id, status: v as OrderStatus })}>
                <SelectTrigger className="h-7 w-36 text-xs capitalize"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ORDER_STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                </SelectContent>
              </Select>
            ) : <Badge variant="secondary" className="capitalize">{r.status}</Badge>
          },
          { key: "payment_status", header: "Payment", render: (r: any) => <Badge variant="outline" className="capitalize">{r.payment_status ?? "—"}</Badge> },
          { key: "grand_total", header: "Total", render: (r: any) => `${r.currency ?? "KES"} ${Number(r.grand_total ?? 0).toLocaleString()}` },
          { key: "created_at", header: "Date", render: (r: any) => new Date(r.created_at).toLocaleDateString() },
        ]}
      />
    </div>
  );
}