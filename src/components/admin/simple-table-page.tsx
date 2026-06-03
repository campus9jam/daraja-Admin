import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "./page-header";
import { DataTable, type Column } from "./data-table";

export function SimpleTablePage<T extends Record<string, any>>({
  title, description, table, select, columns, orderBy = "created_at",
}: {
  title: string; description: string; table: string; select: string;
  columns: Column<T>[]; orderBy?: string;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-table", table],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(table as any).select(select).order(orderBy, { ascending: false }).limit(100);
      if (error) throw error;
      return data as unknown as T[];
    },
  });
  return (
    <div>
      <PageHeader title={title} description={description} />
      <DataTable<T> loading={isLoading} rows={data ?? []} columns={columns} />
    </div>
  );
}