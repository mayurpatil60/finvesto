import { useAuth } from "../components/auth/AuthProvider";
import { CtPermission } from "../types/enums/permission.enum";

export function usePermission() {
  const { user } = useAuth();

  function hasPermission(permission: CtPermission): boolean {
    if (!user) return false;
    const perms = user.permissions ?? [];
    return perms.includes(CtPermission.WILDCARD) || perms.includes(permission);
  }

  function hasAny(...permissions: CtPermission[]): boolean {
    return permissions.some((p) => hasPermission(p));
  }

  return { hasPermission, hasAny };
}
