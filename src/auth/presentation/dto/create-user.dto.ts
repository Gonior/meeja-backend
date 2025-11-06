import { IsEmail, IsNotEmpty, Length, Matches, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { DISPLAY_NAME_RULES, EMAIL_RULES, PASSWORD_RULES, USERNAME_RULES } from '@app/common';
import { UsersTable } from '@app/drizzle';
export class CreateUser
  implements
    Omit<
      typeof UsersTable.$inferSelect,
      'id' | 'createdAt' | 'updatedAt' | 'avatarResizeStatus' | 'avatarKey' | 'bio'
    >
{
  @ApiProperty({
    example: 'Nom Rekayasa',
  })
  @Length(DISPLAY_NAME_RULES.MIN_LENGTH, DISPLAY_NAME_RULES.MAX_LENGTH)
  displayName: string;

  @ApiProperty({
    example: 'nom@example.com',
  })
  @IsEmail()
  @MaxLength(EMAIL_RULES.MAX_LENGTH)
  email: string;

  @ApiProperty({
    example: 'rek.nom',
  })
  // penjelasan regex:
  // ^(?!.*[_.]{2}) tidak boleh dua simbol underscore (_) dan dot (.) berurutan
  // (?![.]) tidak boleh diawali simbol dot (.)
  // (?!.*[.]$) tidak boleh diakhiri dengan simbol dot (.)
  // [a-zA-Z0-9._]{3,30} hanya boleh huruf (besar/kecil), angka, underscore (_) dan dot (.) dengan minimal 3-30 karakter.
  @Matches(/^(?!.*[_.]{2})(?![.])(?!.*[.]$)[a-zA-Z0-9._]{3,30}$/, {
    message:
      'Username must be only letters, numbers, dots, or underscores — no consecutive or trailing dots.',
  })
  @Length(USERNAME_RULES.MIN_LENGTH, USERNAME_RULES.MAX_LENGTH)
  username: string;

  @ApiProperty({
    example: 'str@ngPassw000rdd',
  })
  @MinLength(PASSWORD_RULES.MIN_LENGTH)
  @IsNotEmpty()
  password: string;
}
