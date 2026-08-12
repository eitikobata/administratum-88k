import { IsEmail, IsString, MinLength } from 'class-validator';

export class CreateApproverDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsEmail()
  email: string;
}
