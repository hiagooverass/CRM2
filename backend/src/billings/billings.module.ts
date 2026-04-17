import { Module } from '@nestjs/common';
import { BillingsService } from './billings.service';
import { BillingsController } from './billings.controller';

@Module({
  providers: [BillingsService],
  controllers: [BillingsController]
})
export class BillingsModule {}
