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

@Injectable()
export class AuthService {
  constructor(
    private readonly neo4j: Neo4jService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const user = await this.neo4j.write(
      `
      CREATE (u:User {
        id: $id,
        name: $name,
        email: $email,
        passwordHash: $passwordHash,
        authProvider: "local",
        createdAt: datetime()
      })
      RETURN u
      `,
      {
        id: uuid(),
        name: dto.name,
        email: dto.email,
        passwordHash,
      },
    );

    return this.issueTokens(user.records[0].get('u').properties);
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
