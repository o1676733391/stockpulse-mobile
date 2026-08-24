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
  permissions: Permission[];
  isAuthenticated: boolean;
  login: (email: string, password?: string) => Promise<AuthUser>;
  register: (
    name: string,
    email: string,
    password: string,
    storeName?: string,
    phone?: string,
    role?: UserRole
  ) => Promise<AuthUser>;
  logout: () => Promise<void>;
  switchRole: (role: UserRole) => Promise<void>;
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
  canAccessRoute: (route: string) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser>(MOCK_USERS.admin);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);

  useEffect(() => {
    authService.getCurrentUser().then((u) => {
      setUser(u);
      setIsAuthenticated(true);
    });
  }, []);

  const login = useCallback(async (email: string, password?: string) => {
    const loggedInUser = await authService.login(email, password);
    setUser(loggedInUser);
    setIsAuthenticated(true);
    return loggedInUser;
  }, []);

  const register = useCallback(
    async (
      name: string,
      email: string,
      password: string,
      storeName?: string,
      phone?: string,
      role?: UserRole
    ) => {
      const registeredUser = await authService.register(
        name,
        email,
        password,
        storeName,
        phone,
        role
      );
      setUser(registeredUser);
      setIsAuthenticated(true);
      return registeredUser;
    },
    []
  );

  const logout = useCallback(async () => {
    await authService.logout();
    setIsAuthenticated(false);
  }, []);

  const switchRole = useCallback(async (newRole: UserRole) => {
    const updated = await authService.switchUserRole(newRole);
    setUser(updated);
  }, []);

  const rolePermissions = useMemo<Permission[]>(() => {
    const roleDef = ROLES[user.role];
    return roleDef?.permissions || [];
  }, [user.role]);

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
      if (
        route.startsWith('/settings') &&
        route !== '/settings/profile' &&
        route !== '/settings/appearance' &&
        route !== '/settings/about'
      ) {
        return hasPermission('settings:view');
      }
      if (route.startsWith('/orders') || route.startsWith('/procurement')) {
        return hasAnyPermission([
          'procurement:view_poq',
          'procurement:create_po',
          'procurement:submit_po',
          'procurement:goods_receipt',
        ]);
      }
      if (route.startsWith('/stock-count/active') || route === '/stock-count') {
        return hasAnyPermission(['stock_count:conduct', 'inventory:count']);
      }
      if (
        route.startsWith('/stock-count/summary') ||
        route.startsWith('/stock-count/variance')
      ) {
        return hasAnyPermission(['stock_count:approve', 'inventory:audit_approve']);
      }
      if (route.startsWith('/scan/review') || route.startsWith('/scan/result')) {
        return hasAnyPermission(['ocr:review', 'pos:ocr_review']);
      }
      if (route.startsWith('/analytics/reports')) {
        return hasPermission('analytics:export_reports');
      }
      if (route.startsWith('/team/invite')) {
        return hasPermission('team:manage');
      }
      if (route.startsWith('/team')) {
        return hasPermission('team:view');
      }
      if (route.startsWith('/audit')) {
        return hasPermission('audit:view');
      }
      return true;
    },
    [hasPermission, hasAnyPermission]
  );

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      role: user.role,
      permissions: rolePermissions,
      isAuthenticated,
      login,
      register,
      logout,
      switchRole,
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
      canAccessRoute,
    }),
    [
      user,
      rolePermissions,
      isAuthenticated,
      login,
      register,
      logout,
      switchRole,
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
      canAccessRoute,
    ]
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

export function useRole(): UserRole {
  const { role } = useAuth();
  return role;
}

export function usePermissions(): Permission[] {
  const { permissions } = useAuth();
  return permissions;
}

export function useHasPermission(permission: Permission): boolean {
  const { hasPermission } = useAuth();
  return hasPermission(permission);
}
