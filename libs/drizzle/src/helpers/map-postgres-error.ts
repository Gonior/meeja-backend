import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';

export function mapPosgresError(error: any): never {
  const logger = new Logger();

  if (error?.cause?.code === 'ECONNREFUSED' || error?.cause?.code === 'ECONNREST') {
    throw new InternalServerErrorException('Database connection failed');
  }

  if ('cause' in error && 'code' in error.cause) {
    const code = error?.cause?.code ?? '';
    switch (code) {
      case '23505':
        throw new ConflictException('Duplicate value');

      case '23503':
        throw new BadRequestException('Foreign key violation');

      case '23502':
        throw new BadRequestException('Not null violation');

      case '22P02':
        throw new BadRequestException('Invalid input format');
    }
  }
  logger.fatal(error, 'DrizzleModule');
  throw new InternalServerErrorException('Database unkown error');
}
