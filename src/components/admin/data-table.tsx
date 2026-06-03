import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export type Column<T> = { key: string; header: string; render?: (row: T) => React.ReactNode };

export function DataTable<T extends Record<string, any>>({
  rows, columns, loading, empty = "No records.",
}: { rows?: T[]; columns: Column<T>[]; loading?: boolean; empty?: string }) {
  return (
    <Card className="border-border/60 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>{columns.map(c => <TableHead key={c.key}>{c.header}</TableHead>)}</TableRow>
        </TableHeader>
        <TableBody>
          {loading ? Array.from({ length: 6 }).map((_, i) => (
            <TableRow key={i}>{columns.map(c => <TableCell key={c.key}><Skeleton className="h-4 w-24" /></TableCell>)}</TableRow>
          )) : !rows || rows.length === 0 ? (
            <TableRow><TableCell colSpan={columns.length} className="text-center text-muted-foreground py-8">{empty}</TableCell></TableRow>
          ) : rows.map((row, i) => (
            <TableRow key={(row.id as string) ?? i}>
              {columns.map(c => <TableCell key={c.key}>{c.render ? c.render(row) : String(row[c.key] ?? "—")}</TableCell>)}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}