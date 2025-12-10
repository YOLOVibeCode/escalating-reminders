import { UnprocessableEntityException } from '@nestjs/common';

export class QuotaExceededError extends UnprocessableEntityException {
  constructor(message: string) {
    super(message);
    this.name = 'QuotaExceededError';
  }
}

