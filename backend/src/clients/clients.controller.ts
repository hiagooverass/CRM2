import { Controller, Get, Post, Body, Param, Query, UseGuards, Patch, Delete, Request } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { CreateClientDto, UpdateClientDto } from './dto/create-client.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('clients')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new client (PF or PJ)' })
  create(@Request() req, @Body() createClientDto: CreateClientDto) {
    return this.clientsService.create(req.user.id, createClientDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all clients' })
  findAll(@Request() req) {
    return this.clientsService.findAll(req.user.id);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search clients by name or document' })
  search(@Request() req, @Query('q') query: string) {
    return this.clientsService.search(req.user.id, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get client details' })
  findOne(@Request() req, @Param('id') id: string) {
    return this.clientsService.findOne(req.user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update client info' })
  update(@Request() req, @Param('id') id: string, @Body() updateClientDto: UpdateClientDto) {
    return this.clientsService.update(req.user.id, id, updateClientDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove a client' })
  remove(@Request() req, @Param('id') id: string) {
    return this.clientsService.remove(req.user.id, id);
  }
}
