import { ROLES } from '@/constants/rbac';
import { i18n } from '@/i18n/manager';
import { AuthUser, Permission, UserRole } from '@/types/rbac';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import { apiClient, getAuthToken, logDebugFallback, setAuthToken } from './apiClient';
import { supabase } from './supabaseClient';

export function getAuthRedirectUrl(path: string = 'auth/callback'): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `${window.location.origin}/${path}`;
  }
  return 'stockpulse://auth/callback';
}

export const MOCK_USERS: Record<UserRole, AuthUser> = {
  admin: {
    id: '01915dfa-9012-7000-8000-000000000001',
    name: 'Anna Schmidt',
    email: 'anna.admin@restaurant.de',
    phone: '+49 30 9876 5432',
    avatarText: 'AS',
    role: 'admin',
    storeId: '01915dfa-9012-7000-8000-000000000002',
    storeName: 'Bella Cucina Restaurant',
    status: 'active',
    lastActive: 'Just now',
  },
  manager: {
    id: '01915dfa-9012-7000-8000-000000000002',
    name: 'Marco Rossi',
    email: 'marco.manager@restaurant.de',
    phone: '+49 30 8765 4321',
    avatarText: 'MR',
    role: 'manager',
    storeId: '01915dfa-9012-7000-8000-000000000002',
    storeName: 'Bella Cucina Restaurant',
    status: 'active',
    lastActive: '5m ago',
  },
  supervisor: {
    id: '01915dfa-9012-7000-8000-000000000003',
    name: 'David Weber',
    email: 'david.lead@restaurant.de',
    phone: '+49 30 7654 3210',
    avatarText: 'DW',
    role: 'supervisor',
    storeId: '01915dfa-9012-7000-8000-000000000002',
    storeName: 'Bella Cucina Restaurant',
    status: 'active',
    lastActive: '12m ago',
  },
  staff: {
    id: '01915dfa-9012-7000-8000-000000000004',
    name: 'Elena Fischer',
    email: 'elena.cook@restaurant.de',
    phone: '+49 30 6543 2109',
    avatarText: 'EF',
    role: 'staff',
    storeId: '01915dfa-9012-7000-8000-000000000002',
    storeName: 'Bella Cucina Restaurant',
    status: 'active',
    lastActive: '2h ago',
  },
  auditor: {
    id: '01915dfa-9012-7000-8000-000000000005',
    name: 'Dr. Klaus Becker',
    email: 'klaus.auditor@becker-consult.de',
    phone: '+49 30 5432 1098',
    avatarText: 'KB',
    role: 'auditor',
    storeId: '01915dfa-9012-7000-8000-000000000002',
    storeName: 'Bella Cucina Restaurant',
    status: 'active',
    lastActive: 'Yesterday',
  },
};

export type { AuthUser } from '@/types/rbac';

export function formatAuthError(err: any): Error {
  const msg = err?.message || err?.msg || String(err || '');
  const status = err?.status || err?.code;
  const errorCode = err?.error_code || err?.name;
  const lower = (msg + ' ' + (errorCode || '')).toLowerCase();

  let formattedMessage = msg;
  let code = 'AUTH_FAILED';

  if (status === 429 || lower.includes('rate limit') || lower.includes('over_email_send_rate_limit') || lower.includes('too many requests')) {
    formattedMessage = 'Email service rate limit exceeded. Please wait a few minutes before requesting another verification email or sign in directly if already confirmed.';
    code = 'AUTH_RATE_LIMITED';
  } else if (lower.includes('already registered') || lower.includes('email_exists')) {
    formattedMessage = 'This email address is already registered. Please sign in instead.';
    code = 'AUTH_EMAIL_EXISTS';
  } else if (lower.includes('invalid login credentials') || lower.includes('invalid credentials')) {
    formattedMessage = 'Invalid email or password. Please check your credentials.';
    code = 'AUTH_INVALID_CREDENTIALS';
  } else if (lower.includes('password should be at least')) {
    formattedMessage = 'Password must be at least 6 characters long.';
    code = 'AUTH_WEAK_PASSWORD';
  } else if (lower.includes('email not confirmed')) {
    formattedMessage = 'Please verify your email address before signing in.';
    code = 'AUTH_EMAIL_UNCONFIRMED';
  } else if (lower.includes('network') || lower.includes('fetch') || lower.includes('failed to fetch')) {
    formattedMessage = 'Unable to connect to authentication server. Please check your network connection.';
    code = 'AUTH_NETWORK_ERROR';
  }

  const error = new Error(formattedMessage);
  (error as any).code = code;
  (error as any).status = status || (code === 'AUTH_RATE_LIMITED' ? 429 : 400);
  (error as any).originalMessage = msg;
  (error as any).errorCode = errorCode;
  return error;
}

export const INITIAL_TEAM_MEMBERS: AuthUser[] = [
  MOCK_USERS.admin,
  MOCK_USERS.manager,
  MOCK_USERS.supervisor,
  MOCK_USERS.staff,
  MOCK_USERS.auditor,
  {
    id: '01915dfa-9012-7000-8000-000000000006',
    name: 'Sophie Wagner',
    email: 'sophie.barista@restaurant.de',
    phone: '+49 30 4321 0987',
    avatarText: 'SW',
    role: 'staff',
    storeId: '01915dfa-9012-7000-8000-000000000002',
    storeName: 'Bella Cucina Restaurant',
    status: 'active',
    lastActive: '1h ago',
  },
  {
    id: '01915dfa-9012-7000-8000-000000000007',
    name: 'Lukas Bauer',
    email: 'lukas.prep@restaurant.de',
    phone: '+49 30 3210 9876',
    avatarText: 'LB',
    role: 'staff',
    storeId: '01915dfa-9012-7000-8000-000000000002',
    storeName: 'Bella Cucina Restaurant',
    status: 'inactive',
    lastActive: '4 days ago',
  },
];

export interface LoginResult {
  user: AuthUser;
  emailNeedsVerification?: boolean;
}

export interface RegisterResult {
  user: AuthUser;
  emailNeedsVerification: boolean;
}

export interface RestaurantRegistrationPayload {
  storeName: string;
  country: string;
  currency: string;
  language: string;
  timezone: string;
  countSchedule: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
  adminPhone?: string;
  invitedMembers?: Array<{ name: string; email: string; role: string }>;
}

export interface IAuthService {
  login(email: string, password?: string): Promise<LoginResult>;
  register(
    name: string,
    email: string,
    password: string,
    storeName?: string,
    phone?: string,
    role?: UserRole
  ): Promise<RegisterResult>;
  registerRestaurant(payload: RestaurantRegistrationPayload): Promise<RegisterResult>;
  logout(): Promise<void>;
  resetPassword(email: string): Promise<void>;
  updatePassword(newPassword: string): Promise<void>;
  resendVerificationEmail(email: string): Promise<void>;
  handleAuthCallback(url: string): Promise<{ session: any; user: AuthUser | null; type?: string }>;
  getCurrentUser(): Promise<AuthUser | null>;
  switchUserRole(role: UserRole): Promise<AuthUser>;
  hasPermission(role: UserRole, permission: Permission): boolean;
  getTeamMembers(): Promise<AuthUser[]>;
  getMemberById(id: string): Promise<AuthUser | null>;
  updateMemberRole(id: string, role: UserRole): Promise<AuthUser>;
  inviteMember(name: string, email: string, role: UserRole, phone?: string): Promise<AuthUser>;
  removeMember(id: string): Promise<boolean>;
  restoreSession(): Promise<AuthUser | null>;
}

export class RealAuthService implements IAuthService {
  private currentUser: AuthUser | null = null;
  private teamMembers: AuthUser[] = JSON.parse(JSON.stringify(INITIAL_TEAM_MEMBERS));

  async login(email: string, password: string = 'StockPulse123!'): Promise<LoginResult> {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (authError) {
        if (authError.message.toLowerCase().includes('email not confirmed')) {
          return {
            user: {
              id: 'pending',
              name: email.split('@')[0],
              email,
              avatarText: 'PE',
              role: 'staff',
              storeId: 'pending',
              storeName: 'Pending Store',
              status: 'inactive',
              lastActive: 'Just now',
            },
            emailNeedsVerification: true,
          };
        }
        throw formatAuthError(authError);
      }

      if (!authData.session || !authData.user) {
        throw new Error('Authentication failed: No active session received from Supabase');
      }

      const isEmailConfirmed = Boolean(authData.user.email_confirmed_at);
      if (!isEmailConfirmed && process.env.NODE_ENV === 'production') {
        return {
          user: this.mapSupabaseUserToAuthUser(authData.user),
          emailNeedsVerification: true,
        };
      }

      setAuthToken(authData.session.access_token);

      // Fetch authoritative profile from backend /api/v1/auth/me
      let userProfile: AuthUser;
      try {
        const backendProfile = await apiClient.get<any>('/auth/me', { skipStoreHeader: true });
        userProfile = {
          id: backendProfile.id || authData.user.id,
          name: backendProfile.name || authData.user.user_metadata?.name || email.split('@')[0],
          email: backendProfile.email || authData.user.email || email,
          phone: backendProfile.phone || authData.user.user_metadata?.phone,
          avatarText: this.extractInitials(backendProfile.name || email),
          role: (backendProfile.role as UserRole) || 'admin',
          storeId:
            backendProfile.defaultStoreId ||
            backendProfile.assignedStoreIds?.[0] ||
            '01915dfa-9012-7000-8000-000000000002',
          storeName: backendProfile.storeName || 'StockPulse Store',
          status: 'active',
          lastActive: 'Just now',
        };
      } catch (profileErr: any) {
        if (profileErr?.status === 403 || profileErr?.message?.includes('disabled')) {
          const disabledUser = this.mapSupabaseUserToAuthUser(authData.user);
          disabledUser.status = 'inactive';
          this.currentUser = disabledUser;
          throw new Error('ACCOUNT_DISABLED');
        }
        userProfile = this.mapSupabaseUserToAuthUser(authData.user);
      }

      this.currentUser = userProfile;
      return { user: userProfile, emailNeedsVerification: false };
    } catch (err: any) {
      if (err.message === 'ACCOUNT_DISABLED') {
        throw err;
      }
      // Try authenticating through the backend /auth/login endpoint (works over USB adb reverse even if phone Wi-Fi is off)
      try {
        const backendAuth = await apiClient.post<any>(
          '/auth/login',
          { email: email.trim().toLowerCase(), password },
          { skipAuth: true, skipStoreHeader: true }
        );
        if (backendAuth?.accessToken) {
          setAuthToken(backendAuth.accessToken);
          const bp = backendAuth.user || {};
          const userProfile: AuthUser = {
            id: bp.id || `usr-${Date.now()}`,
            name: bp.name || email.split('@')[0],
            email: bp.email || email,
            phone: bp.phone,
            avatarText: this.extractInitials(bp.name || email),
            role: (bp.role as UserRole) || 'admin',
            storeId:
              bp.defaultStoreId ||
              bp.assignedStoreIds?.[0] ||
              '01915dfa-9012-7000-8000-000000000002',
            storeName: bp.storeName || 'Bella Cucina Restaurant',
            status: 'active',
            lastActive: 'Just now',
          };
          this.currentUser = userProfile;
          return { user: userProfile, emailNeedsVerification: false };
        }
      } catch {
        // Proceed to mock fallback if enabled
      }
      if (apiClient.isFallbackEnabled()) {
        const cleanEmail = email.trim().toLowerCase();
        const matchedMock =
          Object.values(MOCK_USERS).find((u) => u.email.toLowerCase() === cleanEmail) ||
          INITIAL_TEAM_MEMBERS.find((u) => u.email.toLowerCase() === cleanEmail) ||
          MOCK_USERS.admin;
        logDebugFallback('authService.login', 'networkFallback [MOCK]', { email, mockUser: matchedMock.email });
        this.currentUser = matchedMock;
        return { user: matchedMock, emailNeedsVerification: false };
      }
      throw formatAuthError(err);
    }
  }

  async register(
    name: string,
    email: string,
    password: string,
    storeName?: string,
    phone?: string,
    role: UserRole = 'admin'
  ): Promise<RegisterResult> {
    try {
      const cleanEmail = email.trim().toLowerCase();
      let backendSignupRes: any = null;
      try {
        backendSignupRes = await apiClient.post(
          '/auth/signup',
          {
            email: cleanEmail,
            password,
            name,
            organizationName: storeName || `${name}'s Kitchen`,
            phone,
          },
          { skipAuth: true, skipStoreHeader: true }
        );
      } catch {
        // Fallback to direct Supabase signup below if backend signup fails
      }

      if (backendSignupRes?.accessToken && backendSignupRes.accessToken !== 'initial-signup-token') {
        setAuthToken(backendSignupRes.accessToken);
        if (backendSignupRes.refreshToken) {
          await supabase.auth
            .setSession({
              access_token: backendSignupRes.accessToken,
              refresh_token: backendSignupRes.refreshToken,
            })
            .catch(() => {});
        }
        const bpUser = backendSignupRes.user || {};
        const newUser = this.mapSupabaseUserToAuthUser(
          { id: bpUser.id || `usr-${Date.now()}`, email: cleanEmail },
          {
            name,
            storeId: bpUser.defaultStoreId || bpUser.assignedStoreIds?.[0],
            storeName: storeName || `${name}'s Kitchen`,
            phone,
            role,
          }
        );
        this.currentUser = newUser;
        return { user: newUser, emailNeedsVerification: false };
      }

      const redirectUrl = getAuthRedirectUrl('auth/callback');
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name,
            store_name: storeName || `${name}'s Kitchen`,
            phone,
            role,
          },
        },
      });

      if (authError) {
        throw formatAuthError(authError);
      }

      if (!authData.user) {
        throw new Error('Registration failed: User creation failed on Supabase');
      }

      const emailNeedsVerification = !authData.user.email_confirmed_at && !authData.session;
      if (authData.session?.access_token) {
        setAuthToken(authData.session.access_token);
      }

      const newUser = this.mapSupabaseUserToAuthUser(authData.user, {
        name,
        storeName: storeName || `${name}'s Kitchen`,
        phone,
        role,
      });

      this.currentUser = newUser;
      return { user: newUser, emailNeedsVerification };
    } catch (err: any) {
      if (apiClient.isFallbackEnabled()) {
        const mockNewUser: AuthUser = {
          id: `usr-mock-${Date.now()}`,
          name: name || 'Demo Admin',
          email: email.trim().toLowerCase(),
          phone: phone || '+49 30 1234 5678',
          avatarText: this.extractInitials(name || email),
          role,
          storeId: `store-mock-${Date.now()}`,
          storeName: storeName || `${name}'s Kitchen`,
          status: 'active',
          lastActive: 'Just now',
        };
        logDebugFallback('authService.register', 'networkFallback [MOCK]', { email, user: mockNewUser });
        this.currentUser = mockNewUser;
        return { user: mockNewUser, emailNeedsVerification: false };
      }
      throw formatAuthError(err);
    }
  }

  async registerRestaurant(payload: RestaurantRegistrationPayload): Promise<RegisterResult> {
    try {
      if (payload.language) {
        i18n.setLanguageFromCodeOrLabel(payload.language);
      }
      const cleanEmail = payload.adminEmail.trim().toLowerCase();

      // 1. Register user, organization, store, and invited members via backend Admin API first
      let backendSignupRes: any = null;
      try {
        backendSignupRes = await apiClient.post(
          '/auth/signup',
          {
            email: cleanEmail,
            password: payload.adminPassword,
            name: payload.adminName,
            organizationName: payload.storeName,
            phone: payload.adminPhone,
            country: payload.country,
            currency: payload.currency,
            language: payload.language,
            timezone: payload.timezone,
            countSchedule: payload.countSchedule,
            invitedMembers: payload.invitedMembers,
          },
          { skipAuth: true, skipStoreHeader: true }
        );
      } catch (backendErr) {
        console.warn('Backend onboarding sync note:', backendErr);
      }

      if (backendSignupRes?.accessToken && backendSignupRes.accessToken !== 'initial-signup-token') {
        setAuthToken(backendSignupRes.accessToken);
        if (backendSignupRes.refreshToken) {
          await supabase.auth
            .setSession({
              access_token: backendSignupRes.accessToken,
              refresh_token: backendSignupRes.refreshToken,
            })
            .catch(() => {});
        }
        const bpUser = backendSignupRes.user || {};
        const newUser = this.mapSupabaseUserToAuthUser(
          { id: bpUser.id || `usr-${Date.now()}`, email: cleanEmail },
          {
            name: payload.adminName,
            storeId: bpUser.defaultStoreId || bpUser.assignedStoreIds?.[0],
            storeName: payload.storeName,
            phone: payload.adminPhone,
            role: 'admin',
          }
        );
        this.currentUser = newUser;
        return { user: newUser, emailNeedsVerification: false };
      }

      // 2. Fallback to direct Supabase Auth signUp if backend signup was unreachable
      const redirectUrl = getAuthRedirectUrl('auth/callback');
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: cleanEmail,
        password: payload.adminPassword,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name: payload.adminName,
            store_name: payload.storeName,
            phone: payload.adminPhone,
            role: 'admin',
          },
        },
      });

      if (authError) {
        throw formatAuthError(authError);
      }

      if (!authData?.user) {
        throw new Error('Registration failed: User creation failed on Supabase');
      }

      if (authData.session?.access_token) {
        setAuthToken(authData.session.access_token);
      }

      const emailNeedsVerification = !authData.user.email_confirmed_at && !authData.session;
      const newUser = this.mapSupabaseUserToAuthUser(authData.user, {
        name: payload.adminName,
        storeName: payload.storeName,
        phone: payload.adminPhone,
        role: 'admin',
      });

      this.currentUser = newUser;
      return { user: newUser, emailNeedsVerification };
    } catch (err: any) {
      if (apiClient.isFallbackEnabled()) {
        const mockNewUser: AuthUser = {
          id: `usr-mock-${Date.now()}`,
          name: payload.adminName || 'Demo Admin',
          email: payload.adminEmail.trim().toLowerCase(),
          phone: payload.adminPhone || '+49 30 1234 5678',
          avatarText: this.extractInitials(payload.adminName || payload.adminEmail),
          role: 'admin',
          storeId: `store-mock-${Date.now()}`,
          storeName: payload.storeName || `${payload.adminName}'s Kitchen`,
          status: 'active',
          lastActive: 'Just now',
        };
        logDebugFallback('authService.registerRestaurant', 'networkFallback [MOCK]', { email: payload.adminEmail, user: mockNewUser });
        this.currentUser = mockNewUser;
        return { user: mockNewUser, emailNeedsVerification: false };
      }
      throw formatAuthError(err);
    }
  }

  async logout(): Promise<void> {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      // safe cleanup
    } finally {
      setAuthToken(null);
      this.currentUser = null;
    }
  }

  async resetPassword(email: string): Promise<void> {
    const redirectUrl = getAuthRedirectUrl('reset-password');
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: redirectUrl,
    });
    if (error) {
      throw formatAuthError(error);
    }
  }

  async updatePassword(newPassword: string): Promise<void> {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) {
      throw formatAuthError(error);
    }
  }

  async resendVerificationEmail(email: string): Promise<void> {
    const cleanEmail = email.trim().toLowerCase();
    const redirectUrl = getAuthRedirectUrl('auth/callback');
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: cleanEmail,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });
    if (error) {
      // If Supabase free-tier SMTP rate-limits outgoing email, verify via backend Admin API
      try {
        await apiClient.post(
          '/auth/verify-email',
          { email: cleanEmail },
          { skipAuth: true, skipStoreHeader: true }
        );
        return;
      } catch {
        throw formatAuthError(error);
      }
    }
  }

  /**
   * Process deep link callback URLs (e.g. stockpulse://auth/callback#access_token=... or ?code=...)
   */
  async handleAuthCallback(url: string): Promise<{ session: any; user: AuthUser | null; type?: string }> {
    try {
      const parsed = Linking.parse(url);
      const queryParams = parsed.queryParams || {};
      const code = queryParams.code as string | undefined;
      const type = (queryParams.type as string) || 'signup';

      if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) throw error;
        if (data.session) {
          setAuthToken(data.session.access_token);
          const currentUser = await this.getCurrentUser();
          this.currentUser = currentUser;
          return { session: data.session, user: currentUser, type };
        }
      }

      // Check for hash parameters in URL fragment
      let accessToken = queryParams.access_token as string | undefined;
      let refreshToken = queryParams.refresh_token as string | undefined;

      if (!accessToken && url.includes('#')) {
        const hash = url.split('#')[1];
        const hashParams = new URLSearchParams(hash);
        accessToken = hashParams.get('access_token') || undefined;
        refreshToken = hashParams.get('refresh_token') || undefined;
      }

      if (accessToken && refreshToken) {
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (error) throw error;
        if (data.session) {
          setAuthToken(data.session.access_token);
          const currentUser = await this.getCurrentUser();
          this.currentUser = currentUser;
          return { session: data.session, user: currentUser, type };
        }
      }

      // Fallback to active session
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session) {
        setAuthToken(sessionData.session.access_token);
        const currentUser = await this.getCurrentUser();
        this.currentUser = currentUser;
        return { session: sessionData.session, user: currentUser, type };
      }

      throw new Error('No authentication tokens found in callback URL');
    } catch (err: any) {
      logDebugFallback('AuthService', 'handleAuthCallback', err);
      throw err;
    }
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    if (this.currentUser) {
      return this.currentUser;
    }
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session?.user) {
        return null;
      }

      setAuthToken(sessionData.session.access_token);

      // Fetch fresh profile from backend
      try {
        const backendProfile = await apiClient.get<any>('/auth/me', { skipStoreHeader: true });
        const user: AuthUser = {
          id: backendProfile.id || sessionData.session.user.id,
          name: backendProfile.name || sessionData.session.user.user_metadata?.name || 'User',
          email: backendProfile.email || sessionData.session.user.email || '',
          phone: backendProfile.phone || sessionData.session.user.user_metadata?.phone,
          avatarText: this.extractInitials(backendProfile.name || 'User'),
          role: (backendProfile.role as UserRole) || 'staff',
          storeId:
            backendProfile.defaultStoreId ||
            backendProfile.assignedStoreIds?.[0] ||
            '01915dfa-9012-7000-8000-000000000002',
          storeName: backendProfile.storeName || 'StockPulse Store',
          status: 'active',
          lastActive: 'Just now',
        };
        this.currentUser = user;
        return user;
      } catch (err) {
        const fallback = this.mapSupabaseUserToAuthUser(sessionData.session.user);
        this.currentUser = fallback;
        return fallback;
      }
    } catch (err) {
      logDebugFallback('AuthService', 'getCurrentUser', err);
      return null;
    }
  }

  async restoreSession(): Promise<AuthUser | null> {
    return this.getCurrentUser();
  }

  async switchUserRole(role: UserRole): Promise<AuthUser> {
    try {
      const res = await apiClient.post<{ token: string; user: AuthUser }>('/auth/switch-role', {
        role,
      });
      if (res.token) setAuthToken(res.token);
      if (res.user) this.currentUser = res.user;
      return this.currentUser || MOCK_USERS[role];
    } catch (err) {
      logDebugFallback('AuthService', '/auth/switch-role', err);
      const mock = MOCK_USERS[role] ?? MOCK_USERS.admin;
      this.currentUser = { ...mock };
      return { ...this.currentUser };
    }
  }

  hasPermission(role: UserRole, permission: Permission): boolean {
    const roleDef = ROLES[role];
    if (!roleDef) return false;
    return roleDef.permissions.includes(permission);
  }

  async getTeamMembers(): Promise<AuthUser[]> {
    try {
      const res = await apiClient.get<any>('/users');
      const list = Array.isArray(res) ? res : Array.isArray((res as any)?.items) ? (res as any).items : (res as any)?.data || [];
      if (list.length > 0) {
        return list.map((u: any) => ({
          id: u.id,
          name: u.name || u.email?.split('@')[0] || 'User',
          email: u.email,
          phone: u.phone,
          avatarText: this.extractInitials(u.name || u.email || 'US'),
          role: (u.role || 'staff') as UserRole,
          storeId: u.assignedStoreIds?.[0] || u.storeId || '01915dfa-9012-7000-8000-000000000002',
          storeName: u.storeName || 'Bella Cucina Restaurant',
          status: u.isActive === false ? 'inactive' : 'active',
          lastActive: 'Active',
        }));
      }
      return this.teamMembers;
    } catch (err) {
      logDebugFallback('AuthService', '/users', err);
      return this.teamMembers;
    }
  }

  async getMemberById(id: string): Promise<AuthUser | null> {
    try {
      const u = await apiClient.get<any>(`/users/${id}`);
      if (!u) return this.teamMembers.find((m) => m.id === id) || null;
      return {
        id: u.id,
        name: u.name || u.email?.split('@')[0] || 'User',
        email: u.email,
        phone: u.phone,
        avatarText: this.extractInitials(u.name || u.email || 'US'),
        role: (u.role || 'staff') as UserRole,
        storeId: u.assignedStoreIds?.[0] || u.storeId || '01915dfa-9012-7000-8000-000000000002',
        storeName: u.storeName || 'Bella Cucina Restaurant',
        status: u.isActive === false ? 'inactive' : 'active',
        lastActive: 'Active',
      };
    } catch (err) {
      logDebugFallback('AuthService', `/users/${id}`, err);
      return this.teamMembers.find((m) => m.id === id) || null;
    }
  }

  async updateMemberRole(id: string, role: UserRole): Promise<AuthUser> {
    try {
      const res = await apiClient.patch<any>(`/users/${id}`, { role });
      return {
        id: res.id || id,
        name: res.name || 'User',
        email: res.email || '',
        phone: res.phone,
        avatarText: this.extractInitials(res.name || 'US'),
        role: (res.role || role) as UserRole,
        storeId: res.assignedStoreIds?.[0] || '01915dfa-9012-7000-8000-000000000002',
        storeName: 'Bella Cucina Restaurant',
        status: 'active',
        lastActive: 'Active',
      };
    } catch (err) {
      logDebugFallback('AuthService', `/users/${id} [PATCH]`, err);
      const target = this.teamMembers.find((m) => m.id === id);
      if (target) {
        target.role = role;
        return { ...target };
      }
      return { ...this.teamMembers[0], id, role };
    }
  }

  async inviteMember(name: string, email: string, role: UserRole, phone?: string): Promise<AuthUser> {
    const storeId = this.currentUser?.storeId || '01915dfa-9012-7000-8000-000000000002';
    try {
      try {
        const inviteRes = await apiClient.post<any>(`/stores/${storeId}/invitations`, {
          email,
          role,
          name,
          phone,
          expiresInDays: 7,
        });

        return {
          id: inviteRes.id,
          name: name || inviteRes.email,
          email: inviteRes.email,
          phone,
          avatarText: this.extractInitials(name || 'US'),
          role,
          storeId,
          storeName: inviteRes.storeName || this.currentUser?.storeName || 'Store',
          status: 'active',
          lastActive: 'Invited (Pending)',
        };
      } catch (invErr) {
        const res = await apiClient.post<any>('/users', {
          name,
          email,
          role,
          organizationId: '01915dfa-9012-7000-8000-000000000001',
          assignedStoreIds: [storeId],
        });
        return {
          id: res.id,
          name: res.name,
          email: res.email,
          phone,
          avatarText: this.extractInitials(name),
          role,
          storeId,
          storeName: this.currentUser?.storeName || 'Store',
          status: 'active',
          lastActive: 'Invited',
        };
      }
    } catch (err) {
      logDebugFallback('AuthService', `/stores/${storeId}/invitations [POST]`, err);
      const newMember: AuthUser = {
        id: `usr-${Date.now().toString().slice(-4)}`,
        name,
        email,
        phone,
        avatarText: this.extractInitials(name),
        role,
        storeId,
        storeName: this.currentUser?.storeName || 'Bella Cucina Restaurant',
        status: 'active',
        lastActive: 'Invited',
      };
      this.teamMembers.push(newMember);
      return newMember;
    }
  }

  async removeMember(id: string): Promise<boolean> {
    try {
      const res = await apiClient.del<{ success: boolean }>(`/users/${id}`);
      return res.success !== false;
    } catch (err) {
      logDebugFallback('AuthService', `/users/${id} [DELETE]`, err);
      this.teamMembers = this.teamMembers.filter((m) => m.id !== id);
      return true;
    }
  }

  private mapSupabaseUserToAuthUser(
    supabaseUser: any,
    overrides?: Partial<AuthUser>
  ): AuthUser {
    const meta = supabaseUser.user_metadata || {};
    const name = overrides?.name || meta.name || supabaseUser.email?.split('@')[0] || 'User';
    const initials = this.extractInitials(name);

    return {
      id: supabaseUser.id,
      name,
      email: supabaseUser.email || overrides?.email || '',
      phone: overrides?.phone || meta.phone,
      avatarText: initials,
      role: (overrides?.role || meta.role || 'staff') as UserRole,
      storeId:
        overrides?.storeId ||
        meta.assigned_store_ids?.[0] ||
        meta.store_id ||
        '01915dfa-9012-7000-8000-000000000002',
      storeName: overrides?.storeName || meta.store_name || 'Bella Cucina Restaurant',
      status: overrides?.status || 'active',
      lastActive: 'Just now',
    };
  }

  private extractInitials(name: string): string {
    return (
      name
        .split(' ')
        .filter(Boolean)
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || 'SP'
    );
  }
}

export const authService: IAuthService = new RealAuthService();
