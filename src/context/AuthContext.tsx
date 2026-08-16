import { ROLES } from '@/constants/rbac';
import { MOCK_USERS, authService } from '@/services/authService';
import { AuthUser, Permission, UserRole } from '@/types/rbac';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

export interface AuthContextType {
  user: AuthUser;
  role: UserRole;
  isAuthenticated: boolean;
  switchRole: (role: UserRole) => Promise<void>;
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
  canAccessRoute: (route: string) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser>(MOCK_USERS.admin);

  useEffect(() => {
    authService.getCurrentUser().then(setUser);
  }, []);

  const switchRole = useCallback(async (newRole: UserRole) => {
    const updated = await authService.switchUserRole(newRole);
    setUser(updated);
  }, []);

  const hasPermission = useCallback(
    (permission: Permission): boolean => {
      const roleDef = ROLES[user.role];
      if (!roleDef) return false;
      return roleDef.permissions.includes(permission);
    },
    [user.role]
  );

  const hasAnyPermission = useCallback(
    (permissions: Permission[]): boolean => {
      return permissions.some((p) => hasPermission(p));
    },
    [hasPermission]
  );

  const hasAllPermissions = useCallback(
    (permissions: Permission[]): boolean => {
      return permissions.every((p) => hasPermission(p));
    },
    [hasPermission]
  );

  const canAccessRoute = useCallback(
    (route: string): boolean => {
      if (route.startsWith('/settings') && route !== '/settings/profile' && route !== '/settings/appearance' && route !== '/settings/about') {
        return hasPermission('settings:view');
      }
      if (route.startsWith('/orders') || route.startsWith('/procurement')) {
        return hasAnyPermission(['procurement:view_poq', 'procurement:submit_po', 'procurement:goods_receipt']);
      }
      if (route.startsWith('/stock-count/active')) {
        return hasPermission('inventory:count');
      }
      if (route.startsWith('/stock-count/summary') || route.startsWith('/stock-count/variance')) {
        return hasPermission('inventory:audit_approve');
      }
      if (route.startsWith('/scan/review') || route.startsWith('/scan/result')) {
        return hasPermission('pos:ocr_review');
      }
      if (route.startsWith('/analytics/reports')) {
        return hasPermission('analytics:export_reports');
      }
      if (route.startsWith('/team/invite')) {
        return hasPermission('team:manage');
      }
      return true;
    },
    [hasPermission, hasAnyPermission]
  );

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      role: user.role,
      isAuthenticated: true,
      switchRole,
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
      canAccessRoute,
    }),
    [user, switchRole, hasPermission, hasAnyPermission, hasAllPermissions, canAccessRoute]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}

export function usePermission(permission: Permission): boolean {
  const { hasPermission } = useAuth();
  return hasPermission(permission);
}

export function useRole(): UserRole {
  const { role } = useAuth();
  return role;
}
