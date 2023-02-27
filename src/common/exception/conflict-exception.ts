import { BadRequestException } from '@nestjs/common';

export class ConflictException extends BadRequestException {
  constructor() {
    super('Incorrect data prvided');
  }
}
