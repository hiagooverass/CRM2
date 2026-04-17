import { Controller, Get, Post, Body, Param, Patch, UseGuards } from '@nestjs/common';
import { BillingsService } from './billings.service';
import { CreateBillingDto } from './dto/create-billing.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('billings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('billings')
export class BillingsController {
  constructor(private readonly billingsService: BillingsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new billing' })
  create(@Body() createBillingDto: CreateBillingDto) {
    return this.billingsService.create(createBillingDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all billings' })
  findAll() {
    return this.billingsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get billing details' })
  findOne(@Param('id') id: string) {
    return this.billingsService.findOne(id);
  }

  @Patch(':id/pay')
  @ApiOperation({ summary: 'Mark billing as paid' })
  markAsPaid(@Param('id') id: string) {
    return this.billingsService.markAsPaid(id);
  }
}
