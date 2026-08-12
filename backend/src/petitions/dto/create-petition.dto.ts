import { PetitionImpact } from '@prisma/client';
import {
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

export class CreatePetitionDto {
  @IsUUID()
  petitionerId: string;

  @IsString()
  @MinLength(3)
  type: string;

  @IsEnum(PetitionImpact)
  impact: PetitionImpact;

  // Free-form details about the request (which planet, how many units,
  // whatever the petition type needs). Not validated here on purpose — the
  // workflow engine treats it as opaque data it just carries along.
  @IsOptional()
  @IsObject()
  payload?: Record<string, unknown>;
}
