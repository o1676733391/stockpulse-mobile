import { Module } from '@nestjs/common';
import { InvitationRateLimiterService } from './invitation-rate-limiter.service';
import { InvitationsController } from './invitations.controller';
import { InvitationsRepository } from './invitations.repository';
import { InvitationsService } from './invitations.service';

@Module({
  controllers: [InvitationsController],
  providers: [InvitationsService, InvitationsRepository, InvitationRateLimiterService],
  exports: [InvitationsService, InvitationsRepository, InvitationRateLimiterService],
})
export class InvitationsModule {}
