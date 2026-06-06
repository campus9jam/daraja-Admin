import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AppRole =
  | "super_admin" | "admin" | "moderator" | "support"
  | "tailor" | "logistics" | "designer" | "vendor" | "customer";

export const STAFF_ROLES: AppRole[] = ["super_admin", "admin", "moderator", "support"];

export function useCurrentUser() {
  return useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data: roles } = await supabase
        .from("user_roles").select("role").eq("user_id", user.id);
      const roleList = (roles ?? []).map((r: any) => r.role as AppRole);
      return {
        id: user.id,
        email: user.email,
        roles: roleList,
        isStaff: roleList.some((r) => STAFF_ROLES.includes(r)),
        isAdmin: roleList.includes("super_admin") || roleList.includes("admin"),
        isSuperAdmin: roleList.includes("super_admin"),
        has: (r: AppRole) => roleList.includes(r),
        hasAny: (rs: AppRole[]) => rs.some((r) => roleList.includes(r)),
      };
    },
    staleTime: 60_000,
  });
}