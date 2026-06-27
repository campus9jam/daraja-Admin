import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard, Users, Package, ShoppingCart, Scissors, Truck,
  Gavel, Bot, Coins, ShieldAlert, BarChart3, LifeBuoy, Store, Settings, LogOut, FileClock,
  FolderTree, Megaphone, Layers,
} from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter,
} from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";

const groups = [
  {
    label: "Overview",
    items: [{ title: "Dashboard", url: "/admin", icon: LayoutDashboard }],
  },
  {
    label: "Commerce",
    items: [
      { title: "Products", url: "/admin/products", icon: Package },
      { title: "Categories", url: "/admin/categories", icon: FolderTree },
      { title: "Orders", url: "/admin/orders", icon: ShoppingCart },
      { title: "Auctions", url: "/admin/auctions", icon: Gavel },
    ],
  },
  {
    label: "Operations",
    items: [
      { title: "Tailoring", url: "/admin/tailoring", icon: Scissors },
      { title: "Fabrics", url: "/admin/fabrics", icon: Layers },
      { title: "Logistics", url: "/admin/logistics", icon: Truck },
      { title: "Vendors", url: "/admin/vendors", icon: Store },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { title: "AI Workflows", url: "/admin/ai", icon: Bot },
      { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Community",
    items: [
      { title: "Users", url: "/admin/users", icon: Users },
      { title: "Rewards", url: "/admin/rewards", icon: Coins },
      { title: "Moderation", url: "/admin/moderation", icon: ShieldAlert },
      { title: "Support", url: "/admin/support", icon: LifeBuoy },
    ],
  },
  {
    label: "System",
    items: [
      { title: "Announcements", url: "/admin/announcements", icon: Megaphone },
      { title: "Audit Log", url: "/admin/audit", icon: FileClock },
      { title: "Settings", url: "/admin/settings", icon: Settings },
    ],
  },
];

export function AdminSidebar() {
  const path = useRouterState({ select: (r) => r.location.pathname });
  const navigate = useNavigate();
  const isActive = (url: string) => url === "/admin" ? path === "/admin" : path.startsWith(url);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-3 py-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-md bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-semibold">HD</div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold">House of Daraja</span>
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Admin OS</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {groups.map((g) => (
          <SidebarGroup key={g.label}>
            <SidebarGroupLabel className="text-[10px] uppercase tracking-wider">{g.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {g.items.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)} tooltip={item.title}>
                      <Link to={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={signOut} tooltip="Sign out">
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}