import { UserRole } from './rbac';

export type OnboardingState =
  | 'NEW_USER'
  | 'AUTHENTICATED_NO_STORE'
  | 'INVITATION_PENDING'
  | 'INVITATION_ACCEPTED'
  | 'STORE_OWNER'
  | 'STORE_MEMBER'
  | 'REMOVED_FROM_STORE';

export type OnboardingEvent =
  | 'REGISTER'
  | 'LOGIN_WITHOUT_STORE'
  | 'LOGIN_WITH_STORE'
  | 'RECEIVE_INVITATION'
  | 'CREATE_STORE'
  | 'JOIN_STORE_ACCEPT'
  | 'SKIP_STORE_SELECTION'
  | 'REMOVE_MEMBER'
  | 'RE_INVITE';

export interface UserStoreState {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  storeId: string | null;
  storeName?: string;
  organizationId: string | null;
  state: OnboardingState;
  assignedStoreIds: string[];
}
