import { BadRequestException } from '@nestjs/common';

export class ValidationError extends BadRequestException {
  constructor(message: string, public readonly errors?: Array<{ field: string; message: string }>) {
    super(message);
    this.name = 'ValidationError';
  }
}

