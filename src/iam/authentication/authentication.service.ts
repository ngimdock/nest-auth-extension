import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { ErrorCode } from 'src/common/enum';
import { User } from 'src/users/entities';
import { Repository } from 'typeorm';
import jwtConfig from '../config/jwt.config';
import { HashingService } from '../hashing/hashing.service';
import { SignInDto, SignUpDto } from './dto';

@Injectable()
export class AuthenticationService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly hashingService: HashingService,
    private readonly jwrService: JwtService,
    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
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

    const accessToken = await this.jwrService.signAsync(
      {
        sub: user.id,
        email: user.email,
      },
      {
        audience: this.jwtConfiguration.audience,
        issuer: this.jwtConfiguration.audience,
        secret: this.jwtConfiguration.secret,
        expiresIn: this.jwtConfiguration.accessTokenTtl,
      },
    );

    return { accessToken };
  }
}
