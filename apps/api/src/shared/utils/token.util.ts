import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { randomBytes } from 'crypto';

export interface AccessTokenPayload {
  sub: string;
  role: string;
  jti?: string;
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  sub: string;
  jti?: string;
  iat?: number;
  exp?: number;
}

export const TokenUtil = {
  generateTokens: (userId: string, role: string) => {
    const accessJti = randomBytes(16).toString('hex');
    const refreshJti = randomBytes(16).toString('hex');

    const accessToken = jwt.sign(
      { sub: userId, role, jti: accessJti },
      env.JWT_ACCESS_SECRET,
      { expiresIn: env.JWT_ACCESS_EXPIRES_IN as any }
    );

    const refreshToken = jwt.sign(
      { sub: userId, jti: refreshJti },
      env.JWT_REFRESH_SECRET,
      { expiresIn: env.JWT_REFRESH_EXPIRES_IN as any }
    );

    return {
      accessToken,
      refreshToken,
      accessJti,
      refreshJti,
    };
  },

  verifyAccessToken: (token: string): AccessTokenPayload => {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
  },

  verifyRefreshToken: (token: string): RefreshTokenPayload => {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
  },
};
