import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientDto, ClientType } from './dto/create-client.dto';
import { cpf, cnpj } from 'cpf-cnpj-validator';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ClientsService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  async create(userId: string, dto: CreateClientDto) {
    console.log(`[ClientsService] Iniciando criação de cliente. userId: ${userId}`);
    
    if (!userId) {
      console.error('[ClientsService] ERRO: userId não fornecido para criação');
      throw new BadRequestException('Usuário não identificado');
    }

    // 1. Validate Document
    this.validateDocument(dto.type, dto.document);

    // 2. Check for Duplicity
    const existing = await this.prisma.client.findFirst({
      where: { document: dto.document },
    });

    if (existing) {
      console.log(`[ClientsService] Cliente com documento ${dto.document} já existe. ID: ${existing.id}, userId atual no banco: ${existing.userId}`);
      
      // Se o cliente existe mas não tem userId (global), nós o associamos ao usuário atual
      if (!existing.userId) {
        console.log(`[ClientsService] Associando cliente global ${existing.id} ao usuário ${userId}`);
        return this.prisma.client.update({
          where: { id: existing.id },
          data: { userId },
        });
      }
      
      // Como o site é para uma única empresa, se o cliente já existe em qualquer lugar, 
      // o Admin pode simplesmente "reativá-lo" ou o sistema pode apenas retornar o existente.
      // Vamos permitir que o Admin veja e gerencie esse cliente.
      return existing;
    }

    // 2.1 Verificar se existe um usuário com este documento e criar um se não existir
    let userForClient = await this.prisma.user.findUnique({
      where: { document: dto.document },
    });

    if (!userForClient) {
      console.log(`[ClientsService] Criando usuário automático para documento: ${dto.document}`);
      const hashedPassword = await bcrypt.hash('senha123', 10);
      userForClient = await this.prisma.user.create({
        data: {
          email: dto.email || `${dto.document.replace(/\D/g, '')}@sistema.com`,
          password: hashedPassword,
          name: dto.name,
          document: dto.document,
          phone: dto.phone,
          cep: dto.cep,
          street: dto.street,
          number: dto.number,
          neighborhood: dto.neighborhood,
          city: dto.city,
          state: dto.state,
          role: 'USER',
        },
      });
    } else {
      // Se o usuário já existe mas não tem um registro de Client vinculado a ele (raro com a nova lógica)
      // nós usamos esse userId para o novo cliente.
      console.log(`[ClientsService] Usuário já existe, vinculando ao novo cliente.`);
    }

    let extraData = {};

    // 3. Integration with CNPJa (if PJ)
    if (dto.type === ClientType.PJ) {
      extraData = await this.fetchCNPJData(dto.document);
    }

    // 4. Calculate Credit Score
    const scoreData = this.calculateInitialScore(dto);

    // 5. Create Client
    const { street, number, neighborhood, cep, ...cleanedExtraData } = extraData as any;
    
    const cleanedDto = Object.fromEntries(
      Object.entries(dto).filter(([k, v]) => k !== 'userId' && k !== 'password' && v !== '' && v !== null && v !== undefined)
    );

    const createData = {
      ...cleanedExtraData,
      ...(cleanedDto as any),
      userId,
      birthDate: dto.birthDate ? new Date(dto.birthDate) : null,
      foundationDate: dto.foundationDate ? new Date(dto.foundationDate) : (cleanedExtraData as any).foundationDate,
      score: scoreData.score,
      classification: scoreData.classificacao,
      scoreReasons: JSON.stringify(scoreData.motivos),
    };

    return this.prisma.client.create({
      data: createData,
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
      console.log('CNPJA_API_KEY not found in environment');
      return {}; 
    }

    try {
      const response = await axios.get(`https://api.cnpja.com.br/companies/${cleanDoc}`, {
        headers: { 'Authorization': apiKey },
      });
      
      const data = response.data;
      
      // Concatenate address if components exist
      let address = '';
      let street = '';
      let number = '';
      let neighborhood = '';
      let cep = '';

      if (data.address) {
        const addr = data.address;
        street = addr.street;
        number = addr.number;
        neighborhood = addr.neighborhood;
        cep = addr.zip;
        address = `${addr.street}, ${addr.number}${addr.details ? ' - ' + addr.details : ''}, ${addr.neighborhood}, ${addr.city} - ${addr.state}, ${addr.zip}`;
      }

      return {
        name: data.name, // Official Razão Social
        tradingName: data.alias || data.name,
        legalNature: data.nature?.text,
        foundationDate: data.founded ? new Date(data.founded) : null,
        address: address || undefined,
        email: data.email || undefined,
        phone: data.phone || undefined,
        // Detailed fields for public fetch
        street,
        number,
        neighborhood,
        cep
      };
    } catch (error) {
      console.error('Error fetching CNPJa data:', error.response?.data || error.message);
      return {}; 
    }
  }

  async fetchCNPJDataPublic(cnpj: string) {
    return this.fetchCNPJData(cnpj);
  }

  async findByDocument(document: string) {
    // Busca tanto na tabela Client quanto na tabela User
    const client = await this.prisma.client.findFirst({
      where: { document },
    });

    if (client) return client;

    const user = await this.prisma.user.findUnique({
      where: { document },
    });

    if (user) {
      // Retorna no formato de cliente para o frontend
      return {
        name: user.name,
        email: user.email,
        document: user.document,
        phone: user.phone,
        cep: user.cep,
        street: user.street,
        number: user.number,
        neighborhood: user.neighborhood,
        city: user.city,
        state: user.state,
      };
    }

    return null;
  }

  private calculateInitialScore(dto: CreateClientDto) {
    // Mock logic for score
    let score = Math.floor(50); // 0-100
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

  async findAll(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (user?.role === 'ADMIN') {
      // Para o Administrador, mostramos absolutamente todos os clientes do banco
      return this.prisma.client.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          contract: true,
          billing: true,
        },
      });
    }

    // Se for USER (Cliente), ele vê apenas o seu próprio perfil de cliente
    return this.prisma.client.findMany({
      where: {
        document: user?.document || '---'
      },
      orderBy: { createdAt: 'desc' },
      include: {
        contract: true,
        billing: true,
      },
    });
  }

  async findOne(userId: string, id: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (user?.role === 'ADMIN') {
      return this.prisma.client.findFirst({
        where: {
          id,
          OR: [
            { userId },
            { userId: null }
          ]
        },
        include: {
          contract: true,
          billing: true,
          documents: true,
        }
      });
    }

    return this.prisma.client.findFirst({
      where: {
        id,
        document: user?.document || '---'
      },
      include: {
        contract: true,
        billing: true,
        documents: true,
      }
    });
  }

  async search(userId: string, query: string) {
    return this.prisma.client.findMany({
      where: {
        OR: [
          { userId },
          { userId: null }
        ],
        AND: [
          {
            OR: [
              { name: { contains: query } },
              { document: { contains: query } },
              { email: { contains: query } },
            ],
          }
        ]
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(userId: string, id: string, dto: any) {
    const { birthDate, foundationDate, ...rest } = dto;
    
    // Verifica se o cliente pertence ao usuário ou é global
    const client = await this.prisma.client.findFirst({
      where: {
        id,
        OR: [
          { userId },
          { userId: null }
        ]
      }
    });

    if (!client) {
      throw new BadRequestException('Cliente não encontrado ou você não tem permissão para editá-lo');
    }

    return this.prisma.client.update({
      where: { id },
      data: {
        ...rest,
        birthDate: birthDate ? new Date(birthDate) : undefined,
        foundationDate: foundationDate ? new Date(foundationDate) : undefined,
      },
    });
  }

  async remove(userId: string, id: string) {
    const client = await this.prisma.client.findFirst({
      where: {
        id,
        OR: [
          { userId },
          { userId: null }
        ]
      },
      include: { contract: true, billing: true, documents: true }
    });

    if (!client) {
      throw new BadRequestException('Cliente não encontrado ou você não tem permissão para excluí-lo');
    }

    // Use transaction to delete everything related to the client
    return this.prisma.$transaction(async (tx) => {
      // 1. Delete all documents
      await tx.document.deleteMany({
        where: { clientId: id }
      });

      // 2. Delete all billings
      await tx.billing.deleteMany({
        where: { clientId: id }
      });

      // 3. Delete all contracts
      await tx.contract.deleteMany({
        where: { clientId: id }
      });

      // 4. Finally, delete the client
      return tx.client.delete({
        where: { id, userId },
      });
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
