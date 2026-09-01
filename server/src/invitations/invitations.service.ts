import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import {
  AcceptInvitationDto,
  AcceptInvitationResponseDto,
  CreateInvitationDto,
  InvitationResponseDto,
  ResendInvitationDto,
  VerifyInvitationResponseDto,
} from './dto/invitation.dto';
import { InvitationRateLimiterService } from './invitation-rate-limiter.service';
import { InvitationsRepository } from './invitations.repository';

@Injectable()
export class InvitationsService {
  private readonly logger = new Logger(InvitationsService.name);

  constructor(
    private readonly invitationsRepository: InvitationsRepository,
    private readonly rateLimiter: InvitationRateLimiterService,
  ) {}

  /**
   * 1. Create a new store invitation (Admin capability)
   * Enforces Store boundary, single store ownership, email binding, and crypto hashing.
   */
  async createInvitation(
    storeId: string,
    dto: CreateInvitationDto,
    creatorUserId: string,
  ): Promise<InvitationResponseDto & { rawToken: string }> {
    const store = await this.invitationsRepository.getStoreById(storeId);
    if (!store) {
      throw new NotFoundException(`Store with ID '${storeId}' not found`);
    }

    const email = dto.email.toLowerCase().trim();

    // Check if user is already assigned to this store with an active role
    const existingUser = await this.invitationsRepository.getUserByEmail(email);
    if (existingUser) {
      const existingAssignment = await this.invitationsRepository.getUserStoreAssignment(
        existingUser.id,
        storeId,
      );
      if (existingAssignment) {
        throw new ConflictException(
          `User with email '${email}' is already an active member of this store`,
        );
      }
    }

    // Check if there is already an active pending invitation for this store & email
    const existingPending = await this.invitationsRepository.findPendingByStoreAndEmail(
      storeId,
      email,
    );
    if (existingPending) {
      throw new ConflictException(
        `An active pending invitation for '${email}' already exists in this store. Use resend to issue a new code.`,
      );
    }

    const roleName = dto.role.toLowerCase().trim();
    const role = await this.invitationsRepository.getRoleByName(roleName);
    if (!role) {
      throw new BadRequestException(
        `Invalid role '${dto.role}'. Valid roles are: manager, supervisor, staff, auditor`,
      );
    }

    // High-entropy 256-bit cryptographically secure token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

    // Human-friendly short code (e.g. INV-A9B8C7)
    const codeSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
    const invitationCode = `INV-${codeSuffix}`;

    const expiresInDays = dto.expiresInDays || 7;
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString();

    const created = await this.invitationsRepository.create({
      store_id: storeId,
      organization_id: store.organization_id,
      email,
      role_id: role.id,
      token_hash: tokenHash,
      invitation_code: invitationCode,
      status: 'PENDING',
      expires_at: expiresAt,
      created_by: creatorUserId,
      metadata: {
        intendedName: dto.name || undefined,
        phone: dto.phone || undefined,
      },
    });

    this.logger.log(
      `Invitation ${created.id} created for ${email} (${role.name}) in store ${storeId} by ${creatorUserId}`,
    );

    return {
      id: created.id,
      storeId: created.store_id,
      storeName: store.name,
      organizationId: created.organization_id,
      email: created.email,
      role: role.name,
      invitationCode: created.invitation_code,
      status: created.status,
      expiresAt: created.expires_at,
      createdBy: created.created_by,
      rawToken,
      inviteUrl: `https://app.stockpulse.io/invite?code=${created.invitation_code}&token=${rawToken}`,
      createdAt: created.created_at,
      updatedAt: created.updated_at,
    };
  }

  /**
   * 2. List all invitations for a store (Admin capability)
   */
  async getStoreInvitations(storeId: string): Promise<InvitationResponseDto[]> {
    const rawList = await this.invitationsRepository.findByStoreId(storeId);
    const now = new Date();

    return rawList.map((item) => {
      let status = item.status;
      if (status === 'PENDING' && new Date(item.expires_at) < now) {
        status = 'EXPIRED';
      }

      return {
        id: item.id,
        storeId: item.store_id,
        storeName: item.stores?.name,
        organizationId: item.organization_id,
        email: item.email,
        role: item.roles?.name || 'staff',
        invitationCode: item.invitation_code,
        status,
        expiresAt: item.expires_at,
        createdBy: item.created_by,
        createdByName: item.creator?.name || item.creator?.email,
        acceptedBy: item.accepted_by,
        acceptedAt: item.accepted_at,
        revokedAt: item.revoked_at,
        inviteUrl: `https://app.stockpulse.io/invite?code=${item.invitation_code}`,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
      };
    });
  }

  /**
   * 3. Resend an invitation (Admin capability)
   * Regenerates tokens, refreshes expiry window, and returns new secure credentials.
   */
  async resendInvitation(
    storeId: string,
    invitationId: string,
    dto: ResendInvitationDto,
    requestingUserId: string,
  ): Promise<InvitationResponseDto & { rawToken: string }> {
    const invitation = await this.invitationsRepository.findById(invitationId);
    if (!invitation || invitation.store_id !== storeId) {
      throw new NotFoundException(`Invitation '${invitationId}' not found for store '${storeId}'`);
    }

    if (invitation.status === 'ACCEPTED') {
      throw new BadRequestException('Cannot resend an invitation that has already been accepted');
    }

    const store = await this.invitationsRepository.getStoreById(storeId);
    const role = await this.invitationsRepository.getRoleByName(invitation.role_id) || { name: 'staff' };

    // Generate fresh cryptographic token and code
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const codeSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
    const invitationCode = `INV-${codeSuffix}`;

    const expiresInDays = dto.expiresInDays || 7;
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString();

    const updated = await this.invitationsRepository.update(invitationId, {
      token_hash: tokenHash,
      invitation_code: invitationCode,
      status: 'PENDING',
      expires_at: expiresAt,
      revoked_at: null,
      revoked_by: null,
    });

    this.logger.log(
      `Invitation ${invitationId} resent for ${invitation.email} in store ${storeId} by ${requestingUserId}`,
    );

    return {
      id: updated.id,
      storeId: updated.store_id,
      storeName: store?.name,
      organizationId: updated.organization_id,
      email: updated.email,
      role: role.name,
      invitationCode: updated.invitation_code,
      status: updated.status,
      expiresAt: updated.expires_at,
      createdBy: updated.created_by,
      rawToken,
      inviteUrl: `https://app.stockpulse.io/invite?code=${updated.invitation_code}&token=${rawToken}`,
      createdAt: updated.created_at,
      updatedAt: updated.updated_at,
    };
  }

  /**
   * 4. Revoke an invitation (Admin capability)
   */
  async revokeInvitation(
    storeId: string,
    invitationId: string,
    revokingUserId: string,
  ): Promise<{ success: boolean; message: string }> {
    const invitation = await this.invitationsRepository.findById(invitationId);
    if (!invitation || invitation.store_id !== storeId) {
      throw new NotFoundException(`Invitation '${invitationId}' not found for store '${storeId}'`);
    }

    if (invitation.status === 'ACCEPTED') {
      throw new BadRequestException('Cannot revoke an invitation that has already been accepted');
    }

    if (invitation.status === 'REVOKED') {
      return { success: true, message: 'Invitation is already revoked' };
    }

    await this.invitationsRepository.update(invitationId, {
      status: 'REVOKED',
      revoked_at: new Date().toISOString(),
      revoked_by: revokingUserId,
    });

    this.logger.log(
      `Invitation ${invitationId} revoked for ${invitation.email} by ${revokingUserId}`,
    );

    return { success: true, message: 'Invitation revoked successfully' };
  }

  /**
   * 5. Validate / Verify Invitation Code (User capability)
   * Enforces Rate-Limiting, Expiration check, Revocation check, and One-Time status.
   */
  async validateInvitation(
    codeOrToken: string,
    clientIp: string = '127.0.0.1',
  ): Promise<VerifyInvitationResponseDto> {
    const cleanKey = codeOrToken.trim();
    if (!cleanKey) {
      throw new BadRequestException('Invitation code or token is required');
    }

    // Rate-limit validation attempts to prevent brute-force attacks
    this.rateLimiter.checkRateLimit(`inv_val:${clientIp}`);

    const tokenHash = crypto.createHash('sha256').update(cleanKey).digest('hex');
    let invitation = await this.invitationsRepository.findByTokenHashOrCode(tokenHash);

    if (!invitation) {
      invitation = await this.invitationsRepository.findByTokenHashOrCode(cleanKey.toUpperCase());
    }

    if (!invitation) {
      throw new NotFoundException('Invalid invitation code or token');
    }

    // Check status
    if (invitation.status === 'ACCEPTED') {
      throw new BadRequestException('This invitation has already been claimed');
    }

    if (invitation.status === 'REVOKED') {
      throw new BadRequestException('This invitation was revoked by store management');
    }

    // Check expiration
    const isExpired = new Date(invitation.expires_at) < new Date();
    if (invitation.status === 'EXPIRED' || isExpired) {
      if (invitation.status !== 'EXPIRED') {
        await this.invitationsRepository.update(invitation.id, { status: 'EXPIRED' });
      }
      throw new BadRequestException('This invitation has expired');
    }

    // Clear rate limit record on successful validation
    this.rateLimiter.recordSuccess(`inv_val:${clientIp}`);

    return {
      valid: true,
      storeId: invitation.store_id,
      storeName: invitation.stores?.name || 'Store',
      email: invitation.email,
      role: invitation.roles?.name || 'staff',
      invitationCode: invitation.invitation_code,
      expiresAt: invitation.expires_at,
    };
  }

  /**
   * 6. Accept Invitation (User capability)
   * Enforces:
   * - Requirement 4: Authenticated user email matches invitation email.
   * - Requirement 5: One-time use.
   * - Requirement 6: Not expired.
   * - Requirement 7: Not revoked.
   * - Requirement 8: Not previously accepted.
   * - Requirement 10: Store ID and Role derived strictly from DB record.
   */
  async acceptInvitation(
    dto: AcceptInvitationDto,
    authenticatedUser: AuthenticatedUser,
  ): Promise<AcceptInvitationResponseDto> {
    const cleanKey = dto.codeOrToken.trim();
    if (!cleanKey) {
      throw new BadRequestException('Invitation code or token is required');
    }

    const tokenHash = crypto.createHash('sha256').update(cleanKey).digest('hex');
    let invitation = await this.invitationsRepository.findByTokenHashOrCode(tokenHash);

    if (!invitation) {
      invitation = await this.invitationsRepository.findByTokenHashOrCode(cleanKey.toUpperCase());
    }

    if (!invitation) {
      throw new NotFoundException('Invalid invitation code or token');
    }

    // Requirement 8: Not previously accepted
    if (invitation.status === 'ACCEPTED') {
      throw new BadRequestException('This invitation has already been accepted');
    }

    // Requirement 7: Not revoked
    if (invitation.status === 'REVOKED') {
      throw new BadRequestException('This invitation was revoked by store management');
    }

    // Requirement 6: Not expired
    if (new Date(invitation.expires_at) < new Date()) {
      await this.invitationsRepository.update(invitation.id, { status: 'EXPIRED' });
      throw new BadRequestException('This invitation has expired');
    }

    // Requirement 4: Authenticated user email MUST match invitation email
    const userEmail = (authenticatedUser.email || '').toLowerCase().trim();
    const inviteEmail = (invitation.email || '').toLowerCase().trim();

    if (!userEmail || userEmail !== inviteEmail) {
      this.logger.warn(
        `Email mismatch on invitation accept: auth='${userEmail}', invite='${inviteEmail}'`,
      );
      throw new ForbiddenException(
        `Security violation: This invitation was issued to '${inviteEmail}', but your account is authenticated as '${userEmail}'`,
      );
    }

    // Requirement 10: Server pulls store_id and role_id exclusively from invitation record
    const targetStoreId = invitation.store_id;
    const targetRoleId = invitation.role_id;
    const targetUserId = authenticatedUser.id;

    // Requirement 5: Atomically mark invitation as ACCEPTED (one-time use)
    await this.invitationsRepository.update(invitation.id, {
      status: 'ACCEPTED',
      accepted_by: targetUserId,
      accepted_at: new Date().toISOString(),
    });

    // Assign user to target store with target role in RBAC junction
    await this.invitationsRepository.assignUserToStore(
      targetUserId,
      targetStoreId,
      targetRoleId,
    );

    const store = await this.invitationsRepository.getStoreById(targetStoreId);
    const roleName = invitation.roles?.name || 'staff';

    this.logger.log(
      `Invitation ${invitation.id} successfully claimed by ${userEmail} (Role: ${roleName}) for Store: ${targetStoreId}`,
    );

    return {
      success: true,
      storeId: targetStoreId,
      storeName: store?.name || 'Store',
      role: roleName,
      message: `Successfully joined ${store?.name || 'Store'} as ${roleName}`,
    };
  }
}
