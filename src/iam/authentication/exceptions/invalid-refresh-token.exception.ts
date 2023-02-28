import { UnauthorizedException } from '@nestjs/common';

export class InvalidRefeshTokenException extends UnauthorizedException {
  constructor() {
    super('Invalid token.');
  }
}
