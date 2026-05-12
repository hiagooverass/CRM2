import { Controller, Get, Post, Body, Param, Query, UseGuards, Patch, Delete, Request } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { CreateClientDto, UpdateClientDto } from './dto/create-client.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('clients')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Create a new client (PF or PJ)' })
  create(@Request() req, @Body() createClientDto: CreateClientDto) {
    return this.clientsService.create(req.user.id, createClientDto);
  }

  @Get()
  @Roles('ADMIN')
  @ApiOperation({ summary: 'List all clients' })
  findAll(@Request() req) {
    return this.clientsService.findAll(req.user.id);
  }

  @Get('search')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Search clients by name or document' })
  search(@Request() req, @Query('q') query: string) {
    return this.clientsService.search(req.user.id, query);
  }

  @Get('check/:document')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Check if a user exists by document' })
  async checkByDocument(@Param('document') document: string) {
    return this.clientsService.findByDocument(document);
  }

  @Get('cnpj/:cnpj')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Fetch CNPJ data' })
  fetchCNPJ(@Param('cnpj') cnpj: string) {
    return this.clientsService.fetchCNPJDataPublic(cnpj);
  }

  @Get(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get client details' })
  findOne(@Request() req, @Param('id') id: string) {
    return this.clientsService.findOne(req.user.id, id);
  }

  @Patch(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Update client info' })
  update(@Request() req, @Param('id') id: string, @Body() updateClientDto: UpdateClientDto) {
    return this.clientsService.update(req.user.id, id, updateClientDto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Remove a client' })
  remove(@Request() req, @Param('id') id: string) {
    return this.clientsService.remove(req.user.id, id);
  }
}
