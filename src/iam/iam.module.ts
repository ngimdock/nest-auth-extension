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
import {
  AccessTokenGuard,
  ApiKeyGuard,
  AuthenticationGuard,
} from './authentication/guards';
import { RefreshTokenIdsStorage } from './authentication/refresh-token-ids.storage';
import { PermissionsGuard, RolesGuard } from './authorization/guards';
import { ApiKeysService } from './authentication/api-keys.service';
@Module({
  imports: [
    UsersModule,
    JwtModule.registerAsync(jwtConfig.asProvider()),
    ConfigModule.forFeature(jwtConfig),
  ],
  providers: [
    AccessTokenGuard,
    ApiKeyGuard,
    {
      provide: APP_GUARD,
      useClass: AuthenticationGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard, //RolesGuard,
    },
    {
      provide: HashingService,
      useClass: BcryptService,
    },
    RefreshTokenIdsStorage,
    AuthenticationService,
    ApiKeysService,
  ],
  controllers: [AuthenticationController],
})
export class IamModule {}
