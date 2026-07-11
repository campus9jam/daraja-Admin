import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Subscribes to workflow-relevant tables and shows admin-side toasts.
 * Mounted once inside the admin layout.
 */
export function useAdminRealtime(enabled: boolean) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!enabled) return;
    const channel = supabase
      .channel("admin-ops")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "orders" }, (p: any) => {
        toast.info(`New order — ${(p.new?.total_amount ?? "").toString()}`, { description: p.new?.order_number ?? p.new?.id });
        qc.invalidateQueries({ queryKey: ["admin-orders"] });
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders" }, (p: any) => {
        if (p.old?.status !== p.new?.status) {
          toast(`Order ${p.new?.order_number ?? p.new?.id?.slice(0,8)} → ${p.new?.status}`);
          qc.invalidateQueries({ queryKey: ["admin-orders"] });
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "support_tickets" }, (p: any) => {
        if (p.eventType === "INSERT") toast.info(`New ticket: ${p.new?.subject ?? "(no subject)"}`);
        else if (p.eventType === "UPDATE" && p.old?.status !== p.new?.status)
          toast(`Ticket ${p.new?.ticket_number ?? ""} → ${p.new?.status}`);
        qc.invalidateQueries({ queryKey: ["admin-support"] });
        qc.invalidateQueries({ queryKey: ["admin-ticket", p.new?.id] });
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "moderation_reports" }, (p: any) => {
        toast.warning(`Report filed: ${p.new?.reason ?? "review needed"}`);
        qc.invalidateQueries({ queryKey: ["admin-moderation"] });
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "audit_logs" }, (p: any) => {
        qc.invalidateQueries({ queryKey: ["admin-audit"] });
        // silent unless critical
        if (["role.grant", "role.revoke", "emergency.trigger"].includes(p.new?.action)) {
          toast.error(`Audit: ${p.new?.action} on ${p.new?.entity_type}`);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [enabled, qc]);
}
