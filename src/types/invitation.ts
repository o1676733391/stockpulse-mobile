import { UserRole } from './rbac';

export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';

export interface StoreInvitation {
  id: string;
  storeId: string;
  storeName?: string;
  organizationId: string;
  email: string;
  role: UserRole;
  invitationCode: string;
  status: InvitationStatus;
  expiresAt: string;
  createdBy: string;
  createdByName?: string;
  acceptedBy?: string;
  acceptedAt?: string;
  revokedAt?: string;
  inviteUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateInvitationPayload {
  email: string;
  role: UserRole;
  name?: string;
  phone?: string;
  expiresInDays?: number;
}

export interface AcceptInvitationPayload {
  name?: string;
  password?: string;
  phone?: string;
}

export interface VerifyInvitationResult {
  valid: boolean;
  storeId: string;
  storeName: string;
  email: string;
  role: UserRole;
  invitationCode: string;
  expiresAt: string;
}

export interface AcceptInvitationResult {
  success: boolean;
  storeId: string;
  storeName?: string;
  role: string;
  message: string;
}
