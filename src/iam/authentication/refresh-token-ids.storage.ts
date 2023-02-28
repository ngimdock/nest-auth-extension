import {
  Injectable,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import { Redis } from 'ioredis';
import { InvalidRefeshTokenError } from './exceptions';

@Injectable()
export class RefreshTokenIdsStorage
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private redisClient: Redis;
  onApplicationBootstrap() {
    this.redisClient = new Redis({
      host: 'localhost',
      port: 6379,
    });
  }
  onApplicationShutdown(signal?: string) {
    this.redisClient.quit();
  }

  private getKey(userId: number) {
    return `user-${userId}`;
  }

  async insert(userId: number, tokenId: string) {
    await this.redisClient.set(this.getKey(userId), tokenId);
  }

  async validate(userId: number, tokenId: string) {
    const storedId = await this.redisClient.get(this.getKey(userId));

    if (storedId !== tokenId) throw new InvalidRefeshTokenError();

    return storedId === tokenId;
  }

  async invalide(userId: number) {
    await this.redisClient.del(this.getKey(userId));
  }
}
