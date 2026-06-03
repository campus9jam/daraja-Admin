import { createFileRoute } from "@tanstack/react-router";
import { SimpleTablePage } from "@/components/admin/simple-table-page";

export const Route = createFileRoute("/_authenticated/admin/rewards")({
  component: () => (
    <SimpleTablePage
      title="Rewards & Tokens"
      description="Wallets, loyalty events, and referral rewards."
      table="wallet_transactions"
      select="id, user_id, type, amount, currency, status, created_at"
      columns={[
        { key: "user_id", header: "User", render: (r: any) => <span className="font-mono text-xs">{(r.user_id ?? "").slice(0,8)}</span> },
        { key: "type", header: "Type" },
        { key: "amount", header: "Amount", render: (r: any) => `${r.currency ?? "HD"} ${Number(r.amount ?? 0).toLocaleString()}` },
        { key: "status", header: "Status" },
        { key: "created_at", header: "Date", render: (r: any) => new Date(r.created_at).toLocaleDateString() },
      ]}
    />
  ),
});