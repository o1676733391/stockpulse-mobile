import {
  AcceptInvitationPayload,
  AcceptInvitationResult,
  CreateInvitationPayload,
  StoreInvitation,
  VerifyInvitationResult,
} from '@/types/invitation';
import { apiClient, logDebugFallback } from './apiClient';

export interface IInvitationService {
  createInvitation(
    storeId: string,
    payload: CreateInvitationPayload,
  ): Promise<StoreInvitation & { rawToken: string }>;
  getStoreInvitations(storeId: string): Promise<StoreInvitation[]>;
  revokeInvitation(storeId: string, invitationId: string): Promise<{ success: boolean; message: string }>;
  resendInvitation(
    storeId: string,
    invitationId: string,
    expiresInDays?: number,
  ): Promise<StoreInvitation & { rawToken: string }>;
  validateInvitation(codeOrToken: string): Promise<VerifyInvitationResult>;
  verifyInvitation(codeOrToken: string): Promise<VerifyInvitationResult>;
  acceptInvitation(
    codeOrToken: string,
    payload?: AcceptInvitationPayload,
  ): Promise<AcceptInvitationResult>;
}

export class RealInvitationService implements IInvitationService {
  async createInvitation(
    storeId: string,
    payload: CreateInvitationPayload,
  ): Promise<StoreInvitation & { rawToken: string }> {
    try {
      return await apiClient.post<StoreInvitation & { rawToken: string }>(
        `/stores/${storeId}/invitations`,
        payload,
      );
    } catch (err) {
      logDebugFallback('InvitationService', `/stores/${storeId}/invitations [POST]`, err);
      throw err;
    }
  }

  async getStoreInvitations(storeId: string): Promise<StoreInvitation[]> {
    try {
      const res = await apiClient.get<any>(`/stores/${storeId}/invitations`);
      return Array.isArray(res) ? res : Array.isArray(res?.items) ? res.items : Array.isArray(res?.data) ? res.data : [];
    } catch (err) {
      logDebugFallback('InvitationService', `/stores/${storeId}/invitations [GET]`, err);
      throw err;
    }
  }

  async resendInvitation(
    storeId: string,
    invitationId: string,
    expiresInDays: number = 7,
  ): Promise<StoreInvitation & { rawToken: string }> {
    try {
      return await apiClient.post<StoreInvitation & { rawToken: string }>(
        `/stores/${storeId}/invitations/${invitationId}/resend`,
        { expiresInDays },
      );
    } catch (err) {
      logDebugFallback(
        'InvitationService',
        `/stores/${storeId}/invitations/${invitationId}/resend [POST]`,
        err,
      );
      throw err;
    }
  }

  async revokeInvitation(
    storeId: string,
    invitationId: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      return await apiClient.del<{ success: boolean; message: string }>(
        `/stores/${storeId}/invitations/${invitationId}`,
      );
    } catch (err) {
      logDebugFallback(
        'InvitationService',
        `/stores/${storeId}/invitations/${invitationId} [DELETE]`,
        err,
      );
      throw err;
    }
  }

  async validateInvitation(codeOrToken: string): Promise<VerifyInvitationResult> {
    const cleanKey = codeOrToken.trim();
    try {
      return await apiClient.post<VerifyInvitationResult>('/invitations/validate', {
        codeOrToken: cleanKey,
      });
    } catch (err: any) {
      // If POST not found, try GET parameter
      try {
        return await apiClient.get<VerifyInvitationResult>(`/invitations/validate/${encodeURIComponent(cleanKey)}`);
      } catch (innerErr) {
        logDebugFallback('InvitationService', `/invitations/validate/${cleanKey}`, err);
        throw err;
      }
    }
  }

  async verifyInvitation(token: string): Promise<VerifyInvitationResult> {
    return this.validateInvitation(token);
  }

  async acceptInvitation(
    codeOrToken: string,
    payload?: AcceptInvitationPayload,
  ): Promise<{ success: boolean; storeId: string; role: string; message: string }> {
    try {
      return await apiClient.post<{ success: boolean; storeId: string; role: string; message: string }>(
        '/invitations/accept',
        {
          codeOrToken: codeOrToken.trim(),
          name: payload?.name,
          phone: payload?.phone,
        },
      );
    } catch (err) {
      logDebugFallback('InvitationService', '/invitations/accept [POST]', err);
      throw err;
    }
  }
}

export const invitationService: IInvitationService = new RealInvitationService();
