import {
  Body,
  Controller,
  Delete,
  Get,
  Ip,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { SupabaseAuthGuard } from '../common/guards/supabase-auth.guard';
import { TenantStoreGuard } from '../common/guards/tenant-store.guard';
import { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import {
  AcceptInvitationDto,
  AcceptInvitationResponseDto,
  CreateInvitationDto,
  InvitationResponseDto,
  ResendInvitationDto,
  ValidateInvitationDto,
  VerifyInvitationResponseDto,
} from './dto/invitation.dto';
import { InvitationsService } from './invitations.service';

@ApiTags('Store Invitations')
@Controller()
@UseGuards(SupabaseAuthGuard, RolesGuard, TenantStoreGuard)
export class InvitationsController {
  constructor(private readonly invitationsService: InvitationsService) {}

  // ── Admin Capabilities ──

  @Post('stores/:storeId/invitations')
  @ApiBearerAuth()
  @Roles('admin', 'superadmin', 'manager')
  @ApiOperation({ summary: 'Create and dispatch a new store invitation' })
  @ApiResponse({ status: 201, description: 'Invitation created', type: InvitationResponseDto })
  async createInvitation(
    @Param('storeId') storeId: string,
    @Body() dto: CreateInvitationDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<InvitationResponseDto & { rawToken: string }> {
    return this.invitationsService.createInvitation(storeId, dto, user.id);
  }

  @Get('stores/:storeId/invitations')
  @ApiBearerAuth()
  @Roles('admin', 'superadmin', 'manager')
  @ApiOperation({ summary: 'List all invitations for a specific store' })
  @ApiResponse({ status: 200, description: 'List of store invitations', type: [InvitationResponseDto] })
  async getStoreInvitations(
    @Param('storeId') storeId: string,
  ): Promise<InvitationResponseDto[]> {
    return this.invitationsService.getStoreInvitations(storeId);
  }

  @Post('stores/:storeId/invitations/:id/resend')
  @ApiBearerAuth()
  @Roles('admin', 'superadmin', 'manager')
  @ApiOperation({ summary: 'Resend an invitation with refreshed expiration and new code' })
  @ApiResponse({ status: 200, description: 'Invitation resent', type: InvitationResponseDto })
  async resendInvitation(
    @Param('storeId') storeId: string,
    @Param('id') invitationId: string,
    @Body() dto: ResendInvitationDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<InvitationResponseDto & { rawToken: string }> {
    return this.invitationsService.resendInvitation(storeId, invitationId, dto, user.id);
  }

  @Delete('stores/:storeId/invitations/:id')
  @ApiBearerAuth()
  @Roles('admin', 'superadmin', 'manager')
  @ApiOperation({ summary: 'Revoke a pending store invitation' })
  @ApiResponse({ status: 200, description: 'Invitation revoked' })
  async revokeInvitation(
    @Param('storeId') storeId: string,
    @Param('id') invitationId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ success: boolean; message: string }> {
    return this.invitationsService.revokeInvitation(storeId, invitationId, user.id);
  }

  @Post('stores/:storeId/invitations/:id/revoke')
  @ApiBearerAuth()
  @Roles('admin', 'superadmin', 'manager')
  @ApiOperation({ summary: 'Revoke a pending store invitation (POST alias)' })
  @ApiResponse({ status: 200, description: 'Invitation revoked' })
  async revokeInvitationAlias(
    @Param('storeId') storeId: string,
    @Param('id') invitationId: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ success: boolean; message: string }> {
    return this.invitationsService.revokeInvitation(storeId, invitationId, user.id);
  }

  // ── User Capabilities ──

  @Public()
  @Get('invitations/validate/:codeOrToken')
  @ApiOperation({ summary: 'Validate an invitation code or token (Rate-limited)' })
  @ApiResponse({ status: 200, description: 'Validation result', type: VerifyInvitationResponseDto })
  async validateInvitationGet(
    @Param('codeOrToken') codeOrToken: string,
    @Ip() ip: string,
  ): Promise<VerifyInvitationResponseDto> {
    return this.invitationsService.validateInvitation(codeOrToken, ip);
  }

  @Public()
  @Post('invitations/validate')
  @ApiOperation({ summary: 'Validate an invitation code via POST payload (Rate-limited)' })
  @ApiResponse({ status: 200, description: 'Validation result', type: VerifyInvitationResponseDto })
  async validateInvitationPost(
    @Body() dto: ValidateInvitationDto,
    @Ip() ip: string,
  ): Promise<VerifyInvitationResponseDto> {
    return this.invitationsService.validateInvitation(dto.codeOrToken, ip);
  }

  @Post('invitations/accept')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Accept a store invitation for the authenticated user' })
  @ApiResponse({ status: 200, description: 'Invitation accepted', type: AcceptInvitationResponseDto })
  async acceptInvitation(
    @Body() dto: AcceptInvitationDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<AcceptInvitationResponseDto> {
    return this.invitationsService.acceptInvitation(dto, user);
  }
}
