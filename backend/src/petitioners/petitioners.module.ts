import { Module } from '@nestjs/common';
import { PetitionersService } from './petitioners.service';
import { PetitionersController } from './petitioners.controller';

@Module({
  controllers: [PetitionersController],
  providers: [PetitionersService],
  exports: [PetitionersService],
})
export class PetitionersModule {}
