import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { PetitionState } from '@prisma/client';
import { PetitionsService } from './petitions.service';
import { CreatePetitionDto } from './dto/create-petition.dto';
import { DecideApprovalDto } from './dto/decide-approval.dto';

@Controller('petitions')
export class PetitionsController {
  constructor(private readonly petitionsService: PetitionsService) {}

  @Post()
  create(@Body() dto: CreatePetitionDto) {
    return this.petitionsService.create(dto);
  }

  @Post(':id/submit')
  submit(@Param('id', ParseUUIDPipe) id: string) {
    return this.petitionsService.submit(id);
  }

  @Post(':id/approvals')
  decide(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DecideApprovalDto,
  ) {
    return this.petitionsService.decide(id, dto);
  }

  @Get()
  findAll(@Query('state') state?: PetitionState) {
    return this.petitionsService.findAll(state);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.petitionsService.findOne(id);
  }
}
