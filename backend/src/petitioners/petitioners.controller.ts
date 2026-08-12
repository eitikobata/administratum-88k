import { Body, Controller, Get, Post } from '@nestjs/common';
import { PetitionersService } from './petitioners.service';
import { CreatePetitionerDto } from './dto/create-petitioner.dto';

@Controller('petitioners')
export class PetitionersController {
  constructor(private readonly petitionersService: PetitionersService) {}

  @Post()
  create(@Body() dto: CreatePetitionerDto) {
    return this.petitionersService.create(dto);
  }

  @Get()
  findAll() {
    return this.petitionersService.findAll();
  }
}
