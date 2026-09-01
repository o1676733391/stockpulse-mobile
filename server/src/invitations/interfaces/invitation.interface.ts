export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'REVOKED';

export interface StoreInvitationEntity {
  id: string;
  store_id: string;
  organization_id: string;
  email: string;
  role_id: string;
  token_hash: string;
  invitation_code: string;
  status: InvitationStatus;
  expires_at: string;
  created_by: string;
  accepted_by?: string | null;
  accepted_at?: string | null;
  revoked_at?: string | null;
  revoked_by?: string | null;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}
