import { ROLES } from '@/constants/rbac';
import { AuthUser, Permission, UserRole } from '@/types/rbac';
import { apiClient, getAuthToken, logDebugFallback, setAuthToken } from './apiClient';

export const MOCK_USERS: Record<UserRole, AuthUser> = {
  admin: {
    id: 'u1',
    name: 'Anna Schmidt',
    email: 'anna.admin@restaurant.de',
    phone: '+49 30 9876 5432',
    avatarText: 'AS',
    role: 'admin',
    storeId: 'store-1',
    storeName: 'Bella Cucina Restaurant',
    status: 'active',
    lastActive: 'Just now',
  },
  manager: {
    id: 'u2',
    name: 'Marco Rossi',
    email: 'marco.manager@restaurant.de',
    phone: '+49 30 8765 4321',
    avatarText: 'MR',
    role: 'manager',
    storeId: 'store-1',
    storeName: 'Bella Cucina Restaurant',
    status: 'active',
    lastActive: '5m ago',
  },
  supervisor: {
    id: 'u3',
    name: 'David Weber',
    email: 'david.lead@restaurant.de',
    phone: '+49 30 7654 3210',
    avatarText: 'DW',
    role: 'supervisor',
    storeId: 'store-1',
    storeName: 'Bella Cucina Restaurant',
    status: 'active',
    lastActive: '12m ago',
  },
  staff: {
    id: 'u4',
    name: 'Elena Fischer',
    email: 'elena.cook@restaurant.de',
    phone: '+49 30 6543 2109',
    avatarText: 'EF',
    role: 'staff',
    storeId: 'store-1',
    storeName: 'Bella Cucina Restaurant',
    status: 'active',
    lastActive: '2h ago',
  },
  auditor: {
    id: 'u5',
    name: 'Dr. Klaus Becker',
    email: 'klaus.auditor@becker-consult.de',
    phone: '+49 30 5432 1098',
    avatarText: 'KB',
    role: 'auditor',
    storeId: 'store-1',
    storeName: 'Bella Cucina Restaurant',
    status: 'active',
    lastActive: 'Yesterday',
  },
};

export const INITIAL_TEAM_MEMBERS: AuthUser[] = [
  MOCK_USERS.admin,
  MOCK_USERS.manager,
  MOCK_USERS.supervisor,
  MOCK_USERS.staff,
  MOCK_USERS.auditor,
  {
    id: 'u6',
    name: 'Sophie Wagner',
    email: 'sophie.barista@restaurant.de',
    phone: '+49 30 4321 0987',
    avatarText: 'SW',
    role: 'staff',
    storeId: 'store-1',
    storeName: 'Bella Cucina Restaurant',
    status: 'active',
    lastActive: '1h ago',
  },
  {
    id: 'u7',
    name: 'Lukas Bauer',
    email: 'lukas.prep@restaurant.de',
    phone: '+49 30 3210 9876',
    avatarText: 'LB',
    role: 'staff',
    storeId: 'store-1',
    storeName: 'Bella Cucina Restaurant',
    status: 'inactive',
    lastActive: '4 days ago',
  },
];

export interface IAuthService {
  login(email: string, password?: string): Promise<AuthUser>;
  register(name: string, email: string, password: string, storeName?: string, phone?: string, role?: UserRole): Promise<AuthUser>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<AuthUser>;
  switchUserRole(role: UserRole): Promise<AuthUser>;
  hasPermission(role: UserRole, permission: Permission): boolean;
  getTeamMembers(): Promise<AuthUser[]>;
  getMemberById(id: string): Promise<AuthUser | null>;
  updateMemberRole(id: string, role: UserRole): Promise<AuthUser>;
  inviteMember(name: string, email: string, role: UserRole, phone?: string): Promise<AuthUser>;
}

export class RealAuthService implements IAuthService {
  private currentUser: AuthUser = { ...MOCK_USERS.admin };
  private teamMembers: AuthUser[] = JSON.parse(JSON.stringify(INITIAL_TEAM_MEMBERS));

  async login(email: string, password: string = 'StockPulse123!'): Promise<AuthUser> {
    try {
      const res = await apiClient.post<{ token: string; user: AuthUser }>('/auth/login', {
        email,
        password,
      }, { skipAuth: true });

      setAuthToken(res.token);
      this.currentUser = res.user;
      return res.user;
    } catch (err) {
      logDebugFallback('AuthService', '/auth/login', err);
      // Auto-fallback to matching mock user
      const found = Object.values(MOCK_USERS).find((u) => u.email === email) || MOCK_USERS.admin;
      this.currentUser = { ...found };
      return this.currentUser;
    }
  }

  async register(
    name: string,
    email: string,
    password: string,
    storeName?: string,
    phone?: string,
    role: UserRole = 'admin'
  ): Promise<AuthUser> {
    try {
      const res = await apiClient.post<{ token: string; user: AuthUser }>('/auth/register', {
        name,
        email,
        password,
        storeName,
        phone,
        role,
      }, { skipAuth: true });

      setAuthToken(res.token);
      this.currentUser = res.user;
      return res.user;
    } catch (err) {
      logDebugFallback('AuthService', '/auth/register', err);
      const initials = name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2) || 'U';

      const newUser: AuthUser = {
        id: `u-${Date.now()}`,
        name,
        email,
        phone,
        avatarText: initials,
        role,
        storeId: `store-${Date.now()}`,
        storeName: storeName || `${name}'s Kitchen`,
        status: 'active',
        lastActive: 'Just now',
      };
      this.currentUser = newUser;
      return newUser;
    }
  }

  async logout(): Promise<void> {
    setAuthToken(null);
  }

  async getCurrentUser(): Promise<AuthUser> {
    try {
      if (!getAuthToken()) {
        await this.login('anna.admin@restaurant.de', 'StockPulse123!');
      }
      const res = await apiClient.get<{ user: AuthUser }>('/auth/me');
      this.currentUser = res.user;
      return res.user;
    } catch (err) {
      logDebugFallback('AuthService', '/auth/me', err);
      return { ...this.currentUser };
    }
  }

  async switchUserRole(role: UserRole): Promise<AuthUser> {
    try {
      const res = await apiClient.post<{ token: string; user: AuthUser }>('/auth/switch-role', {
        role,
      });
      setAuthToken(res.token);
      this.currentUser = res.user;
      return res.user;
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
      const res = await apiClient.get<AuthUser[]>('/team/members');
      this.teamMembers = res;
      return res;
    } catch (err) {
      logDebugFallback('AuthService', '/team/members', err);
      return JSON.parse(JSON.stringify(this.teamMembers));
    }
  }

  async getMemberById(id: string): Promise<AuthUser | null> {
    try {
      const members = await this.getTeamMembers();
      return members.find((m) => m.id === id) || null;
    } catch (err) {
      logDebugFallback('AuthService', `/team/members/${id}`, err);
      const found = this.teamMembers.find((m) => m.id === id);
      return found ? { ...found } : null;
    }
  }

  async updateMemberRole(id: string, role: UserRole): Promise<AuthUser> {
    try {
      const res = await apiClient.patch<AuthUser>(`/team/members/${id}/role`, { role });
      const found = this.teamMembers.find((m) => m.id === id);
      if (found) found.role = role;
      if (this.currentUser.id === id) this.currentUser.role = role;
      return res;
    } catch (err) {
      logDebugFallback('AuthService', `/team/members/${id}/role`, err);
      const found = this.teamMembers.find((m) => m.id === id);
      if (!found) throw new Error('Member not found');
      found.role = role;
      if (this.currentUser.id === id) this.currentUser.role = role;
      return { ...found };
    }
  }

  async inviteMember(name: string, email: string, role: UserRole, phone?: string): Promise<AuthUser> {
    try {
      const res = await apiClient.post<AuthUser>('/team/invite', {
        name,
        email,
        role,
        phone,
      });
      this.teamMembers.push(res);
      return res;
    } catch (err) {
      logDebugFallback('AuthService', '/team/invite', err);
      const initials = name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

      const newMember: AuthUser = {
        id: `u-${Date.now()}`,
        name,
        email,
        phone,
        avatarText: initials || 'TU',
        role,
        storeId: this.currentUser.storeId,
        storeName: this.currentUser.storeName,
        status: 'active',
        lastActive: 'Invited',
      };

      this.teamMembers.push(newMember);
      return { ...newMember };
    }
  }
}

export const authService: IAuthService = new RealAuthService();
