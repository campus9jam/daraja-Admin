import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/admin/page-header";
import { DataTable } from "@/components/admin/data-table";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/admin/products")({ component: ProductsPage });

function ProductsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, slug, category, price, currency, status, stock, orders_count, created_at")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="space-y-4">
      <PageHeader title="Products" description="Live marketplace catalogue. Editing and publishing controls will be enabled after staff write permissions and product workflows are verified against production RLS." />
      {error && <p className="text-sm text-destructive">{error.message}</p>}
      <DataTable
        loading={isLoading}
        rows={data ?? []}
        columns={[
          { key: "name", header: "Product", render: (r: any) => <div><div className="font-medium">{r.name}</div><div className="text-xs text-muted-foreground">{r.slug}</div></div> },
          { key: "category", header: "Category", render: (r: any) => r.category },
          { key: "price", header: "Price", render: (r: any) => `${r.currency} ${Number(r.price).toLocaleString()}` },
          { key: "stock", header: "Stock", render: (r: any) => r.stock },
          { key: "orders_count", header: "Orders", render: (r: any) => r.orders_count },
          { key: "status", header: "Status", render: (r: any) => <Badge variant="secondary" className="capitalize">{r.status}</Badge> },
        ]}
      />
    </div>
  );
}
