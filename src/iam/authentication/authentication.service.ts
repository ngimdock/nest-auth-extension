import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { ErrorCode } from 'src/common/enum';
import { User } from 'src/users/entities';
import { Repository } from 'typeorm';
import jwtConfig from '../config/jwt.config';
import { HashingService } from '../hashing/hashing.service';
import { ActiveUserData } from '../interfaces';
import { RefreshTokenDto, SignInDto, SignUpDto } from './dto';
import { InvalidRefeshTokenError } from './exceptions';
import { RefreshTokenIdsStorage } from './refresh-token-ids.storage';
import { RefreshTokenPayload } from './types';

@Injectable()
export class AuthenticationService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly hashingService: HashingService,
    private readonly jwtService: JwtService,
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
    private readonly refreshTokenIdsStorage: RefreshTokenIdsStorage,
  ) {}

  async signUp(signUpDto: SignUpDto) {
    try {
      const user = new User();

      user.email = signUpDto.email;
      user.password = await this.hashingService.hash(signUpDto.password);

      await this.userRepository.save(user);
    } catch (err) {
      if (err.code === ErrorCode.UNIQUE_CONSTRAINT_VIOLATION)
        throw new ConflictException();

      throw err;
    }
  }

  async signIn(signDto: SignInDto) {
    const user = await this.userRepository.findOneBy({
      email: signDto.email,
    });

    if (!user) throw new UnauthorizedException('User does not exists.');

    const isPasswordValid = await this.hashingService.compare(
      signDto.password,
      user.password,
    );

    if (!isPasswordValid)
      throw new UnauthorizedException('Incorrect password.');

    return this.generateTokens(user);
  }

  async refreshToken(refreshTokenDto: RefreshTokenDto) {
    try {
      const { sub, refreshTokenId } = await this.jwtService.verifyAsync<
        Pick<ActiveUserData, 'sub'> & RefreshTokenPayload
      >(refreshTokenDto.refreshToken, {
        secret: this.jwtConfiguration.secret,
        audience: this.jwtConfiguration.audience,
        issuer: this.jwtConfiguration.issuer,
      });

      const user = await this.userRepository.findOneByOrFail({
        id: sub,
      });

      const isRefreshTokenValid = await this.refreshTokenIdsStorage.validate(
        user.id,
        refreshTokenId,
      );

      if (isRefreshTokenValid) this.refreshTokenIdsStorage.invalide(user.id);
      else throw new Error('Refresh token is invaled.');

      return this.generateTokens(user);
    } catch (err) {
      if (err instanceof InvalidRefeshTokenError)
        throw new UnauthorizedException('Access denied.');

      throw new UnauthorizedException();
    }
  }

  async generateTokens(user: User) {
    const refreshTokenId = randomUUID();

    const [accessToken, refreshToken] = await Promise.all([
      this.asignToken<Partial<ActiveUserData>>(
        user.id,
        this.jwtConfiguration.accessTokenTtl,
        {
          email: user.email,
          role: user.role,
          permissions: user.permissions,
        },
      ),

      this.asignToken<RefreshTokenPayload>(
        user.id,
        this.jwtConfiguration.refreshTokenTtl,
        { refreshTokenId },
      ),
    ]);

    await this.refreshTokenIdsStorage.insert(user.id, refreshTokenId);

    return { accessToken, refreshToken };
  }

  private asignToken<T>(userId: number, expiresIn: number, payload?: T) {
    return this.jwtService.signAsync(
      {
        sub: userId,
        ...payload,
      },
      {
        audience: this.jwtConfiguration.audience,
        issuer: this.jwtConfiguration.audience,
        secret: this.jwtConfiguration.secret,
        expiresIn,
      },
    );
  }
}
