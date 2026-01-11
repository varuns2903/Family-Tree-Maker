import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuid } from 'uuid';
import { ConfigService } from '@nestjs/config';
import { Neo4jService } from '../neo4j/neo4j.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { hashToken } from './utils/token-hash';
import { generateOtp, hashOtp } from './utils/otp';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { EmailService } from 'src/email/email.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly neo4j: Neo4jService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  async register(dto: RegisterDto) {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const existingUser = await this.neo4j.read(
      `MATCH (u:User { email: $email }) RETURN u`,
      { email: dto.email },
    );

    if (existingUser.records.length) {
      throw new BadRequestException('Email already registered');
    }

    const otp = generateOtp();
    const otpHash = hashOtp(otp);

    // Delete old OTP if exists
    await this.neo4j.write(
      `
    MATCH (e:EmailVerification { email: $email })
    DETACH DELETE e
    `,
      { email: dto.email },
    );

    await this.neo4j.write(
      `
    CREATE (e:EmailVerification {
      id: randomUUID(),
      email: $email,
      otpHash: $otpHash,
      attempts: 0,
      createdAt: datetime(),
      expiresAt: datetime() + duration('PT10M')
    })
    `,
      {
        email: dto.email,
        otpHash,
      },
    );

    await this.emailService.sendOtp(dto.email, otp);

    return {
      message: 'OTP sent to email',
    };
  }

  async verifyOtp(dto: VerifyOtpDto) {
    const otpHash = hashOtp(dto.otp);

    const result = await this.neo4j.read(
      `
    MATCH (e:EmailVerification { email: $email })
    RETURN e
    `,
      { email: dto.email },
    );

    if (!result.records.length) {
      throw new UnauthorizedException('OTP expired or invalid');
    }

    const verification = result.records[0].get('e').properties;

    if (verification.attempts >= 5) {
      throw new UnauthorizedException('Too many attempts');
    }

    if (verification.otpHash !== otpHash) {
      await this.neo4j.write(
        `
      MATCH (e:EmailVerification { email: $email })
      SET e.attempts = e.attempts + 1
      `,
        { email: dto.email },
      );
      throw new UnauthorizedException('Invalid OTP');
    }

    // Create user
    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.neo4j.write(
      `
    CREATE (u:User {
      id: randomUUID(),
      name: $name,
      email: $email,
      passwordHash: $passwordHash,
      authProvider: "local",
      status: "ACTIVE",
      createdAt: datetime()
    })
    RETURN u
    `,
      {
        name: dto.name,
        email: dto.email,
        passwordHash,
      },
    );

    // Cleanup OTP
    await this.neo4j.write(
      `
    MATCH (e:EmailVerification { email: $email })
    DETACH DELETE e
    `,
      { email: dto.email },
    );

    return this.issueTokens(user.records[0].get('u').properties);
  }

  async resendOtp(email: string) {
    const otp = generateOtp();
    const otpHash = hashOtp(otp);

    await this.neo4j.write(
      `
    MATCH (e:EmailVerification { email: $email })
    SET e.otpHash = $otpHash,
        e.attempts = 0,
        e.createdAt = datetime(),
        e.expiresAt = datetime() + duration('PT10M')
    `,
      { email, otpHash },
    );

    await this.emailService.sendOtp(email, otp);

    return { message: 'OTP resent successfully' };
  }

  async login(dto: LoginDto) {
    const result = await this.neo4j.read(
      `
      MATCH (u:User { email: $email })
      RETURN u
      `,
      { email: dto.email },
    );

    if (!result.records.length) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const user = result.records[0].get('u').properties;

    const isValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.issueTokens(user);
  }

  async refresh(payload: any, refreshToken: string) {
    const refreshTokenHash = hashToken(refreshToken);

    const result = await this.neo4j.read(
      `
    MATCH (u:User { id: $userId })-[:HAS_REFRESH_TOKEN]->(t:RefreshToken)
    WHERE t.tokenHash = $tokenHash
    RETURN u
    `,
      {
        userId: payload.sub,
        tokenHash: refreshTokenHash,
      },
    );

    if (!result.records.length) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = result.records[0].get('u').properties;

    // Rotate token (old one deleted in issueTokens)
    return this.issueTokens(user);
  }

  private async issueTokens(user: any) {
    const accessToken = this.jwt.sign(
      {
        sub: user.id,
        email: user.email,
        type: 'access',
      },
      {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        expiresIn: '15m',
      },
    );

    const refreshToken = this.jwt.sign(
      {
        sub: user.id,
        type: 'refresh',
        tokenId: crypto.randomUUID(),
      },
      {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: '30d',
      },
    );

    const refreshTokenHash = hashToken(refreshToken);

    // Remove old refresh tokens (rotation)
    await this.neo4j.write(
      `
    MATCH (u:User { id: $userId })-[:HAS_REFRESH_TOKEN]->(t:RefreshToken)
    DETACH DELETE t
    `,
      { userId: user.id },
    );

    // Store new hashed refresh token
    await this.neo4j.write(
      `
    MATCH (u:User { id: $userId })
    CREATE (t:RefreshToken {
      id: $id,
      tokenHash: $tokenHash,
      userId: $userId,
      createdAt: datetime(),
      expiresAt: datetime() + duration('P30D')
    })
    CREATE (u)-[:HAS_REFRESH_TOKEN]->(t)
    `,
      {
        id: crypto.randomUUID(),
        tokenHash: refreshTokenHash,
        userId: user.id,
      },
    );

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      accessToken,
      refreshToken,
    };
  }

  async logout(userId: string) {
    await this.neo4j.write(
      `
    MATCH (u:User { id: $userId })-[:HAS_REFRESH_TOKEN]->(t:RefreshToken)
    DETACH DELETE t
    `,
      { userId },
    );
  }
}
