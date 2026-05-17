import { IsString, IsNotEmpty, IsEmail } from 'class-validator';

export class CreateAuthDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}
