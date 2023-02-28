import { Module } from '@nestjs/common';
import { BcryptService } from './hashing/bcrypt.service';
import { AuthenticationController } from './authentication/authentication.controller';
import { AuthenticationService } from './authentication/authentication.service';
import { HashingService } from './hashing/hashing.service';
import { UsersModule } from 'src/users/users.module';
import { JwtModule } from '@nestjs/jwt';
import jwtConfig from './config/jwt.config';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AccessTokenGuard, AuthenticationGuard } from './authentication/guards';
import { RefreshTokenIdsStorage } from './authentication/refresh-token-ids.storage';

@Module({
  imports: [
    UsersModule,
    JwtModule.registerAsync(jwtConfig.asProvider()),
    ConfigModule.forFeature(jwtConfig),
  ],
  providers: [
    AccessTokenGuard,
    {
      provide: APP_GUARD,
      useClass: AuthenticationGuard,
    },
    {
      provide: HashingService,
      useClass: BcryptService,
    },
    RefreshTokenIdsStorage,
    AuthenticationService,
  ],
  controllers: [AuthenticationController],
})
export class IamModule {}
