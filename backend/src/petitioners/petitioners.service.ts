import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePetitionerDto } from './dto/create-petitioner.dto';

@Injectable()
export class PetitionersService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreatePetitionerDto) {
    return this.prisma.petitioner.create({ data: dto });
  }

  findAll() {
    return this.prisma.petitioner.findMany({ orderBy: { createdAt: 'desc' } });
  }
}
