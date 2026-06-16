import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/admin/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, BarChart, Bar, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/admin/analytics")({ component: AnalyticsPage });

function AnalyticsPage() {
  const since = new Date(); since.setDate(since.getDate() - 29);
  const sinceISO = since.toISOString();

  const { data: events, isLoading: lE } = useQuery({
    queryKey: ["admin-events-30d"],
    queryFn: async () => {
      const { data, error } = await supabase.from("analytics_events")
        .select("created_at, event_name").gte("created_at", sinceISO).limit(5000);
      if (error) throw error;
      return data;
    },
  });

  const { data: metrics, isLoading: lM } = useQuery({
    queryKey: ["admin-business-metrics"],
    queryFn: async () => {
      const { data, error } = await supabase.from("business_metrics")
        .select("metric_date, metric_key, metric_value").gte("metric_date", sinceISO.slice(0, 10))
        .order("metric_date");
      if (error) throw error;
      return data;
    },
  });

  // bucket events by day
  const byDay = new Map<string, number>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    byDay.set(d.toISOString().slice(0, 10), 0);
  }
  for (const e of events ?? []) {
    const k = (e as any).created_at.slice(0, 10);
    byDay.set(k, (byDay.get(k) ?? 0) + 1);
  }
  const eventSeries = Array.from(byDay, ([date, count]) => ({ date: date.slice(5), count }));

  // top events
  const counts = new Map<string, number>();
  for (const e of events ?? []) counts.set((e as any).event_name, (counts.get((e as any).event_name) ?? 0) + 1);
  const topEvents = Array.from(counts, ([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count).slice(0, 8);

  // business metrics grouped
  const metricKeys = Array.from(new Set((metrics ?? []).map((m: any) => m.metric_key))).slice(0, 6);

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" description="Events, conversions, and business metrics — last 30 days." />

      <Card className="border-border/60">
        <CardHeader><CardTitle className="text-sm font-medium tracking-wide uppercase text-muted-foreground">Events per day</CardTitle></CardHeader>
        <CardContent>
          {lE ? <Skeleton className="h-[240px]" /> : (
            <ChartContainer config={{ count: { label: "Events", color: "hsl(var(--primary))" } }} className="h-[240px] w-full">
              <AreaChart data={eventSeries}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} className="text-xs" />
                <YAxis tickLine={false} axisLine={false} className="text-xs" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area type="monotone" dataKey="count" stroke="var(--color-count)" fill="var(--color-count)" fillOpacity={0.2} />
              </AreaChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-border/60">
          <CardHeader><CardTitle className="text-sm font-medium tracking-wide uppercase text-muted-foreground">Top event types</CardTitle></CardHeader>
          <CardContent>
            {lE ? <Skeleton className="h-[220px]" /> : topEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No events recorded yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={topEvents} layout="vertical" margin={{ left: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" horizontal={false} />
                  <XAxis type="number" tickLine={false} axisLine={false} className="text-xs" />
                  <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={120} className="text-xs" />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardHeader><CardTitle className="text-sm font-medium tracking-wide uppercase text-muted-foreground">Business metrics</CardTitle></CardHeader>
          <CardContent>
            {lM ? <Skeleton className="h-[220px]" /> : metricKeys.length === 0 ? (
              <p className="text-sm text-muted-foreground">No business metrics recorded yet.</p>
            ) : (
              <div className="space-y-2 text-sm">
                {metricKeys.map((k) => {
                  const rows = (metrics ?? []).filter((m: any) => m.metric_key === k);
                  const total = rows.reduce((s, r: any) => s + Number(r.metric_value ?? 0), 0);
                  return (
                    <div key={k} className="flex items-center justify-between border-b border-border/40 pb-2">
                      <span className="font-mono text-xs text-muted-foreground">{k}</span>
                      <span className="tabular-nums">{total.toLocaleString()}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}