import { Module } from '@nestjs/common';
import { ProcurementController } from './procurement.controller';
import { ProcurementRepository } from './procurement.repository';
import { ProcurementService } from './procurement.service';

@Module({
  controllers: [ProcurementController],
  providers: [ProcurementService, ProcurementRepository],
  exports: [ProcurementService, ProcurementRepository],
})
export class ProcurementModule {}
