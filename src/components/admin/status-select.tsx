import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCurrentUser } from "@/hooks/use-current-user";
import { toast } from "sonner";

export function StatusSelect({
  table, id, value, options, queryKey, width = "w-44",
}: {
  table: string;
  id: string;
  value: string | null;
  options: readonly string[];
  queryKey: unknown[];
  width?: string;
}) {
  const { data: me } = useCurrentUser();
  const qc = useQueryClient();
  const mut = useMutation({
    mutationFn: async (status: string) => {
      const { error } = await supabase.from(table as any).update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey }); toast.success("Updated"); },
    onError: (e: any) => toast.error(e.message),
  });
  if (!me?.isStaff) return <Badge variant="secondary" className="capitalize">{value ?? "—"}</Badge>;
  return (
    <Select value={value ?? undefined} onValueChange={(v) => mut.mutate(v)}>
      <SelectTrigger className={`h-7 ${width} text-xs capitalize`}><SelectValue placeholder="—" /></SelectTrigger>
      <SelectContent>
        {options.map((s) => <SelectItem key={s} value={s} className="capitalize">{s.replace(/_/g, " ")}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}