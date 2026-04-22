import { Controller, Get, Post, Body, Param, Patch, UseGuards, Request } from '@nestjs/common';
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
  create(@Request() req, @Body() createBillingDto: CreateBillingDto) {
    return this.billingsService.create(req.user.id, createBillingDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all billings' })
  findAll(@Request() req) {
    return this.billingsService.findAll(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get billing details' })
  findOne(@Request() req, @Param('id') id: string) {
    return this.billingsService.findOne(req.user.id, id);
  }

  @Patch(':id/pay')
  @ApiOperation({ summary: 'Mark billing as paid' })
  markAsPaid(@Request() req, @Param('id') id: string) {
    return this.billingsService.markAsPaid(req.user.id, id);
  }
}
