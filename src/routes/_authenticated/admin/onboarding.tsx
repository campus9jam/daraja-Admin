import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/admin/page-header";
import { DataTable } from "@/components/admin/data-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useCurrentUser } from "@/hooks/use-current-user";

const STATUSES = ["pending", "approved", "rejected", "withdrawn"] as const;

export const Route = createFileRoute("/_authenticated/admin/onboarding")({ component: OnboardingPage });

function OnboardingPage() {
  const { data: me } = useCurrentUser();
  const qc = useQueryClient();
  const [openId, setOpenId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("pending");
  const [q, setQ] = useState("");
  const [notes, setNotes] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-onboarding", status],
    queryFn: async () => {
      let query = supabase
        .from("staff_applications")
        .select("id, user_id, requested_role, status, business_name, bio, portfolio_urls, coverage_areas, id_document_url, reviewer_notes, reviewed_at, created_at, profile:profiles(display_name, email, phone)")
        .order("created_at", { ascending: false }).limit(200);
      if (status !== "all") query = query.eq("status", status);
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return data ?? [];
    return (data ?? []).filter((r: any) =>
      (r.profile?.email ?? "").toLowerCase().includes(s) ||
      (r.profile?.display_name ?? "").toLowerCase().includes(s) ||
      (r.business_name ?? "").toLowerCase().includes(s) ||
      (r.requested_role ?? "").toLowerCase().includes(s));
  }, [data, q]);

  const current = (data ?? []).find((r: any) => r.id === openId);

  const approve = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("approve_staff_application", { _id: openId!, _notes: notes || null });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Application approved"); qc.invalidateQueries({ queryKey: ["admin-onboarding"] }); setOpenId(null); setNotes(""); },
    onError: (e: any) => toast.error(e.message),
  });
  const reject = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("reject_staff_application", { _id: openId!, _notes: notes || null });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Application rejected"); qc.invalidateQueries({ queryKey: ["admin-onboarding"] }); setOpenId(null); setNotes(""); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div>
      <PageHeader title="Staff onboarding" description="Approve or reject tailor, logistics, vendor, and moderator applications." />
      <div className="flex gap-2 mb-3">
        <Input placeholder="Search name, email, business…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-40 capitalize"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <DataTable
        loading={isLoading}
        rows={rows}
        columns={[
          { key: "applicant", header: "Applicant", render: (r: any) => (
            <div className="flex flex-col">
              <span className="text-sm">{r.profile?.display_name ?? "—"}</span>
              <span className="text-xs text-muted-foreground">{r.profile?.email ?? r.user_id.slice(0, 8)}</span>
            </div>
          )},
          { key: "requested_role", header: "Role", render: (r: any) => <Badge variant="secondary">{r.requested_role}</Badge> },
          { key: "business_name", header: "Business", render: (r: any) => <span className="text-xs">{r.business_name ?? "—"}</span> },
          { key: "status", header: "Status", render: (r: any) => <Badge className="capitalize" variant={r.status === "approved" ? "default" : r.status === "rejected" ? "destructive" : "secondary"}>{r.status}</Badge> },
          { key: "created_at", header: "Submitted", render: (r: any) => new Date(r.created_at).toLocaleDateString() },
          { key: "actions", header: "", render: (r: any) => <Button size="sm" variant="ghost" onClick={() => { setOpenId(r.id); setNotes(r.reviewer_notes ?? ""); }}>Review</Button> },
        ]}
      />

      <Sheet open={!!openId} onOpenChange={(o) => { if (!o) { setOpenId(null); setNotes(""); } }}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader><SheetTitle>Application review</SheetTitle></SheetHeader>
          {current && (
            <div className="mt-6 space-y-4 text-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{current.profile?.display_name ?? "—"}</div>
                  <div className="text-xs text-muted-foreground">{current.profile?.email}</div>
                </div>
                <Badge className="capitalize" variant={current.status === "approved" ? "default" : current.status === "rejected" ? "destructive" : "secondary"}>{current.status}</Badge>
              </div>

              <Field label="Requested role"><Badge variant="secondary">{current.requested_role}</Badge></Field>
              <Field label="Business name">{current.business_name ?? "—"}</Field>
              <Field label="Phone">{current.profile?.phone ?? "—"}</Field>
              <Field label="Bio"><p className="whitespace-pre-wrap text-sm">{current.bio ?? "—"}</p></Field>
              <Field label="Coverage areas">
                <div className="flex flex-wrap gap-1">{(current.coverage_areas ?? []).map((a: string) => <Badge key={a} variant="outline">{a}</Badge>) || "—"}</div>
              </Field>
              <Field label="Portfolio">
                <div className="flex flex-col gap-1">
                  {(current.portfolio_urls ?? []).map((u: string) => <a key={u} className="text-xs text-primary underline break-all" href={u} target="_blank" rel="noreferrer">{u}</a>)}
                  {(!current.portfolio_urls || current.portfolio_urls.length === 0) && <span className="text-xs text-muted-foreground">—</span>}
                </div>
              </Field>
              <Field label="ID document">
                {current.id_document_url ? <a className="text-xs text-primary underline break-all" href={current.id_document_url} target="_blank" rel="noreferrer">View document</a> : <span className="text-xs text-muted-foreground">Not provided</span>}
              </Field>

              <div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Reviewer notes</div>
                <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Internal notes visible in audit log…" />
              </div>

              {me?.isAdmin && current.status === "pending" ? (
                <div className="flex gap-2 pt-2">
                  <Button onClick={() => approve.mutate()} disabled={approve.isPending || reject.isPending}>Approve & grant role</Button>
                  <Button variant="outline" onClick={() => reject.mutate()} disabled={reject.isPending || approve.isPending}>Reject</Button>
                </div>
              ) : !me?.isAdmin ? (
                <div className="text-xs text-muted-foreground">Only admins can approve or reject applications.</div>
              ) : (
                <div className="text-xs text-muted-foreground">Already {current.status} on {current.reviewed_at ? new Date(current.reviewed_at).toLocaleString() : "—"}.</div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{label}</div>
      <div>{children}</div>
    </div>
  );
}