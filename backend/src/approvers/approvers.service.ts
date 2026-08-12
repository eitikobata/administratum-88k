import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateApproverDto } from './dto/create-approver.dto';

@Injectable()
export class ApproversService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateApproverDto) {
    return this.prisma.approver.create({ data: dto });
  }

  findAll() {
    return this.prisma.approver.findMany({ orderBy: { createdAt: 'desc' } });
  }
}
