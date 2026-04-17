import { Controller, Get, Post, Body, Param, Patch, UseGuards } from '@nestjs/common';
import { ContractsService } from './contracts.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('contracts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('contracts')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new contract' })
  create(@Body() createContractDto: CreateContractDto) {
    return this.contractsService.create(createContractDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all contracts' })
  findAll() {
    return this.contractsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get contract details' })
  findOne(@Param('id') id: string) {
    return this.contractsService.findOne(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update contract status' })
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.contractsService.updateStatus(id, status);
  }
}
