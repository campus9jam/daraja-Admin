import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AppRole =
  | "admin" | "moderator" | "editor" | "curator" | "vendor" | "artisan" | "customer" | "user";

export const STAFF_ROLES: AppRole[] = ["admin", "moderator", "editor", "curator"];

export function useCurrentUser() {
  return useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) return null;

      // Production HD roles are held on profiles.role. Do not use the admin
      // prototype's separate user_roles table or its super_admin role.
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("id, role, display_name, username, avatar_url")
        .eq("id", user.id)
        .maybeSingle();
      if (error) throw error;

      const role = (profile?.role || "user") as AppRole;
      const roleList: AppRole[] = [role];
      return {
        id: user.id,
        email: user.email,
        displayName: profile?.display_name || profile?.username || user.email || "Staff member",
        avatarUrl: profile?.avatar_url,
        role,
        roles: roleList,
        isStaff: STAFF_ROLES.includes(role),
        isAdmin: role === "admin",
        isSuperAdmin: role === "admin",
        has: (r: AppRole) => roleList.includes(r),
        hasAny: (rs: AppRole[]) => rs.some((r) => roleList.includes(r)),
      };
    },
    staleTime: 30_000,
    retry: false,
  });
}
