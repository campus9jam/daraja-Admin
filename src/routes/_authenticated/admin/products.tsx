import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/admin/page-header";
import { DataTable } from "@/components/admin/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/products")({ component: ProductsPage });

function ProductsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, sku, price, currency, status, stock_quantity, created_at")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  return (
    <div>
      <PageHeader
        title="Products"
        description="Marketplace catalog management."
        actions={<Button size="sm"><Plus className="h-4 w-4" /> New product</Button>}
      />
      <DataTable
        loading={isLoading}
        rows={data ?? []}
        columns={[
          { key: "name", header: "Name" },
          { key: "sku", header: "SKU", render: (r: any) => <span className="font-mono text-xs">{r.sku ?? "—"}</span> },
          { key: "price", header: "Price", render: (r: any) => `${r.currency ?? "KES"} ${Number(r.price ?? 0).toLocaleString()}` },
          { key: "stock_quantity", header: "Stock" },
          { key: "status", header: "Status", render: (r: any) => <Badge variant="secondary" className="capitalize">{r.status ?? "draft"}</Badge> },
        ]}
      />
    </div>
  );
}