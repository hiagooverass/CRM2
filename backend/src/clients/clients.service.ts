import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientDto, ClientType } from './dto/create-client.dto';
import { cpf, cnpj } from 'cpf-cnpj-validator';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ClientsService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async create(dto: CreateClientDto) {
    // 1. Validate Document
    this.validateDocument(dto.type, dto.document);

    // 2. Check for Duplicity
    const existing = await this.prisma.client.findUnique({
      where: { document: dto.document },
    });
    if (existing) {
      throw new ConflictException('Client with this document already exists');
    }

    let extraData = {};

    // 3. Integration with CNPJa (if PJ)
    if (dto.type === ClientType.PJ) {
      extraData = await this.fetchCNPJData(dto.document);
    }

    // 4. Calculate Credit Score
    const scoreData = this.calculateInitialScore(dto);

    // 5. Create Client
    return this.prisma.client.create({
      data: {
        ...dto,
        ...extraData,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : null,
        foundationDate: dto.foundationDate ? new Date(dto.foundationDate) : (extraData as any).foundationDate,
        score: scoreData.score,
        classification: scoreData.classificacao,
        scoreReasons: JSON.stringify(scoreData.motivos),
      },
    });
  }

  private validateDocument(type: ClientType, document: string) {
    const cleanDoc = document.replace(/\D/g, '');
    if (type === ClientType.PF && !cpf.isValid(cleanDoc)) {
      throw new BadRequestException('Invalid CPF');
    }
    if (type === ClientType.PJ && !cnpj.isValid(cleanDoc)) {
      throw new BadRequestException('Invalid CNPJ');
    }
  }

  private async fetchCNPJData(document: string) {
    const cleanDoc = document.replace(/\D/g, '');
    const apiKey = this.configService.get('CNPJA_API_KEY');
    
    if (!apiKey) {
      return {}; // Skip if no API key
    }

    try {
      const response = await axios.get(`https://api.cnpja.com.br/companies/${cleanDoc}`, {
        headers: { Authorization: apiKey },
      });
      
      const data = response.data;
      return {
        tradingName: data.alias || data.name,
        legalNature: data.nature?.text,
        foundationDate: data.founded ? new Date(data.founded) : null,
      };
    } catch (error) {
      console.error('Error fetching CNPJa data:', error.message);
      return {}; // Return empty if API fails
    }
  }

  private calculateInitialScore(dto: CreateClientDto) {
    // Mock logic for score
    let score = Math.floor(Math.random() * 101); // 0-100
    let motivos = [];

    if (score < 30) {
      return { score, classificacao: 'BAIXO', motivos: ['Histórico de crédito insuficiente'] };
    } else if (score < 70) {
      return { score, classificacao: 'MEDIO', motivos: ['Score médio de mercado'] };
    } else if (score < 95) {
      return { score, classificacao: 'ALTO', motivos: ['Bom pagador'] };
    } else {
      return { score, classificacao: 'ALTO', motivos: ['Excelente histórico'] };
    }
  }

  async findAll() {
    return this.prisma.client.findMany({
      include: {
        contracts: true,
        billings: true,
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.client.findUnique({
      where: { id },
      include: {
        contracts: true,
        billings: true,
        documents: true,
      },
    });
  }

  async search(query: string) {
    return this.prisma.client.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { document: { contains: query } },
          { email: { contains: query } },
        ],
      },
    });
  }

  async update(id: string, dto: any) {
    return this.prisma.client.update({
      where: { id },
      data: {
        ...dto,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
        foundationDate: dto.foundationDate ? new Date(dto.foundationDate) : undefined,
      },
    });
  }

  async remove(id: string) {
    return this.prisma.client.delete({
      where: { id },
    });
  }

  async uploadDocument(clientId: string, type: string, file: Express.Multer.File) {
    return this.prisma.document.create({
      data: {
        clientId,
        type,
        url: file.path,
      },
    });
  }
}
