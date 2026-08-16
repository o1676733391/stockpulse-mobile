import { ROLES } from '@/constants/rbac';
import { AuthUser, Permission, UserRole } from '@/types/rbac';

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
  getCurrentUser(): Promise<AuthUser>;
  switchUserRole(role: UserRole): Promise<AuthUser>;
  hasPermission(role: UserRole, permission: Permission): boolean;
  getTeamMembers(): Promise<AuthUser[]>;
  getMemberById(id: string): Promise<AuthUser | null>;
  updateMemberRole(id: string, role: UserRole): Promise<AuthUser>;
  inviteMember(name: string, email: string, role: UserRole): Promise<AuthUser>;
}

export class MockAuthService implements IAuthService {
  private currentUser: AuthUser = { ...MOCK_USERS.admin };
  private teamMembers: AuthUser[] = JSON.parse(JSON.stringify(INITIAL_TEAM_MEMBERS));

  async getCurrentUser(): Promise<AuthUser> {
    return { ...this.currentUser };
  }

  async switchUserRole(role: UserRole): Promise<AuthUser> {
    const mock = MOCK_USERS[role] ?? MOCK_USERS.admin;
    this.currentUser = { ...mock };
    return { ...this.currentUser };
  }

  hasPermission(role: UserRole, permission: Permission): boolean {
    const roleDef = ROLES[role];
    if (!roleDef) return false;
    return roleDef.permissions.includes(permission);
  }

  async getTeamMembers(): Promise<AuthUser[]> {
    return JSON.parse(JSON.stringify(this.teamMembers));
  }

  async getMemberById(id: string): Promise<AuthUser | null> {
    const found = this.teamMembers.find((m) => m.id === id);
    return found ? { ...found } : null;
  }

  async updateMemberRole(id: string, role: UserRole): Promise<AuthUser> {
    const found = this.teamMembers.find((m) => m.id === id);
    if (!found) throw new Error('Member not found');
    found.role = role;
    if (this.currentUser.id === id) {
      this.currentUser.role = role;
    }
    return { ...found };
  }

  async inviteMember(name: string, email: string, role: UserRole): Promise<AuthUser> {
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

export const authService: IAuthService = new MockAuthService();
