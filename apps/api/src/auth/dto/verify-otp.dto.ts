import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class VerifyOtpDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  otp: string;

  @IsNotEmpty()
  name: string;

  @MinLength(8)
  password: string;
}
