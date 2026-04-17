import { Controller, Get, Post, Body, Param, Query, UseGuards, UseInterceptors, UploadedFile, Patch, Delete } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@ApiTags('clients')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new client (PF or PJ)' })
  create(@Body() createClientDto: CreateClientDto) {
    return this.clientsService.create(createClientDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all clients' })
  findAll() {
    return this.clientsService.findAll();
  }

  @Get('search')
  @ApiOperation({ summary: 'Search clients by name, document or email' })
  search(@Query('q') query: string) {
    return this.clientsService.search(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get client details by ID' })
  findOne(@Param('id') id: string) {
    return this.clientsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update client data' })
  update(@Param('id') id: string, @Body() updateClientDto: any) {
    return this.clientsService.update(id, updateClientDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a client' })
  remove(@Param('id') id: string) {
    return this.clientsService.remove(id);
  }

  @Post(':id/documents')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
        return cb(null, `${randomName}${extname(file.originalname)}`);
      }
    })
  }))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        type: { type: 'string' },
      },
    },
  })
  @ApiOperation({ summary: 'Upload a document for a client' })
  uploadDocument(
    @Param('id') id: string,
    @Body('type') type: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.clientsService.uploadDocument(id, type, file);
  }
}
