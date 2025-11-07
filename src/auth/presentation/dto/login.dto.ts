import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'Can be email or username',
    example: 'rek.nom',
  })
  @IsNotEmpty()
  identifier: string;

  @ApiProperty({
    description: 'your password',
    example: 'str@ngPassw000rdd',
  })
  @IsNotEmpty()
  password: string;
}
