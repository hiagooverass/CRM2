import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards, Request } from '@nestjs/common';
import { ContractsService } from './contracts.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('contracts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('contracts')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create a new contract' })
  create(@Request() req, @Body() createContractDto: CreateContractDto) {
    return this.contractsService.create(req.user.id, createContractDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all contracts' })
  findAll(@Request() req) {
    return this.contractsService.findAll(req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get contract details' })
  findOne(@Request() req, @Param('id') id: string) {
    return this.contractsService.findOne(req.user.id, id);
  }

  @Patch(':id/status')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update contract status' })
  updateStatus(@Request() req, @Param('id') id: string, @Body('status') status: string) {
    return this.contractsService.updateStatus(req.user.id, id, status);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update contract' })
  update(@Request() req, @Param('id') id: string, @Body() updateContractDto: Partial<CreateContractDto>) {
    return this.contractsService.update(req.user.id, id, updateContractDto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete contract' })
  remove(@Request() req, @Param('id') id: string) {
    return this.contractsService.remove(req.user.id, id);
  }
}
