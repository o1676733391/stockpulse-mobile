import { ROLES } from '@/constants/rbac';
import { registerUnauthorizedCallback, setAuthToken } from '@/services/apiClient';
import {
  AuthUser,
  LoginResult,
  MOCK_USERS,
  RegisterResult,
  authService,
} from '@/services/authService';
import { supabase } from '@/services/supabaseClient';
import { Permission, UserRole } from '@/types/rbac';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

export type AuthState =
  | 'INITIALIZING'
  | 'AUTHENTICATED'
  | 'UNAUTHENTICATED'
  | 'EMAIL_VERIFICATION_REQUIRED'
  | 'ACCOUNT_DISABLED';

export interface AuthContextType {
  user: AuthUser;
  role: UserRole;
  permissions: Permission[];
  authState: AuthState;
  isAuthenticated: boolean;
  isInitializing: boolean;
  unverifiedEmail: string | null;
  login: (email: string, password?: string) => Promise<LoginResult>;
  register: (
    name: string,
    email: string,
    password: string,
    storeName?: string,
    phone?: string,
    role?: UserRole
  ) => Promise<RegisterResult>;
  registerRestaurant: (payload: any) => Promise<RegisterResult>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  resendVerificationEmail: (email?: string) => Promise<void>;
  switchRole: (role: UserRole) => Promise<void>;
  refreshUser: () => Promise<AuthUser | null>;
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
  canAccessRoute: (route: string) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser>(MOCK_USERS.admin);
  const [authState, setAuthState] = useState<AuthState>('INITIALIZING');
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);

  // Initialize session & register state listeners
  useEffect(() => {
    let mounted = true;

    async function initSession() {
      try {
        const { data: sessionData, error } = await supabase.auth.getSession();
        if (error || !sessionData?.session?.user) {
          if (mounted) {
            setAuthState('UNAUTHENTICATED');
          }
          return;
        }

        const sessionUser = sessionData.session.user;
        const isConfirmed = Boolean(sessionUser.email_confirmed_at);

        if (!isConfirmed && process.env.NODE_ENV === 'production') {
          if (mounted) {
            setUnverifiedEmail(sessionUser.email || null);
            setAuthState('EMAIL_VERIFICATION_REQUIRED');
          }
          return;
        }

        setAuthToken(sessionData.session.access_token);
        const currentUser = await authService.getCurrentUser();

        if (mounted) {
          if (currentUser) {
            if (currentUser.status === 'inactive') {
              setAuthState('ACCOUNT_DISABLED');
            } else {
              setUser(currentUser);
              setAuthState('AUTHENTICATED');
            }
          } else {
            setAuthState('UNAUTHENTICATED');
          }
        }
      } catch (err: any) {
        if (mounted) {
          if (err.message === 'ACCOUNT_DISABLED') {
            setAuthState('ACCOUNT_DISABLED');
          } else {
            setAuthState('UNAUTHENTICATED');
          }
        }
      }
    }

    initSession();

    // Listen to Supabase Auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        if (event === 'SIGNED_OUT' || !session) {
          setAuthToken(null);
          setAuthState('UNAUTHENTICATED');
          setUnverifiedEmail(null);
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          setAuthToken(session.access_token);
          const isConfirmed = Boolean(session.user.email_confirmed_at);
          if (!isConfirmed && process.env.NODE_ENV === 'production') {
            setUnverifiedEmail(session.user.email || null);
            setAuthState('EMAIL_VERIFICATION_REQUIRED');
          } else {
            const currentUser = await authService.getCurrentUser();
            if (currentUser) {
              if (currentUser.status === 'inactive') {
                setAuthState('ACCOUNT_DISABLED');
              } else {
                setUser(currentUser);
                setAuthState('AUTHENTICATED');
              }
            }
          }
        }
      }
    );

    // Register API client unauthorized listener
    registerUnauthorizedCallback(() => {
      if (mounted) {
        setAuthToken(null);
        setAuthState('UNAUTHENTICATED');
      }
    });

    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const login = useCallback(async (email: string, password?: string): Promise<LoginResult> => {
    try {
      const result = await authService.login(email, password);
      if (result.emailNeedsVerification) {
        setUnverifiedEmail(email);
        setAuthState('EMAIL_VERIFICATION_REQUIRED');
        return result;
      }

      setUser(result.user);
      setAuthState('AUTHENTICATED');
      return result;
    } catch (err: any) {
      if (err.message === 'ACCOUNT_DISABLED') {
        setAuthState('ACCOUNT_DISABLED');
      }
      throw err;
    }
  }, []);

  const register = useCallback(
    async (
      name: string,
      email: string,
      password: string,
      storeName?: string,
      phone?: string,
      role?: UserRole
    ): Promise<RegisterResult> => {
      const result = await authService.register(
        name,
        email,
        password,
        storeName,
        phone,
        role
      );

      if (result.emailNeedsVerification) {
        setUnverifiedEmail(email);
        setAuthState('EMAIL_VERIFICATION_REQUIRED');
      } else {
        setUser(result.user);
        setAuthState('AUTHENTICATED');
      }

      return result;
    },
    []
  );

  const registerRestaurant = useCallback(
    async (payload: any): Promise<RegisterResult> => {
      const result = await authService.registerRestaurant(payload);

      if (result.emailNeedsVerification) {
        setUnverifiedEmail(payload.adminEmail);
        setAuthState('EMAIL_VERIFICATION_REQUIRED');
      } else {
        setUser(result.user);
        setAuthState('AUTHENTICATED');
      }

      return result;
    },
    []
  );

  const logout = useCallback(async () => {
    await authService.logout();
    setAuthToken(null);
    setAuthState('UNAUTHENTICATED');
    setUnverifiedEmail(null);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    await authService.resetPassword(email);
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    await authService.updatePassword(newPassword);
  }, []);

  const resendVerificationEmail = useCallback(
    async (email?: string) => {
      const targetEmail = email || unverifiedEmail;
      if (!targetEmail) {
        throw new Error('No email address available to resend verification');
      }
      await authService.resendVerificationEmail(targetEmail);
    },
    [unverifiedEmail]
  );

  const switchRole = useCallback(async (newRole: UserRole) => {
    const updated = await authService.switchUserRole(newRole);
    setUser(updated);
  }, []);

  const refreshUser = useCallback(async (): Promise<AuthUser | null> => {
    try {
      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        if (currentUser.status === 'inactive') {
          setAuthState('ACCOUNT_DISABLED');
        } else {
          setAuthState('AUTHENTICATED');
        }
      }
      return currentUser;
    } catch (err) {
      return null;
    }
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
      authState,
      isAuthenticated: authState === 'AUTHENTICATED',
      isInitializing: authState === 'INITIALIZING',
      unverifiedEmail,
      login,
      register,
      registerRestaurant,
      logout,
      resetPassword,
      updatePassword,
      resendVerificationEmail,
      switchRole,
      refreshUser,
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
      canAccessRoute,
    }),
    [
      user,
      rolePermissions,
      authState,
      unverifiedEmail,
      login,
      register,
      registerRestaurant,
      logout,
      resetPassword,
      updatePassword,
      resendVerificationEmail,
      switchRole,
      refreshUser,
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
