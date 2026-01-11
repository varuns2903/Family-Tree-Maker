import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(config: ConfigService) {
    super({
      clientID: config.getOrThrow('GITHUB_CLIENT_ID'),
      clientSecret: config.getOrThrow('GITHUB_CLIENT_SECRET'),
      callbackURL: config.getOrThrow('GITHUB_CALLBACK_URL'),
      scope: ['user:email'],
    });
  }

  async validate(_: string, __: string, profile: any) {
    const email =
      profile.emails?.find((e) => e.verified)?.value ||
      profile.emails?.[0]?.value;

    return {
      provider: 'github',
      providerId: profile.id,
      email,
      name: profile.displayName || profile.username,
      avatar: profile.photos?.[0]?.value,
    };
  }
}
