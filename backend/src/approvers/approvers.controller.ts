import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApproversService } from './approvers.service';
import { CreateApproverDto } from './dto/create-approver.dto';

@Controller('approvers')
export class ApproversController {
  constructor(private readonly approversService: ApproversService) {}

  @Post()
  create(@Body() dto: CreateApproverDto) {
    return this.approversService.create(dto);
  }

  @Get()
  findAll() {
    return this.approversService.findAll();
  }
}
