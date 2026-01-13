import jwt, { SignOptions } from "jsonwebtoken";
import { env } from "../config/env";

const accessTokenOptions: SignOptions = {
  expiresIn: env.JWT_ACCESS_TTL as SignOptions["expiresIn"]
};

const refreshTokenOptions: SignOptions = {
  expiresIn: env.JWT_REFRESH_TTL as SignOptions["expiresIn"]
};

export const signAccessToken = (userId: string) =>
  jwt.sign({ sub: userId }, env.JWT_ACCESS_SECRET, accessTokenOptions);

export const signRefreshToken = (userId: string) =>
  jwt.sign({ sub: userId }, env.JWT_REFRESH_SECRET, refreshTokenOptions);

export const verifyAccessToken = (token: string) =>
  jwt.verify(token, env.JWT_ACCESS_SECRET) as { sub: string };

export const verifyRefreshToken = (token: string) =>
  jwt.verify(token, env.JWT_REFRESH_SECRET) as { sub: string };
