import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { ValidationError } from 'class-validator';

function formatErrors(errors: ValidationError[]) {
  const result = {};
  for (const error of errors) {
    if (error.constraints) {
      result[error.property] = Object.values(error.constraints);
    }
    if (error.children?.length) {
      Object.assign(result, formatErrors(error.children));
    }
  }
  return result;
}

export const AppValidationPipe = new ValidationPipe({
  whitelist: true,
  transform: true,
  forbidNonWhitelisted: true,
  exceptionFactory: (validationErrors: ValidationError[] = []) => {
    const formatted = formatErrors(validationErrors);
    return new BadRequestException({
      statusCode: 400,
      error: formatted,
      message: 'Validation Error',
    });
  },
});
